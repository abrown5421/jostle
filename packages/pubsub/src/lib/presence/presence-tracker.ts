export type PresenceStatus = 'online' | 'away' | 'offline';

export interface PresenceTrackerOptions {
  readonly awayTimeoutMs: number;
  readonly onStatusChange: (subjectId: string, status: PresenceStatus) => void;
}

interface PresenceRecord {
  connectionCount: number;
  status: PresenceStatus;
  awayTimer: ReturnType<typeof setTimeout> | null;
}

export interface PresenceTracker {
  readonly recordConnect: (subjectId: string) => void;
  readonly recordDisconnect: (subjectId: string) => void;
  readonly recordActivity: (subjectId: string) => void;
  readonly getStatus: (subjectId: string) => PresenceStatus;
  readonly dispose: () => void;
}

export const createPresenceTracker = ({
  awayTimeoutMs,
  onStatusChange,
}: PresenceTrackerOptions): PresenceTracker => {
  const records = new Map<string, PresenceRecord>();

  const clearAwayTimer = (record: PresenceRecord): void => {
    if (record.awayTimer) clearTimeout(record.awayTimer);
    record.awayTimer = null;
  };

  const setStatus = (subjectId: string, record: PresenceRecord, status: PresenceStatus): void => {
    if (record.status === status) return;
    record.status = status;
    onStatusChange(subjectId, status);
  };

  const scheduleAwayTimer = (subjectId: string, record: PresenceRecord): void => {
    clearAwayTimer(record);
    record.awayTimer = setTimeout(() => setStatus(subjectId, record, 'away'), awayTimeoutMs);
  };

  const getOrCreateRecord = (subjectId: string): PresenceRecord => {
    const existing = records.get(subjectId);
    if (existing) return existing;
    const created: PresenceRecord = { connectionCount: 0, status: 'offline', awayTimer: null };
    records.set(subjectId, created);
    return created;
  };

  return {
    recordConnect: (subjectId) => {
      const record = getOrCreateRecord(subjectId);
      record.connectionCount += 1;
      setStatus(subjectId, record, 'online');
      scheduleAwayTimer(subjectId, record);
    },

    recordDisconnect: (subjectId) => {
      const record = records.get(subjectId);
      if (!record) return;
      record.connectionCount = Math.max(0, record.connectionCount - 1);
      if (record.connectionCount === 0) {
        clearAwayTimer(record);
        setStatus(subjectId, record, 'offline');
        records.delete(subjectId);
      }
    },

    recordActivity: (subjectId) => {
      const record = records.get(subjectId);
      if (!record || record.connectionCount === 0) return;
      setStatus(subjectId, record, 'online');
      scheduleAwayTimer(subjectId, record);
    },

    getStatus: (subjectId) => records.get(subjectId)?.status ?? 'offline',

    dispose: () => {
      records.forEach(clearAwayTimer);
      records.clear();
    },
  };
};