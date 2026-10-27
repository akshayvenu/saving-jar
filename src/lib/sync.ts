import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { AppState } from 'react-native';

import { db } from '@/lib/firebase';
import { useJarStore, type SyncData } from '@/store/useJarStore';
import { useSyncStore } from '@/store/useSyncStore';
import type { Basket, Challenge, CurrencyCode, Jar, SortDir, SortKey, Transaction } from '@/types';

/**
 * Local-first cloud backup. AsyncStorage stays the working copy; this watches the store and
 * pushes changes to Firestore once they settle (and when the app is backgrounded), and pulls on
 * sign-in and when the app returns to the foreground.
 *
 * Layout:  users/{uid}                      jars, baskets, challenges, settings
 *          users/{uid}/transactions/{YYYY-MM}  { items: Transaction[] } (history grows, so bucketed)
 */

const DEV_UID = 'dev-user';
const DEBOUNCE_MS = 5000;
/** Firestore's web SDK queues offline writes in memory and never rejects them, so cap the wait. */
const NETWORK_TIMEOUT_MS = 15000;

const DATA_KEYS = [
  'jars',
  'baskets',
  'transactions',
  'challenges',
  'hiddenAccounts',
  'sortKey',
  'sortDir',
  'defaultCurrency',
  'hideAmounts',
] as const;

/** Bookkeeping kept per account so a restart doesn't re-upload everything. */
interface Meta {
  /** Local changes not yet confirmed by the cloud. */
  dirty: boolean;
  /** When the last unsynced local change was made (ms). */
  localAt: number;
  /** `clientUpdatedAt` of the cloud version we last pushed or pulled. */
  remoteAt: number;
  /** Fingerprints of what the cloud holds, so only changed documents are written. */
  mainHash: string;
  buckets: Record<string, string>;
}

const freshMeta = (): Meta => ({ dirty: false, localAt: 0, remoteAt: 0, mainHash: '', buckets: {} });

