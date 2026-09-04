(function (root) {
  'use strict';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function validateLoop(start, end, duration, minimum = 1) {
    const limit = Math.max(minimum, Number(duration) || minimum);
    let a = clamp(Number(start) || 0, 0, limit);
    let b = clamp(Number(end) || limit, 0, limit);
    if (b < a) [a, b] = [b, a];
    if (b - a < minimum) {
      b = Math.min(limit, a + minimum);
      if (b - a < minimum) a = Math.max(0, b - minimum);
    }
    return { start:a, end:b, valid:b > a };
  }
  function beatMilliseconds(bpm, speed = 1) {
    return 60000 / clamp((Number(bpm) || 120) * (Number(speed) || 1), 20, 400);
  }
  function formatPracticeTime(seconds) {
    const value = Math.max(0, Number(seconds) || 0);
    return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  }
  const api = { validateLoop, beatMilliseconds, formatPracticeTime };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FMQPracticeTools = api;
})(typeof window !== 'undefined' ? window : globalThis);
