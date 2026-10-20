export const KINDS = {
  ticket:   { good: true,  name: 'Билеты',  one: 'билет',   color: '#ff8000' },
  popcorn:  { good: true,  name: 'Попкорн', one: 'попкорн', color: '#fff1c9' },
  box:      { good: true,  name: 'Коробка', one: 'коробка', color: '#40bcf4' },
  homework: { good: false, name: 'Домашка', one: 'домашка', color: '#ff4d4d' },
  lag:      { good: false, name: 'Лаг',     one: 'лаг',     color: '#e8e8e8' },
  spoiler:  { good: false, name: 'Спойлер', one: 'спойлер', color: '#b86bff' },
};

const FONT = '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

export function drawKind(ctx, kind, x, y, size = 28) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 28, size / 28);

  switch (kind) {
    case 'ticket':
      ctx.fillStyle = KINDS.ticket.color;
      ctx.fillRect(0, 6, 28, 16);
      ctx.fillStyle = '#14181c';
      ctx.beginPath(); ctx.arc(0, 14, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(28, 14, 4, 0, Math.PI * 2); ctx.fill();
      for (let py = 8; py < 21; py += 4) ctx.fillRect(18, py, 2, 2);
      break;

    case 'popcorn':
      ctx.fillStyle = KINDS.popcorn.color;
      ctx.beginPath(); ctx.arc(8, 10, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(14, 7, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(20, 10, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(6, 13, 16, 15);
      ctx.fillStyle = '#ff4d4d';
      ctx.fillRect(9, 13, 3, 15);
      ctx.fillRect(16, 13, 3, 15);
      break;

    case 'box':
      ctx.fillStyle = 'rgba(64, 188, 244, .22)';
      ctx.fillRect(2, 0, 24, 28);

      ctx.fillStyle = KINDS.box.color;
      ctx.beginPath(); ctx.arc(14, 14, 9, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, .45)';
      ctx.beginPath(); ctx.arc(11, 11, 3.5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(20, 24, 28, .85)';
      ctx.beginPath(); ctx.arc(14, 14, 2.2, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = KINDS.box.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(2.75, 0.75, 22.5, 26.5);

      ctx.fillStyle = 'rgba(64, 188, 244, .55)';
      ctx.fillRect(2, 0, 24, 3);
      break;

    case 'homework':
      ctx.fillStyle = KINDS.homework.color;
      ctx.fillRect(3, 0, 22, 28);
      ctx.fillStyle = '#14181c';
      for (let py = 4; py < 26; py += 6) ctx.fillRect(1, py, 5, 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('ДЗ', 15, 19);
      break;

    case 'lag':
      ctx.fillStyle = '#2c3440';
      ctx.fillRect(0, 0, 28, 28);
      ctx.strokeStyle = KINDS.lag.color;
      ctx.lineWidth = 2;
      for (const r of [6, 11, 16]) {
        ctx.beginPath(); ctx.arc(14, 23, r, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke();
      }
      ctx.fillStyle = KINDS.lag.color;
      ctx.beginPath(); ctx.arc(14, 23, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ff4d4d';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(3, 25); ctx.lineTo(25, 3); ctx.stroke();
      break;

    case 'spoiler':
      ctx.fillStyle = KINDS.spoiler.color;
      ctx.fillRect(2, 2, 24, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 20px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('!', 14, 22);
      break;
  }
  ctx.restore();
}

export class Platform {
  constructor(x, y, w, vx) {
    this.x = x;
    this.y = y;
    this.prevX = x;   
    this.w = w;
    this.h = 22;
    this.vx = vx;    
  }

  update(dt) {
    this.prevX = this.x;
    this.x += this.vx * dt;
  }

  draw(ctx) {
    if (this.x > 1000 || this.x + this.w < -10) return;
    ctx.fillStyle = '#2c3440';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = '#00e054';
    ctx.fillRect(this.x, this.y, this.w, 4);
    ctx.fillStyle = '#14181c';
    for (let px = this.x + 8; px < this.x + this.w - 14; px += 16) ctx.fillRect(px, this.y + 11, 8, 6);
  }
}

export class Token {
  constructor(kind, platform, ox, lift) {
    this.kind = kind;
    this.platform = platform;
    this.ox = ox;      
    this.lift = lift;   
    this.w = 28;
    this.h = 28;
    this.taken = false; 
    this.sync();
  }

  get good() { return KINDS[this.kind].good; }

  sync() {
    this.x = this.platform.x + this.ox;
    this.y = this.platform.y - this.h - this.lift;
  }

  draw(ctx) {
    if (this.taken || this.x > 1000 || this.x + this.w < -10) return;
    drawKind(ctx, this.kind, this.x, this.y);
  }
}
