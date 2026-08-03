/* খাতা calculations.

   Everything here is a pure function of the state object, which makes it
   testable on its own. Two things matter about this file:

   1. applyTxn / revertTxn / editTxn are the ONLY functions in the app allowed
      to move an account balance. Before, several call sites did it by hand and
      disagreed: auto-posted monthly items never debited the account at all, so
      deleting one credited money that was never spent.
   2. Nothing here reads the clock. The caller passes `today` in as an ISO
      date, so every calculation agrees with the Dhaka-pinned clock in app.js
      instead of quietly using whatever timezone the device is set to.
*/

const p2 = n => String(n).padStart(2, '0');
const isoOf = (y, m, d) => `${y}-${p2(m)}-${p2(d)}`;
const dayNum = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };

export const daysBetween = (a, b) => Math.round(dayNum(b) - dayNum(a));
export const sum = a => a.reduce((s, x) => s + (Number(x.amount) || 0), 0);

/* last calendar day of a 1-based month */
const lastDom = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/* The next time day-of-month `dd` comes round, on or after `today`.
   Clamps to the month length, so "31st" still works in February. */
export function nextDom(today, dd) {
  const [y, m, d] = today.split('-').map(Number);
  const here = Math.min(Number(dd) || 1, lastDom(y, m));
  if (d <= here) return isoOf(y, m, here);
  const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
  return isoOf(ny, nm, Math.min(Number(dd) || 1, lastDom(ny, nm)));
}

/* ---------------- lookups ---------------- */
export const catOf = (S, id) => S.cats.find(c => c.id === id);
export const acctOf = (S, id) => S.accts.find(a => a.id === id);
export const srcOf = (S, id) => S.srcs.find(s => s.id === id);
export const groupOf = (S, id) => (S.groups || []).find(g => g.id === id);

/* How a budget line behaves comes from its group, never from the group's id.
   Those ids are user data now — 'his' or 'travel' says nothing about the money
   — so everything that used to read the old hardcoded `c.group` string reads
   this instead. Anything unresolvable counts as ordinary variable spending,
   which is the assumption that loses the least if a group goes missing. */
export function kindOf(S, cat) {
  const g = cat && groupOf(S, cat.group);
  return (g && g.kind) || 'var';
}
/* Hidden lines stay in S.cats so old entries still resolve; they only leave the
   chip list and the budget sheet. */
export const activeCats = S => S.cats.filter(c => !c.archived);

/* ---------------- balance: the only writers of a.bal ---------------- */

const delta = txn => {
  const amt = Number(txn.amount) || 0;
  return txn.type === 'income' ? amt : -amt;
};
export function applyTxn(S, txn) {
  const a = acctOf(S, txn.acct);
  if (a) a.bal = (Number(a.bal) || 0) + delta(txn);
}
export function revertTxn(S, txn) {
  const a = acctOf(S, txn.acct);
  if (a) a.bal = (Number(a.bal) || 0) - delta(txn);
}
/* Handles an edit that changes the amount, the type, or the account. */
export function editTxn(S, prev, next) { revertTxn(S, prev); applyTxn(S, next); }

/* ---------------- periods ---------------- */

export function periodOf(S, dateStr) {
  const sd = S.settings.monthStartDay || 1;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (d >= sd) return `${y}-${p2(m)}`;
  return m === 1 ? `${y - 1}-12` : `${y}-${p2(m - 1)}`;
}
export const daysInPeriod = p => { const [y, m] = p.split('-').map(Number); return lastDom(y, m); };
export function prevP(p, back) {
  let [y, m] = p.split('-').map(Number);
  m -= back; while (m < 1) { m += 12; y--; }
  return `${y}-${p2(m)}`;
}
/* Which day of the current budget cycle `today` is. */
export function dayInPeriod(S, today, p) {
  const sd = S.settings.monthStartDay || 1;
  const d = Number(today.split('-')[2]);
  return d >= sd ? d - sd + 1 : d + daysInPeriod(p) - sd + 1;
}

export const txnsIn = (S, p, type) =>
  S.txns.filter(x => periodOf(S, x.date) === p && (!type || x.type === type));
