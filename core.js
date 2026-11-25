// 운동 챌린지 계산 로직 (화면과 분리해 Node로 테스트)
const EXERCISES = [
  { id: 'squat', name: '스쿼트' },
  { id: 'pushup', name: '푸시업' },
  { id: 'situp', name: '윗몸일으키기' },
];
const SETS = 3;
const START_REPS = 12;
const REST_SECONDS = 60;

function newState() {
  const start = {};
  EXERCISES.forEach(e => { start[e.id] = START_REPS; });
  return { version: 1, start, days: {}, body: [] };
}

// 현지 날짜. toISOString()은 UTC라 한국 오전 9시 전이 전날로 밀린다.
function localDateKey(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function isDone(sets, target) {
  return Array.isArray(sets) && sets.length === SETS && sets.every(r => r >= target);
}

// 그날 목표 = 시작값 + 그 이전에 목표를 다 채운 날 수 (날짜순으로 그날 목표 기준 판정)
function targetFor(state, exId, dateKey) {
  let t = state.start[exId];
  Object.keys(state.days).filter(k => k < dateKey).sort().forEach(k => {
    if (isDone(state.days[k][exId], t)) t++;
  });
  return t;
}

function dayStatus(state, dateKey) {
  const rec = state.days[dateKey];
  if (!rec) return 'none';
  if (EXERCISES.every(e => isDone(rec[e.id], targetFor(state, e.id, dateKey)))) return 'full';
  return EXERCISES.some(e => (rec[e.id] || []).some(r => r > 0)) ? 'partial' : 'none';
}

function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return localDateKey(new Date(y, m - 1, d + n));
}

function streak(state, todayKey) {
  let k = dayStatus(state, todayKey) === 'full' ? todayKey : addDays(todayKey, -1);
  let n = 0;
  while (dayStatus(state, k) === 'full') { n++; k = addDays(k, -1); }
  return n;
}

// m: 1~12
function monthSummary(state, y, m) {
  const prefix = `${y}-${String(m).padStart(2, '0')}-`;
  const out = { full: 0, partial: 0 };
  Object.keys(state.days).filter(k => k.startsWith(prefix)).forEach(k => {
    const s = dayStatus(state, k);
    if (s !== 'none') out[s]++;
  });
  return out;
}

// 지금까지 한 전체 개수
function totalReps(state) {
  let n = 0;
  Object.values(state.days).forEach(rec => Object.values(rec).forEach(sets => sets.forEach(r => { n += r; })));
  return n;
}

// 백업 파일 검사. 형식이 틀리면 throw → 기존 기록을 덮어쓰지 않는다.
function parseBackup(text) {
  const s = JSON.parse(text);
  const okSets = v => Array.isArray(v) && v.length <= SETS && v.every(r => Number.isInteger(r) && r >= 0);
  if (!s || typeof s !== 'object' || !s.start || !s.days || !Array.isArray(s.body)) throw new Error('운동 백업 파일이 아닙니다');
  EXERCISES.forEach(e => {
    if (!Number.isInteger(s.start[e.id]) || s.start[e.id] < 1) throw new Error('시작 개수가 잘못되었습니다');
  });
  Object.entries(s.days).forEach(([k, rec]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || typeof rec !== 'object' || rec === null) throw new Error('날짜 기록이 잘못되었습니다');
    Object.values(rec).forEach(v => { if (!okSets(v)) throw new Error('세트 기록이 잘못되었습니다'); });
  });
  return s;
}

if (typeof module !== 'undefined') {
  module.exports = { EXERCISES, SETS, START_REPS, REST_SECONDS, newState, localDateKey, isDone, targetFor, dayStatus, addDays, streak, monthSummary, totalReps, parseBackup };
}
