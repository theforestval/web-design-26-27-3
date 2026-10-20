import { moveAndCollide } from './collision.js';

const MAX_SPEED = 280;        // макс. горизонтальная скорость
const GROUND_ACCEL = 2600;    // разгон на земле
const GROUND_FRICTION = 3000; // торможение на земле без ввода
const AIR_ACCEL = 1500;       // управление в воздухе
const AIR_FRICTION = 400;     // сопротивление в воздухе
const JUMP_SPEED = 640;       // начальная скорость прыжка вверх
const GRAVITY = 1800;         // ускорение свободного падения
const MAX_FALL_SPEED = 900;   // предел скорости падения
const SLOW_FACTOR = 0.5;      // во сколько раз «лаг» замедляет бег

const FONT = '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

// палитра героини
const SKIN       = '#f2c49b';
const SKIN_SHADE = '#e0ac82';
const PJ_TOP     = '#ff9ec4';   
const PJ_TOP_DK  = '#e87aa8';   
const PJ_PANTS   = '#f27fb0';   
const PJ_STRIPE  = '#ffd1e3';   
const SLIPPER    = '#ff9f43';
const SLIPPER_DK = '#e07b1f';
const HAIR       = '#f06aa8';   
const HAIR_DK    = '#c94f86';   
const WHITE      = '#ffffff';

function approach(value, target, maxDelta) {
  if (value < target) return Math.min(value + maxDelta, target);
  if (value > target) return Math.max(value - maxDelta, target);
  return value;
}

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 32;
    this.h = 48;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.ground = null;
    this.facing = 1;
    this.slowTime = 0;
  }

  slow(seconds) {
    this.slowTime = Math.max(this.slowTime, seconds);
  }

  update(dt, input, solids) {
    // платформа под ногами несёт героя вместе с собой
    if (this.ground) this.x += this.ground.x - this.ground.prevX;

    this.slowTime = Math.max(0, this.slowTime - dt);
    const maxSpeed = MAX_SPEED * (this.slowTime > 0 ? SLOW_FACTOR : 1);

    const dir = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    const accel = this.onGround ? GROUND_ACCEL : AIR_ACCEL;
    const friction = this.onGround ? GROUND_FRICTION : AIR_FRICTION;
    if (dir !== 0) {
      this.vx = approach(this.vx, dir * maxSpeed, accel * dt);
      this.facing = dir;
    } else {
      this.vx = approach(this.vx, 0, friction * dt);
    }

    // прыжок только с опоры и только по новому нажатию
    if (input.wasPressed('jump') && this.onGround) {
      this.vy = -JUMP_SPEED;
      this.onGround = false;
    }

    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL_SPEED);

    const hit = moveAndCollide(this, solids, dt);
    this.onGround = hit.onGround;
    this.ground = hit.ground;
  }

  draw(ctx) {
    const { x, y, w, h } = this;
    const asleep = this.slowTime > 0;

    ctx.save();

    // тапочки
    ctx.fillStyle = SLIPPER;
    ctx.fillRect(x + 2, y + h - 5, 12, 5);
    ctx.fillRect(x + w - 14, y + h - 5, 12, 5);
    ctx.fillStyle = SLIPPER_DK;
    ctx.fillRect(x + 2, y + h - 2, 12, 2);
    ctx.fillRect(x + w - 14, y + h - 2, 12, 2);

    // штаны
    ctx.fillStyle = PJ_PANTS;
    ctx.fillRect(x + 4, y + h - 19, w - 8, 14);
    ctx.fillStyle = PJ_STRIPE;
    for (let sx = x + 8; sx < x + w - 4; sx += 8) {
      ctx.fillRect(sx, y + h - 19, 2, 14);
    }

    // куртка
    ctx.fillStyle = PJ_TOP;
    ctx.fillRect(x + 2, y + 17, w - 4, h - 36);

    // отворот
    ctx.fillStyle = PJ_TOP_DK;
    ctx.fillRect(x + 2, y + 17, w - 4, 5);

    // пуговицы
    ctx.fillStyle = WHITE;
    for (let by = y + 28; by < y + h - 22; by += 9) {
      ctx.beginPath();
      ctx.arc(x + w / 2, by, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // карман
    ctx.fillStyle = PJ_TOP_DK;
    ctx.fillRect(x + w - 13, y + h - 27, 9, 7);

    // руки
    ctx.fillStyle = PJ_TOP;
    ctx.fillRect(x - 2, y + 21, 5, h - 36);
    ctx.fillRect(x + w - 3, y + 21, 5, h - 36);
    ctx.fillStyle = SKIN;
    ctx.fillRect(x - 2, y + h - 17, 5, 5);
    ctx.fillRect(x + w - 3, y + h - 17, 5, 5);

    // волосы
    ctx.fillStyle = HAIR;

    // левая коса
    ctx.beginPath();
    ctx.arc(x + 4, y + 12, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 3, y + 17, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 2, y + 21, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = HAIR_DK;
    ctx.beginPath();
    ctx.arc(x + 1, y + 25, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // правая коса
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.arc(x + w - 4, y + 12, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 3, y + 17, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 2, y + 21, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = HAIR_DK;
    ctx.beginPath();
    ctx.arc(x + w - 1, y + 25, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // колпак
    ctx.fillStyle = PJ_TOP;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 9);          
    ctx.lineTo(x + w - 8, y + 9);       
    ctx.lineTo(x + w / 2 + 3, y + 1);
    ctx.closePath();
    ctx.fill();

    // помпон
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(x + w / 2 + 3, y + 1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // голова
    ctx.fillStyle = SKIN;
    ctx.fillRect(x + 8, y + 9, w - 16, 13);

    // тень под подбородком
    ctx.fillStyle = SKIN_SHADE;
    ctx.fillRect(x + 8, y + 20, w - 16, 2);

    // волосы
    ctx.fillStyle = HAIR;
    // основная масса волос по бокам
    ctx.fillRect(x + 7, y + 9, 3, 12);       
    ctx.fillRect(x + w - 10, y + 9, 3, 12);
    // чёлка поверх верхней части лица
    ctx.fillRect(x + 9, y + 9, w - 18, 3);
    // зубчики чёлки — не доходят до линии глаз
    ctx.fillStyle = HAIR_DK;
    ctx.fillRect(x + 10, y + 12, 3, 2);
    ctx.fillRect(x + 16, y + 12, 3, 2);
    ctx.fillRect(x + 22, y + 12, 3, 2);

    // лицо
    // румянец
    ctx.fillStyle = 'rgba(255, 120, 120, .55)';
    ctx.fillRect(x + (this.facing === 1 ? 24 : 8), y + 18, 4, 2);

    // «z-z-z» при лаге
    if (asleep) {
      ctx.fillStyle = '#e8e8e8';
      ctx.font = `700 10px ${FONT}`;
      ctx.fillText('z', x + w + 2, y + 8);
      ctx.fillText('z', x + w + 8, y);
    }

    ctx.restore();
  }
}