export const spentIn = (S, p) => sum(txnsIn(S, p, 'expense'));
export const earnedIn = (S, p) => sum(txnsIn(S, p, 'income'));
export const spentOn = (S, date) =>
  sum(S.txns.filter(x => x.date === date && x.type === 'expense'));

/* ---------------- budget ---------------- */

/* What can be spent this month. A saving envelope is deliberately left out: the
   tour fund is money set aside, not money available, and folding it in here
   would inflate the daily budget the Overview hero bar is drawn from. Hidden
   lines are out too — a line you cannot pick cannot be spent against. */
const budgetSum = (S, want) => S.cats.reduce((s, c) =>
  s + (!c.archived && (kindOf(S, c) === 'save') === want ? Number(c.budget) || 0 : 0), 0);
export const monthBudget = S => budgetSum(S, false);
export const saveBudget = S => budgetSum(S, true);
export function dailyBudget(S, p) {
  if (S.settings.dailyBudget) return Number(S.settings.dailyBudget);
  const mb = monthBudget(S);
  return mb ? mb / daysInPeriod(p) : 0;
}

/* ---------------- totals ---------------- */

export const liquid = S => S.accts.reduce((s, a) => s + (Number(a.bal) || 0), 0);
export const dpsPaidTotal = S => S.dps.reduce((s, d) => s + (d.paid || []).length * (Number(d.inst) || 0), 0);
export const assetsTotal = S => S.assets.reduce((s, a) => s + (Number(a.value) || 0), 0);
/* A lend row keeps the original amount and a list of part-repayments beside it,
   so "৳5,000 lent, ৳2,000 back" stays one row that still knows both figures.
   A row written before part-repayment existed has no `repays` at all, which
   reads as nothing repaid — so the two totals below come out exactly as they
   did before, and old data needs no rewriting. */
