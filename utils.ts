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
  // We sort by timestamp descending (newest first)
  const consumes = item.usageHistory
    .filter(r => r.type === 'consume' || (r.type === 'adjust' && r.delta < 0))
    .sort((a, b) => b.timestamp - a.timestamp);

  // We need at least 2 points to calculate a rate, or at least 1 point + creation time?
  // Let's use a window of the last 30 days or last 5 consumptions for better accuracy
  // Simple MVP approach: Average daily consumption rate over available history
  
  if (consumes.length < 2) {
    // If we only have 1 consume event, we can compare it against creation time if it's old enough
    if (consumes.length === 1) {
      const firstConsume = consumes[0];
      const durationDays = (firstConsume.timestamp - item.createdAt) / (1000 * 60 * 60 * 24);
      const consumedAmount = Math.abs(firstConsume.delta);
      if (durationDays > 0 && consumedAmount > 0) {
        const rate = consumedAmount / durationDays;
        return Math.round(item.quantity / rate);
      }
    }
    return null;
  }

  // Calculate rate based on the span between the first recorded consume in our window and the last
  // We'll take up to 10 recent records
  const recentConsumes = consumes.slice(0, 10);
  const newest = recentConsumes[0];
  const oldest = recentConsumes[recentConsumes.length - 1];

  const timeSpanDays = (newest.timestamp - oldest.timestamp) / (1000 * 60 * 60 * 24);
  
  // Sum of items consumed in this interval (excluding the oldest one's delta because we need intervals between events)
  // Actually, standard burn rate: (Amount Consumed) / (Time Period)
  // Amount consumed between oldest and newest is the sum of deltas of all events from (oldest, newest]
  // Ideally: Time(newest) - Time(oldest). Amount = Sum of deltas of (newest...second_oldest).
  
  let totalConsumed = 0;
  for(let i = 0; i < recentConsumes.length - 1; i++) {
     totalConsumed += Math.abs(recentConsumes[i].delta);
  }

  // Avoid division by zero
  if (timeSpanDays < 0.1 || totalConsumed === 0) return null;

  const dailyRate = totalConsumed / timeSpanDays;
  
  return Math.round(item.quantity / dailyRate);
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 30) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}