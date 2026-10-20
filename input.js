const KEY_MAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', KeyW: 'jump', ArrowUp: 'jump',
};

export class Input {
  constructor(isActive = () => true) {
    this.isActive = isActive;
    this.keys = new Set();    // удерживаемые клавиши клавиатуры
    this.touch = new Set();   // удерживаемые экранные кнопки
    this.pressedThisFrame = new Set();
    this.resets = [];         // сброс состояния экранных кнопок

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', () => this.clear());
  }

  press(source, action) {
    if (!this.isDown(action)) this.pressedThisFrame.add(action);
    source.add(action);
  }

  onKeyDown(e) {
    if (!this.isActive()) return;
    const action = KEY_MAP[e.code];
    if (!action) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    e.preventDefault();
    if (e.repeat) return;
    this.press(this.keys, action);
  }

  onKeyUp(e) {
    const action = KEY_MAP[e.code];
    if (!action) return;
    if (this.isActive()) e.preventDefault();
    this.keys.delete(action);
  }

  bindTouch(el, action) {
    const ids = new Set();

    const release = () => {
      ids.clear();
      this.touch.delete(action);
      el.classList.remove('is-down');
    };

    el.addEventListener('pointerdown', (e) => {
      if (!this.isActive()) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch {}
      ids.add(e.pointerId);
      this.press(this.touch, action);
      el.classList.add('is-down');
    });

    const up = (e) => {
      ids.delete(e.pointerId);
      if (ids.size === 0) release();
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());

    this.resets.push(release);
  }

  isDown(action) { return this.keys.has(action) || this.touch.has(action); }

  wasPressed(action) { return this.pressedThisFrame.has(action); }

  endFrame() { this.pressedThisFrame.clear(); }

  clear() {
    this.keys.clear();
    this.touch.clear();
    this.pressedThisFrame.clear();
    for (const release of this.resets) release();
  }
}