export const lendPaid = l => (l.repays || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
export const lendLeft = l => Math.max(0, (Number(l.amount) || 0) - lendPaid(l));
/* Open means still owed: not ticked off by hand, and something left to pay. */
export const lendOpen = l => !l.settled && lendLeft(l) > 0;

const openLends = (S, dir) => S.lends.filter(l => l.dir === dir && lendOpen(l));
export const lentOut = S => openLends(S, 'gave').reduce((s, l) => s + lendLeft(l), 0);
export const borrowed = S => openLends(S, 'took').reduce((s, l) => s + lendLeft(l), 0);
export const loansOut = S => S.loans.reduce((s, l) => s + (Number(l.out) || 0), 0);
export const totalEmi = S => S.loans.reduce((s, l) => s + (Number(l.emi) || 0), 0);
export const netWorth = S =>
  liquid(S) + dpsPaidTotal(S) + assetsTotal(S) + lentOut(S) - loansOut(S) - borrowed(S);

export function avgMonthlyExpense(S, p, today, n = 3) {
  let tot = 0, cnt = 0;
  for (let i = 1; i <= n; i++) { const s = spentIn(S, prevP(p, i)); if (s > 0) { tot += s; cnt++; } }
  if (cnt) return tot / cnt;
  const cur = spentIn(S, p), d = dayInPeriod(S, today, p);
  return cur && d ? cur / d * daysInPeriod(p) : 0;
}
export function avgMonthlyIncome(S, p, n = 3) {
  let tot = 0, cnt = 0;
  for (let i = 0; i < n; i++) { const s = earnedIn(S, prevP(p, i)); if (s > 0) { tot += s; cnt++; } }
  return cnt ? tot / cnt : 0;
}
export function runway(S, p, today) { const e = avgMonthlyExpense(S, p, today); return e ? liquid(S) / e : 0; }
export function dti(S, p) { const i = avgMonthlyIncome(S, p); return i ? totalEmi(S) / i * 100 : 0; }
export function savingsRate(S, p) {
  const inc = earnedIn(S, p);
  return inc ? (inc - spentIn(S, p)) / inc * 100 : 0;
}
export function projectedSpend(S, p, today) {
  const d = dayInPeriod(S, today, p);
  return d ? spentIn(S, p) / d * daysInPeriod(p) : 0;
}

/* ---------------- breakdowns ---------------- */

export function byCategory(S, p) {
  const m = {};
  txnsIn(S, p, 'expense').forEach(x => { m[x.cat] = (m[x.cat] || 0) + (Number(x.amount) || 0); });
  return Object.entries(m).map(([id, v]) => ({ cat: catOf(S, id), v }))
    .filter(x => x.cat).sort((a, b) => b.v - a.v);
}

/* ---------------- envelopes ----------------

   One budget line, as it stands right now.

   An ordinary line resets: it holds this month's allocation against this
   month's spend, and last month is none of its business. A `save` line does
   not reset — it is a tour fund, so every month since it started adds another
   allocation and month end takes nothing away. Both come back in the same
   shape, so no view has to know which kind it is holding. */
const pNum = p => { const [y, m] = String(p).split('-').map(Number); return y * 12 + (m - 1); };

export const spentInCat = (S, catId, p) =>
  sum(txnsIn(S, p, 'expense').filter(x => x.cat === catId));
export const spentSince = (S, catId, fromP) =>
  sum(S.txns.filter(x => x.type === 'expense' && x.cat === catId
    && pNum(periodOf(S, x.date)) >= pNum(fromP)));

export function envelope(S, cat, p) {
  const kind = kindOf(S, cat), budget = Number(cat.budget) || 0;
  if (kind !== 'save') {
    const spent = spentInCat(S, cat.id, p);
    return { kind, budget, allocated: budget, spent, left: budget - spent, months: 1 };
  }
  /* A line created this month, or one whose `since` somehow sits in the future,
     has had exactly one instalment — never a negative number of months. */
  const from = cat.since && pNum(cat.since) <= pNum(p) ? cat.since : p;
  const months = pNum(p) - pNum(from) + 1;
  const allocated = budget * months, spent = spentSince(S, cat.id, from);
  return { kind, budget, allocated, spent, left: allocated - spent, months };
}

export function fixedVar(S, p) {
  let f = 0, v = 0;
  txnsIn(S, p, 'expense').forEach(x => {
    const c = catOf(S, x.cat); if (!c) return;
    if (kindOf(S, c) === 'var') v += Number(x.amount) || 0;
    else f += Number(x.amount) || 0;
  });
  return { f, v };
}

/* The Overview breakdown, gathered the way the budget is written: group by
   group, in the order the groups are listed, lines inside sorted by outflow.
   A hidden line still appears if money went through it this month — the point
   of hiding is to shorten the chip list, not to hide spending that happened.
   Anything whose group has gone missing is collected at the end rather than
   dropped, which is what the flat version used to do silently. */
export function byGroup(S, p) {
  const spent = {};
  txnsIn(S, p, 'expense').forEach(x => { spent[x.cat] = (spent[x.cat] || 0) + (Number(x.amount) || 0); });
  const seen = new Set(), out = [];
  for (const g of (S.groups || [])) {
    const items = S.cats
      .filter(c => c.group === g.id && (!c.archived || spent[c.id]))
      .map(c => ({ cat: c, v: spent[c.id] || 0, env: envelope(S, c, p) }))
      .filter(x => x.v || Number(x.cat.budget))
      .sort((a, b) => b.v - a.v);
    items.forEach(x => seen.add(x.cat.id));
    if (items.length) out.push({ group: g, items, total: items.reduce((s, x) => s + x.v, 0) });
  }
  const loose = Object.keys(spent).filter(id => !seen.has(id));
  if (loose.length) {
    const items = loose.map(id => ({ cat: catOf(S, id) || { id, bn: 'অজানা খাত', en: 'Unknown' }, v: spent[id], env: null }))
      .sort((a, b) => b.v - a.v);
    out.push({
      group: { id: '_loose', bn: 'অন্যান্য', en: 'Other', kind: 'var' },
      items, total: items.reduce((s, x) => s + x.v, 0),
    });
  }
  return out;
}
export function plannedShare(S, p) {
  const xs = txnsIn(S, p, 'expense');
  if (!xs.length) return null;
  const tot = sum(xs);
  return tot ? sum(xs.filter(x => x.planned)) / tot * 100 : 0;
}
export function incomeMix(S, p) {
  const m = {};
  txnsIn(S, p, 'income').forEach(x => { m[x.src] = (m[x.src] || 0) + (Number(x.amount) || 0); });
  return Object.entries(m).map(([id, v]) => ({ src: srcOf(S, id), v })).filter(x => x.src).sort((a, b) => b.v - a.v);
}
/* Spend per day for the last `n` days, oldest first — drives the sparkline. */
export function lastDays(S, today, n = 7) {
  const [y, m, d] = today.split('-').map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const iso = new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10);
    out.push({ date: iso, v: spentOn(S, iso) });
  }
  return out;
}
/* Every day that has entries, newest first — drives the history view. */
export function dayGroups(S) {
  const m = new Map();
  for (const x of S.txns) {
    if (!m.has(x.date)) m.set(x.date, []);
    m.get(x.date).push(x);
  }
  return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([date, es]) => ({
    date,
    entries: es.slice().sort((a, b) => String(b.ts || '').localeCompare(String(a.ts || ''))),
    out: sum(es.filter(x => x.type === 'expense')),
    inc: sum(es.filter(x => x.type === 'income')),
  }));
}

