'use strict';
const assert = require('node:assert/strict');
const {validateLoop, beatMilliseconds, formatPracticeTime} = require('./practice-tools.js');
assert.deepEqual(validateLoop(8, 4, 20, 1), {start:4,end:8,valid:true});
assert.deepEqual(validateLoop(5, 5, 20, 2), {start:5,end:7,valid:true});
assert.deepEqual(validateLoop(-4, 50, 20, 1), {start:0,end:20,valid:true});
assert.equal(beatMilliseconds(120, 1), 500);
assert.equal(beatMilliseconds(60, .5), 2000);
assert.equal(formatPracticeTime(65.9), '1:05');
let position = 7.25;
for (let repeat = 0; repeat < 100; repeat++) {
  position = validateLoop(position, 12.5, 60, 1).start;
  assert.equal(position, 7.25, `loop ${repeat + 1} drifted`);
}
console.log('Practice tool tests passed');
