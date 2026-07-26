export type ActivityKind = 'deploy' | 'join' | 'post' | 'take_down' | 'settings' | 'error';

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  at: number;
};

const KEY = 'pulseboard:activity';

export function loadActivity(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivityItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushActivity(kind: ActivityKind, title: string, detail?: string) {
  const next: ActivityItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    title,
    detail,
    at: Date.now(),
  };
  const list = [next, ...loadActivity()].slice(0, 80);
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('pulseboard:activity'));
  return next;
}

export function clearActivity() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('pulseboard:activity'));
}