/* ---------------- DPS and loans ---------------- */

export function dpsMonthsElapsed(d, today) {
  const [sy, sm] = d.start.split('-').map(Number);
  const [cy, cm] = today.split('-').map(Number);
  return Math.max(0, (cy - sy) * 12 + (cm - sm) + 1);
}
export function dpsMonthList(d, today) {
  const out = [];
  let [y, m] = d.start.split('-').map(Number);
  const n = Math.min(Number(d.tenure) || 0, dpsMonthsElapsed(d, today));
  for (let i = 0; i < n; i++) { out.push(`${y}-${p2(m)}`); if (++m > 12) { m = 1; y++; } }
  return out;
}
export const dpsNextDue = (d, today) => dpsMonthList(d, today).find(m => !(d.paid || []).includes(m)) || null;
export function dpsMaturity(d) {
  const i = (Number(d.rate) || 0) / 1200, n = Number(d.tenure) || 0, P = Number(d.inst) || 0;
  return i ? P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i) : P * n;
}
export function loanMonthsLeft(l) {
  const r = (Number(l.rate) || 0) / 1200, P = Number(l.out) || 0, E = Number(l.emi) || 0;
  if (!P || !E) return 0;
  if (!r) return Math.ceil(P / E);
  if (E <= P * r) return Infinity;          // instalment never covers the interest
  return Math.ceil(-Math.log(1 - r * P / E) / Math.log(1 + r));
}
export const loanInterest = l => (Number(l.out) || 0) * ((Number(l.rate) || 0) / 1200);

/* ---------------- what is coming up ---------------- */

/* One list, whatever the source: hand-written reminders like a credit card
   bill, plus dues derived from fixed monthly items, loans and DPS. Sorted by
   how soon they land.

   Returns `kind`, `catId` and `note` rather than display text — this file has
   no business knowing which language the UI is in. The caller turns those into
   a subtitle. */
export function upcomingAll(S, today, days = 30) {
  const out = [];
  const push = o => { if (o.amount && o.left >= 0 && o.left <= days) out.push(o); };

  (S.reminders || []).forEach(r => {
    if (!r.due) return;
    if (r.done && r.repeat !== 'monthly') return;
    const due = r.repeat === 'monthly' ? nextDom(today, Number(r.due.split('-')[2])) : r.due;
    if (r.repeat === 'monthly' && r.doneFor === due.slice(0, 7)) return;
    push({ kind: 'note', id: r.id, label: r.title, note: r.note || '', amount: Number(r.amount) || 0, due, left: daysBetween(today, due) });
  });
  (S.recur || []).forEach(r => {
    const due = nextDom(today, r.day);
    if (r.autoAdded === periodOf(S, due)) return;   // already posted this cycle
    push({ kind: 'recur', id: r.id, label: r.name, catId: r.cat, amount: Number(r.amount) || 0, due, left: daysBetween(today, due) });
  });
  S.loans.forEach(l => {
    const due = nextDom(today, l.dueDay);
    push({ kind: 'loan', id: l.id, label: l.lender, amount: Number(l.emi) || 0, due, left: daysBetween(today, due) });
  });
  S.dps.forEach(d => {
    if (!dpsNextDue(d, today)) return;
    const due = nextDom(today, d.dueDay);
    push({ kind: 'dps', id: d.id, label: d.bank, amount: Number(d.inst) || 0, due, left: daysBetween(today, due) });
  });
  return out.sort((a, b) => a.left - b.left || b.amount - a.amount);
}
