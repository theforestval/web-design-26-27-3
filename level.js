import { Platform, Token } from './entities.js';

export const LEVEL = {
  name: 'Вечерний сеанс',
  timeLimit: 40,
  need: { ticket: 3, popcorn: 3, box: 3 },

   // скорости рядов платформ
  tiers: [
    { y: 440, speed: 100 }, 
    { y: 360, speed: 120 }, 
    { y: 280, speed: 140 }, 
  ],

  // общие параметры физики 
  layout: { startX: 40, startHop: 0.8, minHop: 1.3, R: 780, gap: 50 },

  // платформы 
  route: [
    [0, 300], [1, 200], [2, 220], [2, 200], [1, 200],
    [2, 200], [2, 220], [1, 200], [0, 220], [1, 200],
    [2, 200], [2, 220], [1, 200], [2, 200], [2, 220],
    [1, 200], [0, 220], [1, 200], [2, 200], [2, 200],
  ],

  // предметы 
  tokens: [
    [1, 'ticket', 0],
    [2, 'popcorn', 70],
    [3, 'homework', 0],
    [4, 'box', 0],
    [5, 'lag', 0],
    [6, 'ticket', 70],
    [7, 'popcorn', 0],
    [8, 'box', 0],
    [9, 'spoiler', 0],
    [10, 'box', 70],
    [11, 'homework', 0],
    [12, 'ticket', 0],
    [13, 'popcorn', 70],
    [14, 'spoiler', 0],
    [15, 'lag', 0],
    [16, 'ticket', 0],
    [17, 'popcorn', 0],
    [18, 'homework', 0],
    [19, 'box', 70],
  ],
};

export function buildLevel(cfg = LEVEL) {
  const { startX, startHop, minHop, R, gap } = cfg.layout;
  const xs = [];
  const hops = []; 

  cfg.route.forEach(([tier, w], k) => {
    const v = cfg.tiers[tier].speed;
    if (k === 0) {
      xs[k] = startX;
    } else {
      const [prevTier, prevW] = cfg.route[k - 1];
      xs[k] = xs[k - 1] + prevW + gap + (v - cfg.tiers[prevTier].speed) * hops[k - 1];
    }
    const earliest = k === 0 ? startHop : hops[k - 1] + minHop;
    hops[k] = Math.max(earliest, (xs[k] + w - R) / v);
  });

  const platforms = cfg.route.map(([tier, w], k) =>
    new Platform(xs[k], cfg.tiers[tier].y, w, -cfg.tiers[tier].speed));

  const tokens = cfg.tokens.map(([k, kind, lift]) =>
    new Token(kind, platforms[k], (platforms[k].w - 28) / 2, lift));

  return { platforms, tokens };
}