class OfflineError extends Error {}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new OfflineError('Timed out')), NETWORK_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function hash(value: unknown): string {
  const s = JSON.stringify(value);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${h}`;
}

function pickData(s: SyncData): SyncData {
  const out: Record<string, unknown> = {};
  for (const k of DATA_KEYS) out[k] = s[k];
  return out as unknown as SyncData;
}

const dataChanged = (a: SyncData, b: SyncData) => DATA_KEYS.some((k) => a[k] !== b[k]);

const hasLocalData = (s: SyncData) =>
  s.jars.length > 0 || s.transactions.length > 0 || s.challenges.length > 0;

const hashBuckets = (buckets: Record<string, Transaction[]>) =>
  Object.fromEntries(Object.entries(buckets).map(([month, items]) => [month, hash(items)]));

function toRemote(data: SyncData) {
  const { transactions, ...rest } = data;
  const buckets: Record<string, Transaction[]> = {};
  for (const t of transactions) (buckets[t.createdAt.slice(0, 7)] ??= []).push(t);
  return { main: { ...rest, schemaVersion: 1 }, buckets };
}

function fromRemote(main: Record<string, unknown>, buckets: Transaction[][]): SyncData {
  return {
    jars: (main.jars as Jar[]) ?? [],
    baskets: (main.baskets as Basket[]) ?? [],
    challenges: (main.challenges as Challenge[]) ?? [],
    transactions: buckets.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    hiddenAccounts: (main.hiddenAccounts as string[]) ?? [],
    sortKey: (main.sortKey as SortKey) ?? 'manual',
    sortDir: (main.sortDir as SortDir) ?? 'desc',
    defaultCurrency: (main.defaultCurrency as CurrencyCode) ?? 'INR',
    hideAmounts: main.hideAmounts === true,
  };
}

function unionById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map(local.map((x) => [x.id, x]));
  for (const r of remote) map.set(r.id, r);
  return [...map.values()];
}

/** First sign-in with pre-sync data on a device: keep both sides, the cloud wins on id clashes. */
function merge(local: SyncData, remote: SyncData): SyncData {
  return {
    ...remote,
    jars: unionById(local.jars, remote.jars),
    baskets: unionById(local.baskets, remote.baskets),
    challenges: unionById(local.challenges, remote.challenges),
    transactions: unionById(local.transactions, remote.transactions).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
  };
}

interface Engine {
  /** Pushes pending changes now. Resolves true when nothing is left unsynced. */
  flush: () => Promise<boolean>;
  /** Pushes pending changes, then pulls the latest from the cloud. */
  syncNow: () => Promise<void>;
}

let current: Engine | null = null;

/** True when there is nothing unsynced (also true when sync is off, e.g. the dev user). */
export const flushSync = async () => (current ? current.flush() : true);
export const syncNow = async () => {
  await current?.syncNow();
};

/** Starts syncing for a signed-in account. Returns a function that stops it. */
export function startSync(uid: string): () => void {
  if (uid === DEV_UID) {
    useSyncStore.setState({ enabled: false, status: 'idle' });
    return () => {};
  }
  useSyncStore.setState({ enabled: true, status: 'idle' });

  const metaKey = `jamjars-sync:${uid}`;
  const mainRef = doc(db, 'users', uid);
  const txCol = collection(db, 'users', uid, 'transactions');

  let meta = freshMeta();
  let stopped = false;
  /** Set while we write pulled data into the store so the subscriber doesn't call it a change. */
  let applying = false;
  /** Local data predates cloud sync (or its bookkeeping is gone): merge instead of overwrite. */
  let legacy = false;
  /** Bumped on every local change; lets a push tell whether more edits arrived mid-flight. */
  let seq = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Pushes and pulls run one at a time.
  let queue: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.then(fn);
    queue = run.catch(() => {});
    return run;
  };

  const saveMeta = () => {
    AsyncStorage.setItem(metaKey, JSON.stringify(meta)).catch(() => {});
  };

  const fail = (e: unknown) => {
    const code = (e as { code?: string })?.code;
    const offline = e instanceof OfflineError || code === 'unavailable';
    useSyncStore.setState({ status: offline ? 'offline' : 'error' });
  };

  const done = () => useSyncStore.setState({ status: 'idle', lastSyncedAt: Date.now() });

  async function push() {
    if (stopped || !meta.dirty) return;
    useSyncStore.setState({ status: 'syncing' });
    const startSeq = seq;
    const { main, buckets } = toRemote(pickData(useJarStore.getState()));
    const mainHash = hash(main);
    const bucketHashes = hashBuckets(buckets);

    const batch = writeBatch(db);
    let writes = 0;
    for (const [month, items] of Object.entries(buckets)) {
      if (bucketHashes[month] !== meta.buckets[month]) {
        batch.set(doc(txCol, month), { items });
        writes++;
      }
    }
    // Months that no longer have any transactions (e.g. after a jar was deleted).
    for (const month of Object.keys(meta.buckets)) {
      if (!(month in buckets)) {
        batch.delete(doc(txCol, month));
        writes++;
      }
    }
    if (writes > 0 || mainHash !== meta.mainHash) {
      const at = Date.now();
      batch.set(mainRef, { ...main, clientUpdatedAt: at });
      await withTimeout(batch.commit());
      meta.remoteAt = at;
    }
    meta.mainHash = mainHash;
    meta.buckets = bucketHashes;
    if (seq === startSeq) meta.dirty = false;
    saveMeta();
    done();
  }

  async function pull() {
    if (stopped) return;
    useSyncStore.setState({ status: 'syncing' });
    const snap = await withTimeout(getDoc(mainRef));

    if (!snap.exists()) {
      // Nothing in the cloud yet (or it was wiped): upload everything we have.
      if (hasLocalData(useJarStore.getState())) {
        meta = { ...freshMeta(), dirty: true, localAt: meta.localAt || Date.now() };
        await push();
      } else {
        done();
      }
      return;
    }

    const remote = snap.data();
    const remoteAt = Number(remote.clientUpdatedAt) || 0;
    const behind = remoteAt > meta.remoteAt;

    if (!behind && !legacy) {
      if (meta.dirty) await push();
      else done();
      return;
    }

    const txSnap = await withTimeout(getDocs(txCol));
    const remoteData = fromRemote(
      remote,
      txSnap.docs.map((d) => (d.data().items as Transaction[]) ?? []),
    );
    const baseline = toRemote(remoteData);
    const local = pickData(useJarStore.getState());

    let next = remoteData;
    let pushAfter = false;
    if (legacy) {
      next = merge(local, remoteData);
      pushAfter = true;
      legacy = false;
    } else if (meta.dirty && meta.localAt > remoteAt) {
      // Both sides changed and ours is newer: keep ours, and overwrite the cloud copy.
      meta = {
        ...meta,
        remoteAt,
        mainHash: '',
        buckets: Object.fromEntries(txSnap.docs.map((d) => [d.id, 'remote'])),
      };
      await push();
      return;
    }

    applying = true;
    try {
      useJarStore.getState().replaceData(next, uid);
    } finally {
      applying = false;
    }
    meta = {
      dirty: pushAfter,
      localAt: pushAfter ? Date.now() : meta.localAt,
      remoteAt,
      mainHash: hash(baseline.main),
      buckets: hashBuckets(baseline.buckets),
    };
    saveMeta();
    if (pushAfter) await push();
    else done();
  }

  async function init() {
    const raw = await AsyncStorage.getItem(metaKey);
    if (raw) {
      try {
        meta = { ...freshMeta(), ...JSON.parse(raw) };
      } catch {
        // Unreadable bookkeeping: treated like none.
      }
    }
    const state = useJarStore.getState();
    if (state.ownerUid && state.ownerUid !== uid) {
      // Local data belongs to someone else: start clean and take this account's cloud copy.
      applying = true;
      try {
        state.resetData(uid);
      } finally {
        applying = false;
      }
      meta = freshMeta();
      AsyncStorage.removeItem(metaKey).catch(() => {});
    } else {
      legacy = hasLocalData(state) && (!raw || !state.ownerUid);
      if (!state.ownerUid) useJarStore.setState({ ownerUid: uid });
    }
    await pull();
  }

  const unsubscribe = useJarStore.subscribe((state, prev) => {
    if (applying || stopped || !dataChanged(state, prev)) return;
    seq++;
    meta.dirty = true;
    meta.localAt = Date.now();
    saveMeta();
    clearTimeout(timer);
    timer = setTimeout(() => {
      enqueue(push).catch(fail);
    }, DEBOUNCE_MS);
  });

  const flush = async () => {
    clearTimeout(timer);
    try {
      await enqueue(push);
    } catch (e) {
      fail(e);
    }
    return !meta.dirty;
  };

  const appState = AppState.addEventListener('change', (next) => {
    if (next === 'active') enqueue(pull).catch(fail);
    else flush();
  });

  const engine: Engine = {
    flush,
    syncNow: async () => {
      await flush();
      await enqueue(pull).catch(fail);
    },
  };
  current = engine;
  enqueue(init).catch(fail);

  return () => {
    stopped = true;
    clearTimeout(timer);
    unsubscribe();
    appState.remove();
    if (current === engine) current = null;
    useSyncStore.setState({ status: 'idle' });
  };
}
