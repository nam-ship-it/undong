// 실행: node test.js
const assert = require('assert');
const c = require('./core.js');

const full = n => [n, n, n];
function st(days) { const s = c.newState(); s.days = days; return s; }
function all(n) { return { squat: full(n), pushup: full(n), situp: full(n) }; }

// 현지 날짜: 한국 새벽 1시도 그날
assert.strictEqual(c.localDateKey(new Date(2026, 10, 25, 1, 0)), '2026-11-25');

// 시작 12, 완료한 날마다 +1
let s = st({ '2026-11-01': all(12), '2026-11-02': all(13) });
assert.strictEqual(c.targetFor(s, 'squat', '2026-11-01'), 12);
assert.strictEqual(c.targetFor(s, 'squat', '2026-11-03'), 14);

// 빠진 날은 그대로, 못 채운 날도 그대로, 운동별로 따로
s = st({ '2026-11-01': { squat: full(12), pushup: [12, 12, 9], situp: full(12) }, '2026-11-05': all(13) });
assert.strictEqual(c.targetFor(s, 'pushup', '2026-11-02'), 12);
assert.strictEqual(c.targetFor(s, 'squat', '2026-11-05'), 13);
assert.strictEqual(c.dayStatus(s, '2026-11-01'), 'partial');
assert.strictEqual(c.dayStatus(s, '2026-11-03'), 'none');
// 11-05: 푸시업 목표는 12, 13개씩 했으니 완료 → full
assert.strictEqual(c.dayStatus(s, '2026-11-05'), 'full');

// 연속: 오늘 아직 안 했으면 어제부터
s = st({ '2026-11-23': all(12), '2026-11-24': all(13) });
assert.strictEqual(c.streak(s, '2026-11-25'), 2);
s.days['2026-11-25'] = all(14);
assert.strictEqual(c.streak(s, '2026-11-25'), 3);
assert.strictEqual(c.streak(st({}), '2026-11-25'), 0);
// 월말 넘어가는 연속
s = st({ '2026-10-31': all(12), '2026-11-01': all(13) });
assert.strictEqual(c.streak(s, '2026-11-01'), 2);

// 월 집계
// 10-30 완료 → 11-01 목표는 13
s = st({ '2026-11-01': all(13), '2026-11-02': { squat: [5] }, '2026-10-30': all(12) });
assert.deepStrictEqual(c.monthSummary(s, 2026, 11), { full: 1, partial: 1 });

// 전체 개수
assert.strictEqual(c.totalReps(st({ '2026-11-01': all(12), '2026-11-02': { squat: [5, 3] } })), 116);
assert.strictEqual(c.totalReps(st({})), 0);

// 백업: 정상은 통과, 잘못된 파일은 거절
const good = JSON.stringify(st({ '2026-11-01': all(12) }));
assert.ok(c.parseBackup(good).days['2026-11-01']);
assert.throws(() => c.parseBackup('{}'));
assert.throws(() => c.parseBackup('not json'));
assert.throws(() => c.parseBackup(JSON.stringify({ ...c.newState(), days: { 'x': {} } })));
assert.throws(() => c.parseBackup(JSON.stringify({ ...c.newState(), days: { '2026-11-01': { squat: ['a'] } } })));

console.log('ALL PASS');
