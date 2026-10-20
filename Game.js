import { Input } from './input.js';
import { Player } from './Player.js';
import { rectsOverlap } from './collision.js';
import { LEVEL, buildLevel } from './level.js';
import { KINDS, drawKind } from './entities.js';
import { loadBest, saveBest, isBetter } from './storage.js';

const MAX_DT = 1 / 30;       
const HOMEWORK_PENALTY = 5;  
const LAG_TIME = 3;          
const GOOD = ['ticket', 'popcorn', 'box'];
const FONT = '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.width = canvas.width;   
    this.height = canvas.height;

    this.state = 'ready';
    this.input = new Input(() => this.state === 'playing');
    this.rafId = 0;     
    this.last = null;   
    this.loop = this.loop.bind(this);

    this.best = loadBest();
    this.saveFailed = false;

    const b = ui.buttons;
    b.start.addEventListener('click', () => this.start());
    b.pause.addEventListener('click', () => this.pause());
    b.resume.addEventListener('click', () => this.resume());
    b.restart.addEventListener('click', () => this.restart());
    ui.again.addEventListener('click', () => this.restart());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); });
    window.addEventListener('blur', () => this.pause());

    this.reset();
    this.setState('ready');
    this.renderBest();
    this.render();
  }

  // цикл
  setState(state) {
    this.state = state;
    const b = this.ui.buttons;
    b.start.disabled = state !== 'ready';
    b.pause.disabled = state !== 'playing';
    b.resume.disabled = state !== 'paused';
    b.restart.disabled = state === 'ready';
    this.ui.screen.dataset.state = state;
    if (state !== 'won' && state !== 'lost') this.ui.panel.hidden = true;
    if (state === 'paused') b.resume.focus({ preventScroll: true });
  }

  // полный сброс
  reset() {
    const level = buildLevel(LEVEL);
    this.platforms = level.platforms;
    this.tokens = level.tokens;

    const first = this.platforms[0];
    this.player = new Player(first.x + 40, 0);
    this.player.y = first.y - this.player.h;

    this.counts = { ticket: 0, popcorn: 0, box: 0 };
    this.time = LEVEL.timeLimit;
    this.popups = [];
    this.input.clear();
  }

  begin() {
    this.stopLoop();
    this.reset();
    this.setState('playing');
    this.startLoop();
  }

  start() {
    if (this.state !== 'ready') return;
    this.begin();
  }

  restart() {
    if (this.state === 'ready') return;
    this.begin();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.stopLoop();
    this.input.clear();
    this.setState('paused');
    this.render();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.setState('playing');
    this.startLoop();
  }

  startLoop() {
    if (this.rafId) return;
    this.last = null;
    this.rafId = requestAnimationFrame(this.loop);
  }

  stopLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  loop(now) {
    this.rafId = 0;
    if (this.state !== 'playing') return;

    const dt = this.last === null ? 0 : Math.min((now - this.last) / 1000, MAX_DT);
    this.last = now;

    this.update(dt);
    this.render();
    this.input.endFrame();

    if (this.state === 'playing') this.rafId = requestAnimationFrame(this.loop);
  }

  // логика
  get items() {
    return this.counts.ticket + this.counts.popcorn + this.counts.box;
  }

  isComplete() {
    return GOOD.every((k) => this.counts[k] >= LEVEL.need[k]);
  }

  update(dt) {
    if (this.state !== 'playing') return;

    this.time -= dt;
    for (const p of this.platforms) p.update(dt);
    for (const t of this.tokens) t.sync();

    const player = this.player;
    player.update(dt, this.input, this.platforms);
    player.x = Math.min(this.width - player.w, player.x);

    for (const t of this.tokens) {
      if (t.taken) continue;
      const box = { x: t.x + 4, y: t.y + 4, w: t.w - 8, h: t.h - 8 };
      if (rectsOverlap(player, box)) this.touch(t);
    }

    for (const p of this.popups) { p.life -= dt; p.y -= 36 * dt; }
    this.popups = this.popups.filter((p) => p.life > 0);

    if (this.isComplete()) return this.finish(true, 'Коллекция собрана!');
    if (player.y > this.height + 60) return this.finish(false, 'Герой упал');
    if (player.x + player.w < 0) return this.finish(false, 'Платформа унесла героя за край экрана');
    if (this.time <= 0) { this.time = 0; return this.finish(false, 'Время вышло'); }
  }

  touch(t) {
    t.taken = true; // исчезновение предмета
    switch (t.kind) {
      case 'ticket':
      case 'popcorn':
      case 'box':
        this.counts[t.kind] += 1;
        this.popup(`+1 ${KINDS[t.kind].one}`, '#00e054');
        break;
      case 'homework':
        this.time -= HOMEWORK_PENALTY;
        this.popup(`−${HOMEWORK_PENALTY} с`, '#ff4d4d');
        break;
      case 'lag':
        this.player.slow(LAG_TIME);
        this.popup('Лаг!', '#e8e8e8');
        break;
      case 'spoiler': {
        const owned = GOOD.filter((k) => this.counts[k] > 0);
        if (owned.length === 0) { this.popup('Спойлер мимо', '#b86bff'); break; }
        const kind = owned[Math.floor(Math.random() * owned.length)];
        this.counts[kind] -= 1;
        this.popup(`Спойлер! −1 ${KINDS[kind].one}`, '#b86bff');
        break;
      }
    }
  }

  popup(text, color) {
    this.popups.push({ text, color, x: this.player.x + this.player.w / 2, y: this.player.y - 8, life: 1 });
  }

  finish(won, reason) {
    this.stopLoop();
    this.input.clear();
    this.setState(won ? 'won' : 'lost');

    // рекорд
    const record = { items: this.items, time: Math.max(0, this.time) };
    let newRecord = false;
    if (record.items > 0 && isBetter(record, this.best)) {
      this.best = record;
      newRecord = true;
      this.saveFailed = !saveBest(record);
    }
    this.renderBest();
    this.showResult(won, reason, newRecord);
  }

  bestText() {
    return this.best
      ? `Лучший результат: ${this.best.items} предм.`
      : 'Лучший результат: пока нет';
  }

  renderBest() {
    this.ui.bestLine.textContent = this.bestText();
  }

  showResult(won, reason, newRecord) {
    const { panel, title, text, stats, resultBest, again } = this.ui;
    title.textContent = won ? 'Победа!' : 'Поражение';
    title.className = won ? 'is-win' : 'is-lose';
    text.textContent = reason;

    const rows = [];
    for (const k of GOOD) rows.push([KINDS[k].name, `${this.counts[k]}/${LEVEL.need[k]}`]);
    rows.push(['Осталось времени', `${Math.max(0, this.time).toFixed(1)} с`]);

    stats.replaceChildren(...rows.map(([label, value]) => {
      const li = document.createElement('li');
      const span = document.createElement('span');
      const strong = document.createElement('strong');
      span.textContent = label;
      strong.textContent = value;
      li.append(span, strong);
      return li;
    }));

    let line = newRecord ? 'Новый рекорд! ' : '';
    line += this.bestText();
    if (this.saveFailed) line += '. Рекорд не сохранён: хранилище браузера недоступно';
    resultBest.textContent = line;

    panel.hidden = false;
    again.focus({ preventScroll: true });
  }

  // отрисовка
  render() {
    const { ctx } = this;
    this.drawBackground();
    for (const p of this.platforms) p.draw(ctx);
    for (const t of this.tokens) t.draw(ctx);
    this.player.draw(ctx);
    this.drawPopups();
    this.drawHud();
    if (this.state === 'ready') {
      this.drawOverlay('Нажми «Старт»', `Собери билеты в кино, попкорн и коробки с фильмами за ${LEVEL.timeLimit} секунд`);
    } else if (this.state === 'paused') {
      this.drawOverlay('Пауза', 'Нажми «Продолжить»');
    }
  }

  drawBackground() {
    const { ctx, width, height } = this;
    ctx.fillStyle = '#14181c';
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width / 2, height * 0.85, 40, width / 2, height * 0.85, width * 0.6);
    glow.addColorStop(0, 'rgba(64, 188, 244, .14)');
    glow.addColorStop(1, 'rgba(20, 24, 28, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const vig = ctx.createLinearGradient(0, 0, width, 0);
    vig.addColorStop(0, 'rgba(0,0,0,.45)');
    vig.addColorStop(0.2, 'rgba(0,0,0,0)');
    vig.addColorStop(0.8, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }

  drawPopups() {
    const { ctx } = this;
    ctx.textAlign = 'center';
    ctx.font = `700 18px ${FONT}`;
    for (const p of this.popups) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  drawHud() {
    const { ctx, width, height } = this;

    ctx.fillStyle = 'rgba(20, 24, 28, .88)';
    ctx.fillRect(0, 0, width, 72);
    ctx.fillStyle = '#2c3440';
    ctx.fillRect(0, 72, width, 1);

    // счётчики
    ctx.textAlign = 'left';
    GOOD.forEach((kind, i) => {
      const x = 24 + i * 140;
      drawKind(ctx, kind, x, 22, 28);
      const done = this.counts[kind] >= LEVEL.need[kind];
      ctx.fillStyle = done ? '#00e054' : '#ffffff';
      ctx.font = `700 20px ${FONT}`;
      ctx.fillText(`${this.counts[kind]}/${LEVEL.need[kind]}`, x + 38, 44);
    });

    // время
    const frac = Math.max(0, this.time) / LEVEL.timeLimit;
    const color = frac > 0.5 ? '#00e054' : frac > 0.2 ? '#ff8000' : '#ff4d4d';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 26px ${FONT}`;
    ctx.fillText(`${Math.max(0, this.time).toFixed(1)} с`, width - 24, 40);
    ctx.fillStyle = '#2c3440';
    ctx.fillRect(width - 224, 52, 200, 6);
    ctx.fillStyle = color;
    ctx.fillRect(width - 224, 52, 200 * frac, 6);

    if (this.player.slowTime > 0) {
      ctx.fillStyle = '#e8e8e8';
      ctx.font = `600 14px ${FONT}`;
      ctx.fillText(`Лаг: ${this.player.slowTime.toFixed(1)} с`, width - 24, 96);
    }

  }

  drawOverlay(title, subtitle) {
    const { ctx, width, height } = this;
    ctx.fillStyle = 'rgba(20, 24, 28, .78)';
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 32px ${FONT}`;
    ctx.fillText(title, width / 2, height / 2 - 6);
    ctx.fillStyle = '#99aabb';
    ctx.font = `16px ${FONT}`;
    ctx.fillText(subtitle, width / 2, height / 2 + 26);
  }
}