import { ConversationRecord } from '../types';

const STORAGE_KEY = 'ecom_tool_history';
const MAX_RECORDS = 2;

export function generateHistoryId(): string {
  return `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function saveHistoryRecord(record: ConversationRecord): void {
  // Strip image data from the record itself before saving
  const cleanRecord = { ...record };
  if (cleanRecord.results) {
    cleanRecord.results = cleanRecord.results.map(r => {
      const { mainImageUrl, ...rest } = r as any;
      return rest;
    }) as any;
  }
  cleanRecord.imageUrls = undefined;

  try {
    const records = loadHistoryRecords();
    records.unshift(cleanRecord);
    if (records.length > MAX_RECORDS) {
      records.length = MAX_RECORDS;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    // If quota exceeded, aggressively trim and retry
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([cleanRecord]));
      } catch {}
    }
  }
}

/** Strip image data from records to keep localStorage slim */
function stripImages(records: ConversationRecord[]): ConversationRecord[] {
  for (const r of records) {
    if (r.results) {
      for (const result of r.results) {
        delete result.mainImageUrl;
      }
    }
    r.imageUrls = undefined;
  }
  return records;
}

export function loadHistoryRecords(): ConversationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const records: ConversationRecord[] = JSON.parse(raw);
      // Strip any lingering image data from previous versions
      return stripImages(records);
    }
  } catch {}
  return [];
}

export function deleteHistoryRecord(id: string): void {
  try {
    const records = loadHistoryRecords().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function exportHistoryAsJson(records: ConversationRecord[]): void {
  const data = JSON.stringify(records, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `对话历史_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSingleRecordAsJson(record: ConversationRecord): void {
  const data = JSON.stringify(record, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = record.timestamp.slice(0, 10);
  const typeLabel: Record<string, string> = {
    generate: '主图生成',
    produce: '图片生成',
    describe: '图片描述',
  };
  link.download = `对话记录_${typeLabel[record.taskType] || record.taskType}_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
