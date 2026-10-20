const EPS = 0.01;

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

export function moveAndCollide(body, solids, dt) {
  const prevX = body.x;
  const prevY = body.y;
  const result = { onGround: false, ground: null, hitCeiling: false, hitSide: false };

  body.x += body.vx * dt;
  body.y += body.vy * dt;

  for (const s of solids) {
    // нет пересечения по x — столкновения быть не может
    if (body.x >= s.x + s.w || body.x + body.w <= s.x) continue;

    const sBottom = s.y + s.h;
    const prevBottom = prevY + body.h;
    const bottom = body.y + body.h;

    // сверху: раньше низ героя был не ниже верха платформы, теперь дошёл до него
    if (body.vy >= 0 && prevBottom <= s.y + EPS && bottom >= s.y) {
      body.y = s.y - body.h;
      body.vy = 0;
      result.onGround = true;
      result.ground = s;
      continue;
    }

    // снизу: раньше голова была не выше низа платформы, теперь вошла в неё
    if (body.vy < 0 && prevY >= sBottom - EPS && body.y <= sBottom) {
      body.y = sBottom;
      body.vy = 0;
      result.hitCeiling = true;
      continue;
    }

    // сбоку: нужно пересечение и по Y
    if (bottom <= s.y + EPS || body.y >= sBottom - EPS) continue;

    const sPrevX = s.prevX ?? s.x;
    if (prevX + body.w <= sPrevX + EPS) {
      body.x = s.x - body.w;                 // герой был слева от платформы
    } else if (prevX >= sPrevX + s.w - EPS) {
      body.x = s.x + s.w;                    // герой был справа
    } else if (body.x + body.w / 2 < s.x + s.w / 2) {
      body.x = s.x - body.w;                 // уже внутри — выталкиваем к ближней стороне
    } else {
      body.x = s.x + s.w;
    }
    body.vx = 0;
    result.hitSide = true;
  }

  return result;
}