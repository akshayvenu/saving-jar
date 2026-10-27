import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';

interface SyncState {
  /** False for the dev "Skip login" user, which has no cloud account. */
  enabled: boolean;
  status: SyncStatus;
  /** Epoch ms of the last successful push or pull. */
  lastSyncedAt?: number;
}

/** Not persisted: reflects what the sync engine is doing right now. */
export const useSyncStore = create<SyncState>()(() => ({ enabled: true, status: 'idle' }));
