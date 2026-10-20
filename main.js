import { Game } from './Game.js';

const $ = (id) => document.getElementById(id);

const ui = {
  screen: $('screen'),
  panel: $('result'),
  title: $('result-title'),
  text: $('result-text'),
  stats: $('result-stats'),
  resultBest: $('result-best'),
  again: $('result-restart'),
  bestLine: $('best'),
  buttons: {
    start: $('btn-start'),
    pause: $('btn-pause'),
    resume: $('btn-resume'),
    restart: $('btn-restart'),
  },
};

const game = new Game($('game'), ui);

document.querySelectorAll('[data-touch]').forEach((el) => {
  game.input.bindTouch(el, el.dataset.touch);
});

ui.buttons.start.focus({ preventScroll: true });