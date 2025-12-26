import { Item, UsageRecord } from './types';

/**
 * Generates a UUID v4 string.
 * Uses crypto.randomUUID if available (Secure Contexts), falls back to Math.random otherwise.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback for non-secure contexts (e.g., HTTP on LAN)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Calculates the estimated days remaining for an item based on its consumption history.
 * Returns null if there isn't enough data to predict.
 */
export function calculateDaysRemaining(item: Item): number | null {
  if (item.quantity <= 0) return 0;
  
  // Filter for consumption events only (negative delta)
  const consumes = item.usageHistory
    .filter(r => r.type === 'consume' || (r.type === 'adjust' && r.delta < 0))
    .sort((a, b) => b.timestamp - a.timestamp);

  if (consumes.length === 0) return null;

  // Simple prediction: Use creation time as baseline if only one consume event
  if (consumes.length === 1) {
    const firstConsume = consumes[0];
    const durationMs = firstConsume.timestamp - item.createdAt;
    const durationDays = durationMs / (1000 * 60 * 60 * 24);
    const consumedAmount = Math.abs(firstConsume.delta);
    
    // Minimum 12 hours check to avoid extreme rates on instant consumption
    if (durationMs > 1000 * 60 * 60 * 12 && consumedAmount > 0) {
      const rate = consumedAmount / durationDays;
      return Math.round(item.quantity / rate);
    }
    return null;
  }

  // Multi-point prediction
  const recentConsumes = consumes.slice(0, 10);
  const newest = recentConsumes[0];
  const oldest = recentConsumes[recentConsumes.length - 1];

  // If all consumptions happened in the same minute, we can't reliably predict a daily rate
  const timeSpanDays = (newest.timestamp - oldest.timestamp) / (1000 * 60 * 60 * 24);
  
  let totalConsumed = 0;
  // Sum deltas between events
  for(let i = 0; i < recentConsumes.length - 1; i++) {
     totalConsumed += Math.abs(recentConsumes[i].delta);
  }

  // Avoid division by zero or extremely small time spans
  if (timeSpanDays < 0.05 || totalConsumed === 0) {
    // Fallback: Check if there's enough time between creation and the latest consume
    const totalLifeDays = (newest.timestamp - item.createdAt) / (1000 * 60 * 60 * 24);
    const allConsumed = consumes.reduce((acc, r) => acc + Math.abs(r.delta), 0);
    if (totalLifeDays > 0.5 && allConsumed > 0) {
      const dailyRate = allConsumed / totalLifeDays;
      return Math.round(item.quantity / dailyRate);
    }
    return null;
  }

  const dailyRate = totalConsumed / timeSpanDays;
  return Math.round(item.quantity / dailyRate);
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days === 1) return '昨天';
  if (days < 30) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}