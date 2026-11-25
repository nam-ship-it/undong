// 운동 챌린지 계산 로직 (화면과 분리해 Node로 테스트)
const EXERCISES = [
  { id: 'squat', name: '스쿼트',
    tips: ['발은 어깨너비, 발끝은 살짝 바깥으로', '의자에 앉듯 엉덩이를 뒤로 빼며 허벅지가 바닥과 평행할 때까지', '무릎은 발끝 방향으로, 뒤꿈치는 바닥에 붙인 채 일어나기'],
    easier: '깊이 앉기 힘들면 의자에 엉덩이가 닿을 때까지만 앉았다 일어나세요.' },
  { id: 'pushup', name: '푸시업',
    tips: ['손은 어깨보다 조금 넓게, 머리부터 뒤꿈치까지 일직선', '팔꿈치는 몸통에서 45도쯤 벌리고 가슴이 바닥 가까이 갈 때까지', '엉덩이가 처지거나 들리지 않게 배에 힘 주기'],
    easier: '힘들면 무릎을 바닥에 대고 하세요. 개수는 그대로 기록하면 됩니다.' },
  { id: 'situp', name: '윗몸일으키기',
    tips: ['무릎을 세우고 발바닥은 바닥에', '손은 가슴 위에 엇갈려 얹기 (머리 뒤 깍지로 목을 당기지 않기)', '등을 바닥에서 한 마디씩 말아 올리고, 내려올 때는 천천히'],
    easier: '허리가 불편하면 어깨만 살짝 드는 크런치로 바꾸세요.' },
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
