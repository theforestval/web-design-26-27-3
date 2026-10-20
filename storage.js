const KEY = 'cinephile.best.v1';

export function isBetter(a, b) {
  if (!b) return true;
  return a.items > b.items || (a.items === b.items && a.time > b.time);
}

export function loadBest() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Number.isFinite(data?.items) && Number.isFinite(data?.time) && data.items >= 0 && data.time >= 0) {
      return { items: data.items, time: data.time };
    }
  } catch (err) {
    console.warn('Не удалось прочитать рекорд:', err);
  }
  return null;
}

export function saveBest(record) {
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
    return true;
  } catch (err) {
    console.warn('Не удалось сохранить рекорд:', err);
    return false;
  }
}
