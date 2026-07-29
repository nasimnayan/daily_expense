/* খাতা — personal money ledger.

   Boot, clock, sync, views and event handling. Crypto and storage live in
   vault.js; every calculation lives in calc.js. */

import {
  createVault, unlockVault, hasVault, rekey, saveState, meta, setMeta,
  saveToken, loadToken, blobSize, wipeLocal, exportBlob, importBlob,
  seal, unseal, ITER,
} from './vault.js';
import * as C from './calc.js';

/* ---------------- i18n ---------------- */
const STR = {
  'nav.over': ['এক নজরে', 'Overview'], 'nav.days': ['দিনলিপি', 'Days'],
  'nav.acct': ['হিসাব', 'Accounts'], 'nav.plan': ['পরিকল্পনা', 'Plan'], 'nav.set': ['সেটিংস', 'Settings'],
  'pg.over': ['এক নজরে', 'Overview'], 'pg.days': ['দিনলিপি', 'Day by day'],
  'pg.acct': ['হিসাব', 'Accounts'], 'pg.plan': ['পরিকল্পনা', 'Plan'], 'pg.set': ['সেটিংস', 'Settings'],
  'fab': ['খরচ যোগ করুন', 'Add expense'],
  'spentToday': ['আজ খরচ', 'Spent today'],
  'leftToday': ['আজকের বাজেট বাকি', 'Left in today’s budget'],
  'overToday': ['বাজেট ছাড়িয়েছে', 'Over budget'],
  'mtd': ['এ মাসে খরচ', 'Spent this month'],
  'perDay': ['দিন', 'day'],
  'last7': ['শেষ ৭ দিন', 'Last 7 days'],
  'upcoming': ['সামনে যা আছে', 'Coming up'],
  'expense': ['খরচ', 'Expense'], 'income': ['আয়', 'Income'],
  'amount': ['টাকা', 'Amount'], 'note': ['নোট (ঐচ্ছিক)', 'Note (optional)'],
  'save': ['সেভ', 'Save'], 'planned': ['পরিকল্পিত', 'Planned'],
  'date': ['তারিখ', 'Date'], 'account': ['কোন হিসাব থেকে', 'From which account'],
  'category': ['খাত', 'Category'],
  'addExpense': ['খরচ যোগ করুন', 'Add an expense'],
  'editEntry': ['এন্ট্রি বদলান', 'Edit entry'],
  'noHistory': ['এখনো কোনো এন্ট্রি নেই। নিচের কমলা বাটন দিয়ে শুরু করুন।',
    'No entries yet. Use the orange button below to start.'],
  'savingsRate': ['সঞ্চয়ের হার', 'Savings rate'],
  'netWorth': ['নিট সম্পদ', 'Net worth'],
  'runway': ['কত মাস চলবে', 'Runway'],
  'dti': ['আয়ের কত ভাগ কিস্তি', 'Debt to income'],
  'months': ['মাস', 'months'],
  'byCategory': ['খাত অনুযায়ী', 'By category'],
  'thisMonth': ['এ মাস', 'This month'],
  'projected': ['মাস শেষে হবে (আন্দাজ)', 'Projected month end'],
  'fixedVar': ['নির্দিষ্ট বনাম পরিবর্তনশীল', 'Fixed vs variable'],
  'incomeMix': ['আয়ের উৎস', 'Income sources'],
  'plannedShare': ['পরিকল্পিত খরচের ভাগ', 'Share that was planned'],
  'accounts': ['হিসাব ও ব্যালান্স', 'Balances'],
  'dps': ['ডিপিএস', 'DPS'], 'loans': ['ঋণ', 'Loans'],
  'lending': ['ধার দেওয়া-নেওয়া', 'Money lent & borrowed'],
  'assets': ['অন্য সঞ্চয়', 'Other savings'],
  'goals': ['লক্ষ্য', 'Goals'], 'budget': ['মাসিক বাজেট', 'Monthly budget'],
  'recurring': ['প্রতি মাসের নির্দিষ্ট খরচ', 'Fixed monthly items'],
  'reminders': ['মনে রাখার বিল', 'Bill reminders'],
  'remTitle': ['কী বিল', 'What is it'],
  'remMonthly': ['প্রতি মাসে', 'Every month'],
  'remDone': ['দিয়ে দিয়েছি', 'Paid it'],
  'remHint': ['যেমন: ক্রেডিট কার্ডের বিল, ইনস্যুরেন্স প্রিমিয়াম, স্কুল ফি।',
    'For example: credit card bill, insurance premium, school fees.'],
  'add': ['যোগ করুন', 'Add'], 'del': ['মুছুন', 'Delete'], 'edit': ['বদলান', 'Edit'],
  'name': ['নাম', 'Name'], 'bank': ['ব্যাংক', 'Bank'],
  'instalment': ['কিস্তি', 'Instalment'], 'rate': ['সুদের হার %', 'Interest rate %'],
  'start': ['শুরুর তারিখ', 'Start month'], 'tenure': ['কত মাস', 'Tenure (months)'],
  'dueDay': ['মাসের কত তারিখে', 'Due day of month'],
  'paidCount': ['দেওয়া হয়েছে', 'Paid'],
  'maturity': ['মেয়াদ শেষে (আন্দাজ)', 'At maturity (est.)'],
  'markPaid': ['কিস্তি দিলাম', 'Mark paid'],
  'payTitle': ['কিস্তি দিন', 'Pay instalment'],
  'lender': ['কার কাছ থেকে', 'Lender'],
  'outstanding': ['বাকি আছে', 'Outstanding'], 'emi': ['মাসিক কিস্তি', 'Monthly instalment'],
  'payoff': ['শেষ হবে', 'Paid off in'],
  'interestThisMonth': ['এ মাসের সুদ', 'Interest this month'],
  'person': ['কার সাথে', 'Person'],
  'gave': ['ধার দিয়েছি', 'I lent'], 'took': ['ধার নিয়েছি', 'I borrowed'],
  'settle': ['শোধ হয়েছে', 'Settled'],
  'repay': ['কিছু শোধ', 'Part paid'],
  'savedAmt': ['জমেছে', 'Saved so far'],
  'editRow': ['বদলান', 'Edit'],
  'oneTime': ['একবার', 'One time'],
  'startHint': ['বেতন যেদিন পান, মাস সেদিন থেকে শুরু ধরুন। মাসের শেষ সপ্তাহে বেতন পেলে ২৫ দিন — তাহলে ২৫ জুলাই থেকে ২৪ অগাস্ট পর্যন্ত "জুলাই মাস", আর জুলাইয়ের বেতন জুলাইয়েই গোনা হবে।',
    'Set this to the day you are paid, and the month starts there. Paid in the last week? Try 25 — then "July" runs 25 Jul to 24 Aug, and July\'s salary counts in July.'],
  'repayTitle': ['শোধের হিসাব', 'Record a repayment'],
  'gotBack': ['ফেরত পেলাম', 'Received back'],
  'paidBack': ['ফেরত দিলাম', 'Paid back'],
  'lendHint': ['কাকে ধার দিয়েছেন বা কার কাছ থেকে নিয়েছেন — নাম, টাকা আর তারিখ। কিছু কিছু শোধ হলে "কিছু শোধ" দিয়ে বসান, বাকিটা নিজেই হিসাব হবে।',
    'Who you lent to, or borrowed from — name, amount and date. As parts come back, add them with "Part paid" and the remainder is worked out for you.'],
  'target': ['লক্ষ্য টাকা', 'Target'],
  'deadline': ['কত তারিখের মধ্যে', 'Deadline'],
  'needMonthly': ['মাসে লাগবে', 'Needed per month'],
  'dailyBudget': ['দৈনিক বাজেট', 'Daily budget'],
  'language': ['ভাষা', 'Language'],
  'sync': ['সিঙ্ক', 'Sync'], 'syncNow': ['এখন সিঙ্ক করুন', 'Sync now'],
  'repoOwner': ['GitHub ইউজারনেম', 'GitHub username'],
  'repoName': ['প্রাইভেট রিপো নাম', 'Private repo name'],
  'token': ['অ্যাকসেস টোকেন', 'Access token'],
  'backup': ['ব্যাকআপ', 'Backup'],
  'export': ['ফাইল নামান', 'Download file'], 'import': ['ফাইল থেকে আনুন', 'Restore from file'],
  'changePass': ['পাসফ্রেজ বদলান', 'Change passphrase'],
  'wipe': ['এই ডিভাইস থেকে সব মুছুন', 'Erase from this device'],
  'never': ['কখনো হয়নি', 'Never'],
  'saved!': ['সেভ হয়েছে', 'Saved'], 'synced': ['সিঙ্ক হয়েছে', 'Synced'],
  'offline': ['অফলাইন', 'Offline'],
  'conflict': ['দুই জায়গায় আলাদা তথ্য আছে', 'Local and remote data differ'],
  'keepLocal': ['এই ডিভাইসের রাখুন', 'Keep this device'],
  'keepRemote': ['সার্ভারের রাখুন', 'Keep remote'],
  'wrongPass': ['পাসফ্রেজ মেলেনি', 'Passphrase does not match'],
  'setPass': ['একটা পাসফ্রেজ ঠিক করুন', 'Choose a passphrase'],
  'open': ['খুলুন', 'Open'], 'create': ['শুরু করুন', 'Start'],
  'noBudget': ['বাজেট দেওয়া হয়নি', 'No budget set'],
  'enterAmount': ['টাকার অঙ্ক দিন', 'Enter an amount'],
  'pickCat': ['একটা খাত বেছে নিন', 'Pick a category'],
  'confirmDel': ['মুছে ফেলবেন?', 'Delete this?'],
  'monthly': ['মাসিক', 'Monthly'],
  'liquid': ['হাতে থাকা টাকা', 'Liquid cash'],
  'planTip': ['খাতের পাশে বাজেট লিখুন। খালি রাখলে ওই খাত হিসাবের বাইরে থাকবে।',
    'Set a budget beside each category. Leave blank to leave it out of tracking.'],
  'dataInfo': ['তথ্যের পরিমাণ', 'Data size'],
  'entries': ['এন্ট্রি', 'entries'],
  'sizeWarn': ['ফাইলটা বড় হয়ে যাচ্ছে। GitHub সিঙ্কের সীমা ১ MB — কাছাকাছি গেলে পুরনো বছরের এন্ট্রি আলাদা ফাইলে সরাতে হবে। এখনই ব্যাকআপ নিয়ে রাখুন।',
    'This file is getting large. GitHub sync caps at 1 MB — near that point, older years need moving to a separate file. Take a backup now.'],
  'saveFailed': ['সেভ হয়নি', 'Save failed'],
  'saveFailedMsg': ['এই মুহূর্তের লেখা ডিভাইসে বসেনি। পেজ বন্ধ করার আগে সেটিংস → ফাইল নামান দিয়ে ব্যাকআপ নিন।',
    'Your latest change did not reach the device. Before closing, take a backup from Settings → Download file.'],
  'today': ['আজ', 'today'], 'tomorrow': ['কাল', 'tomorrow'],
};
let LANG = 0;
const t = k => (STR[k] ? STR[k][LANG] : k);
const L = o => (LANG === 0 ? o.bn : o.en) || o.bn || o.en;

/* ---------------- helpers ---------------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const BN_DIG = '০১২৩৪৫৬৭৮৯';
/* Bangla digits for dates and day counts. Money and the clock stay Western so
   the number columns line up. */
const bn = s => LANG ? String(s) : String(s).replace(/\d/g, d => BN_DIG[+d]);

function grp(n) {
  n = Math.round(Number(n) || 0);
  const neg = n < 0; n = Math.abs(n);
  const s = String(n);
  if (s.length <= 3) return (neg ? '−' : '') + s;
  return (neg ? '−' : '') + s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
}
const fmt = n => '৳' + grp(n);

/* ---------------- time: always Bangladesh ----------------
   Both devices must agree on which day an entry belongs to, so the date is
   derived in Asia/Dhaka rather than from whatever the device is set to. */
const TZ = 'Asia/Dhaka';
const fDate = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const fClock = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
const fHM = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true });

const parts = (fm, d) => { const o = {}; for (const p of fm.formatToParts(d)) o[p.type] = p.value; return o; };
function todayISO(d = new Date()) { const p = parts(fDate, d); return `${p.year}-${p.month}-${p.day}`; }
function clockNow(d = new Date()) { const p = parts(fClock, d); return { hms: `${p.hour}:${p.minute}:${p.second}`, ap: (p.dayPeriod || '').toUpperCase() }; }
function hhmm(d) { const p = parts(fHM, d); return `${p.hour}:${p.minute} ${(p.dayPeriod || '').toUpperCase()}`; }

const BN_MON = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const EN_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BN_DAY = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const EN_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dowOf = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
function dateLong(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const mon = LANG ? EN_MON[m - 1] : BN_MON[m - 1], day = LANG ? EN_DAY[dowOf(iso)] : BN_DAY[dowOf(iso)];
  return `${day}, ${bn(d)} ${mon} ${bn(y)}`;
}
function dateMid(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${bn(d)} ${LANG ? EN_MON[m - 1] : BN_MON[m - 1]}`;
}
function monthLabel(p) {
  const [y, m] = p.split('-').map(Number);
  return `${LANG ? EN_MON[m - 1] : BN_MON[m - 1]} ${bn(y)}`;
}
function dueLabel(left) {
  if (left === 0) return t('today');
  if (left === 1) return t('tomorrow');
  return LANG ? `in ${left} d` : `${bn(left)} দিন পর`;
}
const stampOf = x => { if (!x.ts) return ''; const d = new Date(x.ts); return isNaN(d) ? '' : hhmm(d); };

function toast(msg) {
  const e = $('#toast'); e.textContent = msg; e.classList.add('on');
  clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2400);
}

/* ---------------- state ---------------- */
function freshState() {
  const Cat = (id, bnName, en, group) => ({ id, bn: bnName, en, group, budget: null });
  return {
    v: 2, updatedAt: new Date().toISOString(),
    settings: { lang: 0, monthStartDay: 1, dailyBudget: 0, sync: null },
    cats: [
      Cat('rent', 'বাড়ি ভাড়া', 'House rent', 'fixed'),
      Cat('util', 'বিদ্যুৎ-গ্যাস-পানি', 'Utilities', 'fixed'),
      Cat('bazar', 'বাজার', 'Groceries', 'var'),
      Cat('outfood', 'বাইরে খাওয়া', 'Eating out', 'var'),
      Cat('trans', 'যাতায়াত', 'Transport', 'var'),
      Cat('net', 'মোবাইল-ইন্টারনেট', 'Mobile & internet', 'fixed'),
      Cat('tech', 'ক্লাউড-সাবস্ক্রিপশন', 'Cloud & subscriptions', 'fixed'),
      Cat('family', 'পরিবার', 'Family support', 'fixed'),
      Cat('health', 'চিকিৎসা', 'Health', 'var'),
      Cat('edu', 'শিক্ষা-কেরিয়ার', 'Education & career', 'var'),
      Cat('self', 'ব্যক্তিগত', 'Personal', 'var'),
      Cat('card', 'ক্রেডিট কার্ড', 'Credit card', 'fixed'),
      Cat('zakat', 'যাকাত-দান', 'Zakat & donations', 'var'),
      Cat('emi', 'ঋণের কিস্তি', 'Loan instalment', 'debt'),
      Cat('dps', 'ডিপিএস', 'DPS', 'save'),
      Cat('other', 'অন্যান্য', 'Other', 'var'),
    ],
    accts: [
      { id: 'cash', bn: 'হাতে নগদ', en: 'Cash in hand', bal: 0 },
      { id: 'bank', bn: 'ব্যাংক', en: 'Bank', bal: 0 },
      { id: 'bkash', bn: 'বিকাশ', en: 'bKash', bal: 0 },
      { id: 'nagad', bn: 'নগদ', en: 'Nagad', bal: 0 },
    ],
    srcs: [
      { id: 'salary', bn: 'বেতন', en: 'Salary', kind: 'salary' },
      { id: 'biz', bn: 'ব্যবসা', en: 'Business', kind: 'biz' },
      { id: 'free', bn: 'ফ্রিল্যান্স', en: 'Freelance', kind: 'free' },
      { id: 'other', bn: 'অন্য আয়', en: 'Other income', kind: 'oneoff' },
    ],
    txns: [], dps: [], loans: [], lends: [], assets: [], goals: [], recur: [], reminders: [],
  };
}

/* Idempotent. Runs on every load, so it must be safe to apply twice. */
function migrate(st) {
  if (!st.settings) st.settings = {};
  ['cats', 'accts', 'srcs', 'txns', 'dps', 'loans', 'lends', 'assets', 'goals', 'recur', 'reminders']
    .forEach(k => { if (!Array.isArray(st[k])) st[k] = []; });
  const f = freshState();
  if (!st.cats.length) st.cats = f.cats;
  if (!st.accts.length) st.accts = f.accts;
  if (!st.srcs.length) st.srcs = f.srcs;
  /* v1 had no credit card category */
  if (!st.cats.some(c => c.id === 'card')) {
    st.cats.splice(Math.max(0, st.cats.length - 3), 0,
      { id: 'card', bn: 'ক্রেডিট কার্ড', en: 'Credit card', group: 'fixed', budget: null });
  }
  /* v1 fixed monthly items had no account, so they debited nothing */
  st.recur.forEach(r => { if (!r.acct) r.acct = st.accts[0] && st.accts[0].id; });
  /* v2 lend rows had no part-repayment list. An empty one means nothing repaid,
     so every existing row keeps the balance it already showed. */
  st.lends.forEach(l => { if (!Array.isArray(l.repays)) l.repays = []; });
  /* Existing txn.date values are deliberately left alone. Pinning the clock to
     Dhaka changes how NEW dates are derived; silently moving old entries to a
     different day would be worse than the problem it solves. */
  st.v = 2;
  return st;
}

let S = freshState();
let KEY = null;

/* ---------------- saving ---------------- */
let saveTimer = null;
function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { flushSave(); }, 350); }

async function flushSave() {
  if (!KEY) return true;
  try {
    await saveState(KEY, S);
    $('#banner').classList.add('hide');
    paintSync();
    queueSync();          // the write is on this device; get it to the others
    return true;
  } catch (e) {
    /* A save that fails silently is the worst thing this app can do, so this
       is a banner that stays up, not a toast that fades away. */
    const b = $('#banner');
    b.innerHTML = `<b>${t('saveFailed')}</b>${t('saveFailedMsg')}<br><small>${esc(String(e.message || e))}</small>`;
    b.classList.remove('hide');
    return false;
  }
}
/* Change state, persist, redraw. */
function change() { queueSave(); render(); }

/* ---------------- github sync ---------------- */
const GH = 'https://api.github.com';
const syncCfg = () => S.settings.sync;
const ghHeaders = tok => ({ Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' });

async function ghGet(cfg, tok) {
  const r = await fetch(`${GH}/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}`, { headers: ghHeaders(tok) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('GitHub ' + r.status);
  const j = await r.json();
  return { sha: j.sha, pack: JSON.parse(atob(j.content.replace(/\n/g, ''))) };
}
async function ghPut(cfg, tok, pack, sha) {
  const body = { message: 'khata ' + new Date().toISOString(), content: btoa(JSON.stringify(pack)) };
  if (sha) body.sha = sha;
  const r = await fetch(`${GH}/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}`, {
    method: 'PUT', headers: { ...ghHeaders(tok), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('GitHub ' + r.status + ' — ' + (await r.text()).slice(0, 140));
  return (await r.json()).content.sha;
}
const isEmptyBook = () =>
  !S.txns.length && !S.dps.length && !S.loans.length && !S.goals.length && !S.lends.length
  && !S.assets.length && !S.recur.length && !S.reminders.length && S.accts.every(a => !Number(a.bal));

async function adoptRemote(rState, sha) {
  S = migrate(rState); LANG = S.settings.lang || 0;
  await saveState(KEY, S);
  setMeta({ dirty: false, sha, syncedAt: new Date().toISOString(), syncState: 'ok' });
  render(); toast(t('synced'));
}

async function doSync(force) {
  const cfg = syncCfg();
  if (!cfg || !cfg.owner || !cfg.repo) { setMeta({ syncState: 'none' }); paintSync(); return; }
  const tok = await loadToken(KEY);
  if (!tok) { setMeta({ syncState: 'none' }); paintSync(); return; }
  if (!navigator.onLine) { setMeta({ syncState: 'offline' }); paintSync(); return; }
  setMeta({ syncState: 'busy' }); paintSync();
  try {
    const remote = await ghGet(cfg, tok);
    const m = meta();
    if (remote) {
      let rState;
      try { rState = await unseal(KEY, remote.pack); } catch { throw new Error(t('wrongPass')); }
      if (isEmptyBook()) return void await adoptRemote(rState, remote.sha);   // new device
      const remoteMoved = remote.sha !== m.sha;
      if (!m.dirty) {
        /* Nothing local to push. Take the server copy if it has moved on,
           otherwise there is genuinely nothing to do — never upload here,
           which is how the old version could overwrite a newer remote. */
        if (remoteMoved) return void await adoptRemote(rState, remote.sha);
        setMeta({ syncState: 'ok' }); paintSync(); return;
      }
      if (remoteMoved && !force) {
        window._remoteState = rState;
        setMeta({ syncState: 'conflict', remoteSha: remote.sha });
        render(); return;
      }
    }
    const sha = await ghPut(cfg, tok, await seal(KEY, S), remote ? remote.sha : null);
    setMeta({ dirty: false, sha, syncedAt: new Date().toISOString(), syncState: 'ok' });
    toast(t('synced'));
  } catch (e) {
    setMeta({ syncState: 'err', syncErr: String(e.message || e) });
  }
  paintSync();
}

/* ---------------- keeping two devices on one book ----------------

   Saving is local. Sync used to run only on open, on the সিঙ্ক button, and
   when the network came back — so an entry typed on the laptop sat on the
   laptop until someone remembered to press a button, and the phone showed an
   older book. That is not a sync anyone can trust with a household ledger.

   Three triggers cover ordinary use: a pause after typing, leaving the page,
   and coming back to it.

   Pulling redraws the screen, which would throw away an amount half typed —
   so a pull waits until nothing is focused and no sheet is open. Pushing what
   this device already wrote is safe at any moment and is never held back. */
let syncTimer = null, syncing = false;

const midEdit = () =>
  !!SH || !!(document.activeElement && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName));

/* Debounced: ten entries typed in a row become one upload, not ten. */
function queueSync() {
  if (!syncCfg()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => autoSync(), 4000);
}

async function autoSync(wantPull) {
  if (syncing || !KEY || !syncCfg()) return;
  /* A conflict is waiting on a decision only the user can make. Retrying it on
     a timer would just reprint the banner over and over. */
  if (meta().syncState === 'conflict') return;
  if (!meta().dirty && !wantPull) return;
  if (wantPull && midEdit()) return;
  syncing = true;
  try { await doSync(false); } catch { /* doSync paints its own failure */ }
  syncing = false;
}

function paintSync() {
  const m = meta(), dot = $('#syncDot'), txt = $('#syncTxt');
  if (!dot) return;
  const st = m.syncState || (syncCfg() ? 'warn' : 'none');
  const map = {
    ok: ['ok', LANG ? 'Synced' : 'সিঙ্ক হয়েছে'],
    busy: ['warn', LANG ? 'Syncing…' : 'সিঙ্ক হচ্ছে…'],
    conflict: ['err', LANG ? 'Conflict' : 'দুই রকম তথ্য'],
    err: ['err', LANG ? 'Sync failed' : 'সিঙ্ক হয়নি'],
    offline: ['warn', t('offline')],
    none: ['', LANG ? 'This device only' : 'শুধু এই ডিভাইসে'],
    warn: ['warn', LANG ? 'Not synced yet' : 'সিঙ্ক বাকি'],
  };
  const [cls, label] = map[st] || map.none;
  dot.className = cls;
  txt.textContent = label;
  const d = $('#dateTxt'); if (d) d.textContent = dateLong(todayISO());
}

/* ---------------- render primitives ---------------- */
function row(tick, title, sub, amt, cls, tail) {
  return `<div class="row">
    <div class="tick">${tick ? '✓' : ''}</div>
    <div class="lab"><b>${esc(title)}</b>${sub ? `<span>${sub}</span>` : ''}</div>
    <div class="amt ${cls || ''} num">${amt}${tail || ''}</div>
  </div>`;
}
const bar = (pct, over) => `<div class="bar"><i class="${over ? 'over' : ''}" style="width:${Math.min(100, Math.max(0, pct))}%"></i></div>`;
const kpi = (k, v, n, cls) => `<div class="kpi"><div class="k">${k}</div><div class="v ${cls || ''} num">${v}</div>${n ? `<div class="n">${n}</div>` : ''}</div>`;

function spark(days) {
  const w = 104, h = 34, max = Math.max(1, ...days.map(d => d.v));
  const step = days.length > 1 ? w / (days.length - 1) : w;
  const y = v => (h - 3 - (v / max) * (h - 8)).toFixed(1);
  const pts = days.map((d, i) => `${(i * step).toFixed(1)},${y(d.v)}`).join(' ');
  const last = days[days.length - 1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="${t('last7')}">
    <line class="base" x1="0" y1="${h - 1}" x2="${w}" y2="${h - 1}"/>
    <polyline points="${pts}"/>
    <circle class="today" cx="${w}" cy="${y(last.v)}" r="2.8"/></svg>`;
}

function catBars(list, total) {
  if (!list.length) return `<div class="empty">${LANG ? 'Nothing yet.' : 'এখনো কিছু নেই।'}</div>`;
  return `<div class="bars">` + list.map(x => {
    const b = Number(x.cat.budget) || 0, over = b && x.v > b;
    const pct = b ? x.v / b * 100 : (total ? x.v / total * 100 : 0);
    return `<div class="cbar"><div class="t"><span>${esc(L(x.cat))}</span>
      <span class="num">${fmt(x.v)}${b ? ` / ${grp(b)}` : ''}</span></div>
      <div class="track"><i class="${over ? 'over' : ''}" style="width:${Math.min(100, pct)}%"></i></div></div>`;
  }).join('') + `</div>`;
}

function acctSelect(id, selected) {
  return `<select class="inp w" id="${id}" name="${id}">` +
    S.accts.map(a => `<option value="${a.id}"${a.id === selected ? ' selected' : ''}>${esc(L(a))}</option>`).join('') +
    `</select>`;
}

/* Turn a due item into a subtitle, skipping it when it would just repeat the
   label — a rent item in the rent category should not read "rent rent". */
function dueSub(u) {
  let s = '';
  if (u.kind === 'note') s = u.note || '';
  else if (u.kind === 'recur') { const c = C.catOf(S, u.catId); s = c ? L(c) : ''; }
  else if (u.kind === 'loan') s = t('instalment');
  else if (u.kind === 'dps') s = t('dps');
  return s && s !== u.label ? s : '';
}

function upcomingBlock() {
  const list = C.upcomingAll(S, todayISO(), 30);
  if (!list.length) return '';
  return `<div class="up"><h4>${t('upcoming')}</h4>` + list.slice(0, 6).map(u => {
    const sub = dueSub(u);
    return `<div class="up-row${u.left <= 3 ? ' soon' : ''}">
      <span class="w">${esc(u.label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>
      <span class="num">${fmt(u.amount)}</span>
      <span class="when">${dueLabel(u.left)}</span>
    </div>`;
  }).join('') + `</div>`;
}

/* ---------------- views ---------------- */
let TAB = 'over';
let openDay = null;   // which day is expanded in the history view

function viewOver() {
  const today = todayISO(), p = C.periodOf(S, today);
  const st = C.spentOn(S, today), db = C.dailyBudget(S, p), left = db - st, over = left < 0;
  const mtd = C.spentIn(S, p), mb = C.monthBudget(S);
  const inc = C.earnedIn(S, p), sr = C.savingsRate(S, p);
  const nw = C.netWorth(S), rw = C.runway(S, p, today), d = C.dti(S, p);
  const proj = C.projectedSpend(S, p, today), fv = C.fixedVar(S, p), ps = C.plannedShare(S, p);

  let h = `<section class="hero">
    <div class="top-line">
      <div>
        <div class="big">${fmt(st)}</div>
        <div class="cap">${t('spentToday')}</div>
      </div>
      ${spark(C.lastDays(S, today, 7))}
    </div>
    ${db
      ? bar(st / db * 100, over) + `<div class="barcap">
          <span>${over ? t('overToday') : t('leftToday')}: <b class="num">${fmt(Math.abs(left))}</b></span>
          <span class="num">${fmt(db)} / ${t('perDay')}</span></div>`
      : `<div class="barcap" style="margin-top:14px"><span>${t('noBudget')}</span></div>`}
    <div class="barcap" style="margin-top:8px">
      <span>${t('mtd')}</span><span class="num">${fmt(mtd)}${mb ? ` / ${grp(mb)}` : ''}</span></div>
  </section>`;

  h += upcomingBlock();

  h += `<div class="kpis">
    ${kpi(t('savingsRate'), (sr ? sr.toFixed(0) : '0') + '%', `${fmt(inc)} − ${fmt(mtd)}`, sr >= 20 ? 'good' : sr >= 5 ? 'mid' : 'bad')}
    ${kpi(t('netWorth'), fmt(nw), t('liquid') + ' ' + fmt(C.liquid(S)), nw >= 0 ? '' : 'bad')}
    ${kpi(t('runway'), (rw ? rw.toFixed(1) : '0') + ' ' + t('months'), '', rw >= 6 ? 'good' : rw >= 3 ? 'mid' : 'bad')}
    ${kpi(t('dti'), d.toFixed(0) + '%', `${t('emi')} ${fmt(C.totalEmi(S))}`, d < 20 ? 'good' : d < 36 ? 'mid' : 'bad')}
  </div>`;

  h += `<section class="sec"><h3>${t('thisMonth')}</h3><div class="ledger">
    ${row(0, t('income'), '', fmt(inc), 'in')}
    ${row(0, t('expense'), mb ? `${LANG ? 'budget' : 'বাজেট'} ${fmt(mb)}` : '', fmt(mtd), 'out')}
    ${row(0, t('projected'), '', fmt(proj), mb && proj > mb ? 'out' : '')}
    ${row(0, t('fixedVar'), '', `${grp(fv.f)} / ${grp(fv.v)}`)}
    ${ps !== null ? row(0, t('plannedShare'), '', ps.toFixed(0) + '%', ps >= 70 ? 'in' : 'out') : ''}
  </div></section>`;

  h += `<section class="sec"><h3>${t('byCategory')}</h3>${catBars(C.byCategory(S, p), mtd)}</section>`;

  const mix = C.incomeMix(S, p);
  if (mix.length) {
    const tot = mix.reduce((s, x) => s + x.v, 0);
    h += `<section class="sec"><h3>${t('incomeMix')}</h3><div class="ledger">` +
      mix.map(x => row(0, L(x.src), (x.v / tot * 100).toFixed(0) + '%', fmt(x.v), 'in')).join('') + `</div></section>`;
  }
  return h;
}

function viewDays() {
  const groups = C.dayGroups(S);
  if (!groups.length) return `<div class="empty">${t('noHistory')}</div>`;

  let h = '', lastP = null;
  for (const g of groups) {
    const p = C.periodOf(S, g.date);
    if (p !== lastP) {
      lastP = p;
      h += `<div class="monthsep"><b>${monthLabel(p)}</b><span>${fmt(C.spentIn(S, p))}</span></div>`;
    }
    const isOpen = openDay === g.date;
    h += `<div class="daycard">
      <button class="dayhead" data-day="${g.date}" aria-expanded="${isOpen}">
        <span><b>${LANG ? EN_DAY[dowOf(g.date)] : BN_DAY[dowOf(g.date)]}</b>
          <span class="sub">${dateMid(g.date)} · ${bn(g.entries.length)} ${t('entries')}</span></span>
        <span class="tot num">${fmt(g.out)}${g.inc ? `<i>+${grp(g.inc)}</i>` : ''}<span class="chev">${isOpen ? '▲' : '▼'}</span></span>
      </button>`;
    if (isOpen) {
      h += `<div class="ledger">` + g.entries.map(x => {
        const label = x.type === 'expense'
          ? L(C.catOf(S, x.cat) || { bn: '?', en: '?' })
          : L(C.srcOf(S, x.src) || { bn: '?', en: '?' });
        const sub = [stampOf(x), esc(x.note || ''), esc(L(C.acctOf(S, x.acct) || { bn: '', en: '' }))].filter(Boolean).join(' · ');
        return row(x.type === 'expense' && x.planned, label, sub,
          (x.type === 'expense' ? '−' : '+') + grp(x.amount),
          x.type === 'expense' ? 'out' : 'in',
          `<button class="edit" data-edittxn="${x.id}" aria-label="${t('edit')}">✎</button>
           <button class="del" data-deltxn="${x.id}" aria-label="${t('del')}">×</button>`);
      }).join('') + `</div>`;
    }
    h += `</div>`;
  }
  return h;
}

function viewAcct() {
  const today = todayISO();
  let h = `<section class="sec"><h3>${t('accounts')}</h3><div class="ledger">` +
    S.accts.map(a => `<div class="row"><div class="tick"></div>
      <div class="lab"><label for="bal-${a.id}"><b>${esc(L(a))}</b></label></div>
      <div class="amt num"><input class="num" id="bal-${a.id}" name="bal-${a.id}" data-bal="${a.id}" type="number"
        inputmode="numeric" value="${a.bal || 0}" style="width:118px;text-align:right;padding:7px 9px;
        border:1px solid var(--rule);border-radius:8px;background:var(--card)"></div></div>`).join('') +
    row(0, t('liquid'), '', fmt(C.liquid(S))) + `</div></section>`;

  /* DPS */
  h += `<section class="sec"><h3>${t('dps')}</h3><div class="ledger">`;
  h += S.dps.length ? S.dps.map(d => {
    const due = C.dpsNextDue(d, today), paid = (d.paid || []).length;
    return `<div class="row"><div class="tick">${due ? '' : '✓'}</div>
      <div class="lab"><b>${esc(d.bank)}</b><span>${t('paidCount')} ${bn(paid)}/${bn(d.tenure)} ·
        ${t('maturity')} ${fmt(C.dpsMaturity(d))} ·
        ${due ? `<span class="pill due">${due}</span>` : `<span class="pill ok">${LANG ? 'up to date' : 'হালনাগাদ'}</span>`}</span></div>
      <div class="amt num">${fmt(d.inst)}
        ${due ? `<button class="btn sm mg" data-dpspay="${d.id}">${t('markPaid')}</button>` : ''}
        <button class="edit" data-edit="dps:${d.id}" aria-label="${t('editRow')}">✎</button>
        <button class="del" data-deldps="${d.id}" aria-label="${t('del')}">×</button></div></div>`;
  }).join('') : `<div class="empty">${LANG ? 'No DPS added.' : 'কোনো ডিপিএস নেই।'}</div>`;
  h += `</div><div class="grid2" style="margin-top:12px">
      <div><label class="fl" for="dBank">${t('bank')}</label><input class="inp w" id="dBank" name="dBank"></div>
      <div><label class="fl" for="dInst">${t('instalment')}</label><input class="inp w num" id="dInst" name="dInst" type="number" inputmode="numeric"></div>
      <div><label class="fl" for="dRate">${t('rate')}</label><input class="inp w num" id="dRate" name="dRate" type="number" step="0.01"></div>
      <div><label class="fl" for="dTen">${t('tenure')}</label><input class="inp w num" id="dTen" name="dTen" type="number" inputmode="numeric"></div>
      <div><label class="fl" for="dStart">${t('start')}</label><input class="inp w" id="dStart" name="dStart" type="month"></div>
      <div><label class="fl" for="dDay">${t('dueDay')}</label><input class="inp w num" id="dDay" name="dDay" type="number" min="1" max="28" value="5"></div>
    </div><button class="btn ghost sm" id="dAdd" style="margin-top:10px">${t('add')}</button></section>`;

  /* loans */
  h += `<section class="sec"><h3>${t('loans')}</h3><div class="ledger">`;
  h += S.loans.length ? S.loans.map(l => {
    const ml = C.loanMonthsLeft(l);
    return `<div class="row"><div class="tick"></div>
      <div class="lab"><b>${esc(l.lender)}</b><span>${t('outstanding')} ${fmt(l.out)} ·
        ${t('payoff')} ${ml === Infinity ? '∞' : bn(ml) + ' ' + t('months')} ·
        ${t('interestThisMonth')} ${fmt(C.loanInterest(l))}</span></div>
      <div class="amt num">${fmt(l.emi)}
        <button class="btn sm mg" data-loanpay="${l.id}">${t('markPaid')}</button>
        <button class="edit" data-edit="loan:${l.id}" aria-label="${t('editRow')}">✎</button>
        <button class="del" data-delloan="${l.id}" aria-label="${t('del')}">×</button></div></div>`;
  }).join('') : `<div class="empty">${LANG ? 'No loans. Good.' : 'কোনো ঋণ নেই। ভালো।'}</div>`;
  h += `</div><div class="grid2" style="margin-top:12px">
      <div><label class="fl" for="lName">${t('lender')}</label><input class="inp w" id="lName" name="lName"></div>
      <div><label class="fl" for="lOut">${t('outstanding')}</label><input class="inp w num" id="lOut" name="lOut" type="number" inputmode="numeric"></div>
      <div><label class="fl" for="lEmi">${t('emi')}</label><input class="inp w num" id="lEmi" name="lEmi" type="number" inputmode="numeric"></div>
      <div><label class="fl" for="lRate">${t('rate')}</label><input class="inp w num" id="lRate" name="lRate" type="number" step="0.01"></div>
      <div><label class="fl" for="lDay">${t('dueDay')}</label><input class="inp w num" id="lDay" name="lDay" type="number" min="1" max="28" value="10"></div>
    </div><button class="btn ghost sm" id="lAdd" style="margin-top:10px">${t('add')}</button></section>`;

  /* lending */
  h += `<section class="sec"><h3>${t('lending')}</h3><div class="ledger">`;
  h += S.lends.length ? S.lends.map(l => {
    const open = C.lendOpen(l), paid = C.lendPaid(l), left = C.lendLeft(l);
    /* Direction, date and note read as one subtitle. Any of the three can be
       missing on an older row, so empties are dropped rather than left as
       stray separators. */
    const sub = [l.dir === 'gave' ? t('gave') : t('took'), l.date ? dateMid(l.date) : '', l.note ? esc(l.note) : '']
      .filter(Boolean).join(' · ');
    return `<div class="row"><div class="tick">${open ? '' : '✓'}</div>
      <div class="lab"><b>${esc(l.person)}</b><span>${sub}</span>
        ${paid ? `<span class="part">${LANG ? `${fmt(paid)} of ${fmt(l.amount)} back` : `${fmt(l.amount)} এর মধ্যে ${fmt(paid)} শোধ`}</span>` : ''}</div>
      <div class="amt num ${l.dir === 'gave' ? 'in' : 'out'}">${fmt(paid ? left : l.amount)}
        ${open ? `<button class="btn sm ghost" data-lendrepay="${l.id}">${t('repay')}</button>
        <button class="btn sm ghost" data-settle="${l.id}">${t('settle')}</button>` : ''}
        <button class="edit" data-edit="lend:${l.id}" aria-label="${t('editRow')}">✎</button>
        <button class="del" data-dellend="${l.id}" aria-label="${t('del')}">×</button></div></div>`;
  }).join('')
    : `<div class="empty">${LANG ? 'Nothing outstanding.' : 'কিছু বাকি নেই।'}</div>`;
  h += `</div><div class="grid2" style="margin-top:12px">
      <div><label class="fl" for="ldPerson">${t('person')}</label><input class="inp w" id="ldPerson" name="ldPerson"></div>
      <div><label class="fl" for="ldAmt">${t('amount')}</label><input class="inp w num" id="ldAmt" name="ldAmt" type="number" inputmode="numeric"></div>
    </div>
    <div class="grid2">
      <div><label class="fl" for="ldDate">${t('date')}</label>
        <input class="inp w" id="ldDate" name="ldDate" type="date" value="${todayISO()}"></div>
      <div><label class="fl" for="ldNote">${t('note')}</label><input class="inp w" id="ldNote" name="ldNote"></div>
    </div>
    <div class="togg" style="margin-top:10px"><button id="ldGave" class="on">${t('gave')}</button><button id="ldTook">${t('took')}</button></div>
    <button class="btn ghost sm" id="ldAdd" style="margin-top:10px">${t('add')}</button>
    <div class="note">${t('lendHint')}</div></section>`;

  /* other savings */
  h += `<section class="sec"><h3>${t('assets')}</h3><div class="ledger">`;
  h += S.assets.length ? S.assets.map(a => `<div class="row"><div class="tick"></div>
      <div class="lab"><b>${esc(a.name)}</b></div>
      <div class="amt num">${fmt(a.value)}
        <button class="edit" data-edit="asset:${a.id}" aria-label="${t('editRow')}">✎</button>
        <button class="del" data-delasset="${a.id}" aria-label="${t('del')}">×</button></div></div>`).join('')
    : `<div class="empty">${LANG ? 'None added.' : 'কিছু যোগ করা হয়নি।'}</div>`;
  h += `</div><div class="grid2" style="margin-top:12px">
      <div><label class="fl" for="asName">${t('name')}</label><input class="inp w" id="asName" name="asName" placeholder="FDR / সঞ্চয়পত্র"></div>
      <div><label class="fl" for="asVal">${t('amount')}</label><input class="inp w num" id="asVal" name="asVal" type="number" inputmode="numeric"></div>
    </div><button class="btn ghost sm" id="asAdd" style="margin-top:10px">${t('add')}</button></section>`;
  return h;
}

function viewPlan() {
  const today = todayISO(), p = C.periodOf(S, today);

  /* reminders first — this is the thing you actually want to see */
  let h = `<section class="sec"><h3>${t('reminders')}</h3>
    <div class="note">${t('remHint')}</div><div class="ledger" style="margin-top:10px">`;
  const rem = (S.reminders || []).slice().sort((a, b) => String(a.due).localeCompare(String(b.due)));
  h += rem.length ? rem.map(r => {
    const due = r.repeat === 'monthly' ? C.nextDom(today, Number(r.due.split('-')[2])) : r.due;
    const left = C.daysBetween(today, due);
    const settled = r.repeat === 'monthly' ? r.doneFor === due.slice(0, 7) : !!r.done;
    return `<div class="row"><div class="tick">${settled ? '✓' : ''}</div>
      <div class="lab"><b>${esc(r.title)}</b><span>${dateMid(due)}
        ${left >= 0 && !settled ? `· <span class="pill${left <= 3 ? ' due' : ''}">${dueLabel(left)}</span>` : ''}
        ${r.repeat === 'monthly' ? `· ${t('remMonthly')}` : ''}</span></div>
      <div class="amt num">${fmt(r.amount)}
        ${settled ? '' : `<button class="btn sm ghost" data-remdone="${r.id}">${t('remDone')}</button>`}
        <button class="edit" data-edit="rem:${r.id}" aria-label="${t('editRow')}">✎</button>
        <button class="del" data-delrem="${r.id}" aria-label="${t('del')}">×</button></div></div>`;
  }).join('') : `<div class="empty">${LANG ? 'No reminders yet.' : 'কিছু মনে রাখার নেই।'}</div>`;
  h += `</div><div class="grid2" style="margin-top:12px">
      <div><label class="fl" for="nTitle">${t('remTitle')}</label><input class="inp w" id="nTitle" name="nTitle" placeholder="${LANG ? 'Credit card bill' : 'ক্রেডিট কার্ডের বিল'}"></div>
      <div><label class="fl" for="nAmt">${t('amount')}</label><input class="inp w num" id="nAmt" name="nAmt" type="number" inputmode="numeric"></div>
      <div><label class="fl" for="nDue">${t('deadline')}</label><input class="inp w" id="nDue" name="nDue" type="date" value="${today}"></div>
      <div><label class="fl" for="nRep">${t('remMonthly')}</label>
        <select class="inp w" id="nRep" name="nRep"><option value="">${LANG ? 'One time' : 'একবার'}</option>
        <option value="monthly">${LANG ? 'Every month' : 'প্রতি মাসে'}</option></select></div>
    </div><button class="btn ghost sm" id="nAdd" style="margin-top:10px">${t('add')}</button></section>`;

  /* budget */
  h += `<section class="sec"><h3>${t('budget')}</h3><div class="note">${t('planTip')}</div>
    <div class="ledger" style="margin-top:10px">` +
    S.cats.map(c => `<div class="row"><div class="tick"></div>
      <div class="lab"><label for="bg-${c.id}"><b>${esc(L(c))}</b></label></div>
      <div class="amt num"><input class="num" id="bg-${c.id}" name="bg-${c.id}" data-budget="${c.id}" type="number"
        inputmode="numeric" value="${c.budget ?? ''}" placeholder="—"
        style="width:110px;text-align:right;padding:7px 9px;border:1px solid var(--rule);border-radius:8px;background:var(--card)"></div>
    </div>`).join('') +
    row(0, t('monthly'), '', fmt(C.monthBudget(S))) +
    row(0, t('dailyBudget'), '', fmt(C.dailyBudget(S, p))) + `</div></section>`;

  /* goals */
  h += `<section class="sec"><h3>${t('goals')}</h3><div class="ledger">`;
  h += S.goals.length ? S.goals.map(g => {
    const leftAmt = Math.max(0, (Number(g.target) || 0) - (Number(g.saved) || 0));
    const mo = g.deadline ? Math.max(1, Math.round(C.daysBetween(today, g.deadline) / 30.44)) : 0;
    const pct = g.target ? (Number(g.saved) || 0) / g.target * 100 : 0;
    return `<div class="row"><div class="tick">${pct >= 100 ? '✓' : ''}</div>
      <div class="lab"><label for="gs-${g.id}"><b>${esc(g.name)}</b></label><span>${fmt(g.saved || 0)} / ${fmt(g.target)}
        · ${pct.toFixed(0)}%${mo ? ` · ${t('needMonthly')} ${fmt(leftAmt / mo)}` : ''}</span></div>
      <div class="amt num"><input class="num" id="gs-${g.id}" name="gs-${g.id}" data-goalsaved="${g.id}" type="number"
        inputmode="numeric" value="${g.saved || 0}"
        style="width:110px;text-align:right;padding:7px 9px;border:1px solid var(--rule);border-radius:8px;background:var(--card)">
        <button class="edit" data-edit="goal:${g.id}" aria-label="${t('editRow')}">✎</button>
        <button class="del" data-delgoal="${g.id}" aria-label="${t('del')}">×</button></div></div>`;
  }).join('') : `<div class="empty">${LANG ? 'No goals yet.' : 'কোনো লক্ষ্য নেই।'}</div>`;
  h += `</div><div class="grid2" style="margin-top:12px">
      <div><label class="fl" for="gName">${t('name')}</label><input class="inp w" id="gName" name="gName"></div>
      <div><label class="fl" for="gTarget">${t('target')}</label><input class="inp w num" id="gTarget" name="gTarget" type="number" inputmode="numeric"></div>
      <div><label class="fl" for="gDate">${t('deadline')}</label><input class="inp w" id="gDate" name="gDate" type="date"></div>
    </div><button class="btn ghost sm" id="gAdd" style="margin-top:10px">${t('add')}</button></section>`;

  /* recurring */
  h += `<section class="sec"><h3>${t('recurring')}</h3><div class="ledger">`;
  h += S.recur.length ? S.recur.map(r => `<div class="row"><div class="tick">${r.autoAdded === p ? '✓' : ''}</div>
      <div class="lab"><b>${esc(r.name)}</b><span>${esc(L(C.catOf(S, r.cat) || { bn: '', en: '' }))}
        · ${LANG ? 'day' : 'তারিখ'} ${bn(r.day)} · ${esc(L(C.acctOf(S, r.acct) || { bn: '', en: '' }))}</span></div>
      <div class="amt num">${fmt(r.amount)}
        <button class="edit" data-edit="rec:${r.id}" aria-label="${t('editRow')}">✎</button>
        <button class="del" data-delrec="${r.id}" aria-label="${t('del')}">×</button></div></div>`).join('')
    : `<div class="empty">${LANG ? 'None yet. Add rent, internet, subscriptions.' : 'কিছু নেই। বাড়ি ভাড়া, ইন্টারনেট, সাবস্ক্রিপশন যোগ করুন।'}</div>`;
  h += `</div><div class="grid2" style="margin-top:12px">
      <div><label class="fl" for="rName">${t('name')}</label><input class="inp w" id="rName" name="rName"></div>
      <div><label class="fl" for="rAmt">${t('amount')}</label><input class="inp w num" id="rAmt" name="rAmt" type="number" inputmode="numeric"></div>
      <div><label class="fl" for="rCat">${t('category')}</label><select class="inp w" id="rCat" name="rCat">${S.cats.map(c => `<option value="${c.id}">${esc(L(c))}</option>`).join('')}</select></div>
      <div><label class="fl" for="rDay">${t('dueDay')}</label><input class="inp w num" id="rDay" name="rDay" type="number" min="1" max="28" value="1"></div>
      <div><label class="fl" for="rAcct">${t('account')}</label>${acctSelect('rAcct', S.accts[0] && S.accts[0].id)}</div>
    </div><button class="btn ghost sm" id="rAdd" style="margin-top:10px">${t('add')}</button></section>`;
  return h;
}

/* The start-day setting is easy to mistrust — "does 25 mean July or August?"
   Spelling the window out removes the doubt: pick 25 and you can see for
   yourself that July now begins on the day the salary lands. */
function cycleLabel() {
  const sd = Math.min(28, Math.max(1, Number(S.settings.monthStartDay) || 1));
  const [py, pm] = C.periodOf(S, todayISO()).split('-').map(Number);
  const iso = d => d.toISOString().slice(0, 10);
  const from = new Date(Date.UTC(py, pm - 1, sd));
  const to = new Date(Date.UTC(py, pm, sd));
  to.setUTCDate(to.getUTCDate() - 1);
  return `${dateMid(iso(from))} – ${dateMid(iso(to))}`;
}

function viewSet() {
  const m = meta(), cfg = syncCfg() || {};
  /* Warn on the stored blob, not the wire size, but calibrated against the
     wire: the base64 body GitHub receives runs about 1.33x the blob, and its
     Contents API caps at 1 MB. 600 KB stored is roughly 800 KB on the wire,
     which leaves several hundred more entries of room after the first warning
     rather than the handful a 700 KB threshold would have left. */
  const kb = (blobSize() / 1024).toFixed(0);
  let h = `<section class="sec"><h3>${t('language')}</h3>
    <div class="togg"><button data-lang="0" class="${LANG === 0 ? 'on' : ''}">বাংলা</button>
    <button data-lang="1" class="${LANG === 1 ? 'on' : ''}">English</button></div></section>`;

  h += `<section class="sec"><h3>${t('sync')}</h3>`;
  if (m.syncState === 'conflict') {
    h += `<div class="warn"><b>${t('conflict')}</b><br>
      <button class="btn sm" id="cfLocal" style="margin-top:8px">${t('keepLocal')}</button>
      <button class="btn sm ghost" id="cfRemote" style="margin-top:8px">${t('keepRemote')}</button></div>`;
  }
  if (m.syncState === 'err') h += `<div class="warn">${esc(m.syncErr || '')}</div>`;
  h += `<div class="grid2">
      <div><label class="fl" for="syOwner">${t('repoOwner')}</label><input class="inp w" id="syOwner" name="syOwner" value="${esc(cfg.owner || '')}"></div>
      <div><label class="fl" for="syRepo">${t('repoName')}</label><input class="inp w" id="syRepo" name="syRepo" value="${esc(cfg.repo || '')}"></div>
    </div>
    <label class="fl" for="syTok">${t('token')}</label>
    <input class="inp w" id="syTok" name="syTok" type="password" autocomplete="off" placeholder="${m.hasTok ? '••••••••' : ''}">
    <div class="note">${LANG
      ? 'Fine-grained token, Contents: read and write, on that one private repo only. It is encrypted on this device and never synced.'
      : 'Fine-grained টোকেন, শুধু ওই একটা প্রাইভেট রিপোতে Contents: read and write। টোকেন এই ডিভাইসেই এনক্রিপ্ট করা থাকে, কোথাও যায় না।'}</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn sm" id="sySave">${t('save')}</button>
      <button class="btn sm ghost" id="syNow">${t('syncNow')}</button>
    </div>
    <div class="note">${LANG
      ? 'Sync runs on its own — a few seconds after you stop typing, when you leave the app, and when you come back. The button is only for when you want it this second.'
      : 'সিঙ্ক নিজে নিজেই হয় — লেখা শেষ করার কয়েক সেকেন্ড পর, অ্যাপ থেকে বেরোলে, আর ফিরে এলে। বোতামটা শুধু এখনই দরকার হলে।'}</div>
    <div class="note">${LANG ? 'Last synced' : 'শেষ সিঙ্ক'}: ${m.syncedAt ? new Date(m.syncedAt).toLocaleString() : t('never')}</div>
  </section>`;

  h += `<section class="sec"><h3>${t('backup')}</h3>
    <div class="note">${LANG ? 'The file is encrypted with your passphrase. Keep a copy somewhere safe.'
      : 'ফাইলটা আপনার পাসফ্রেজ দিয়ে এনক্রিপ্ট করা। একটা কপি নিরাপদ জায়গায় রাখুন।'}</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn sm" id="bkExport">${t('export')}</button>
      <button class="btn sm ghost" id="bkImport">${t('import')}</button>
      <input type="file" id="bkFile" name="bkFile" accept=".json" class="hide">
    </div>
    <div class="note">${t('dataInfo')}: <b class="num">${kb} KB</b> · <b class="num">${S.txns.length}</b> ${t('entries')}</div>
    ${Number(kb) > 600 ? `<div class="warn">${t('sizeWarn')}</div>` : ''}
  </section>`;

  h += `<section class="sec"><h3>${LANG ? 'Month and budget' : 'মাস ও বাজেট'}</h3>
    <label class="fl" for="stStart">${LANG ? 'Month starts on day' : 'মাস শুরু হয় কত তারিখে'}</label>
    <input class="inp num" id="stStart" name="stStart" type="number" min="1" max="28" value="${S.settings.monthStartDay || 1}" style="width:120px">
    <div class="note">${t('startHint')}</div>
    <div class="note"><b>${LANG ? 'Right now this month runs' : 'এখন আপনার মাস চলছে'}: ${cycleLabel()}</b></div>
    <label class="fl" for="stDaily">${t('dailyBudget')}</label>
    <input class="inp num" id="stDaily" name="stDaily" type="number" inputmode="numeric" value="${S.settings.dailyBudget || ''}"
      placeholder="${LANG ? 'auto from budget' : 'বাজেট থেকে হিসাব হবে'}" style="width:180px">
  </section>`;

  h += `<section class="sec"><h3>${LANG ? 'Danger zone' : 'সাবধান'}</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn sm ghost" id="chPass">${t('changePass')}</button>
      <button class="btn sm danger" id="wipeAll">${t('wipe')}</button>
    </div></section>`;
  return h;
}

function render() {
  const views = { over: viewOver, days: viewDays, acct: viewAcct, plan: viewPlan, set: viewSet };
  $('#pgTitle').textContent = t('pg.' + TAB);
  $('#view').innerHTML = views[TAB]();
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === TAB));
  $$('[data-t]').forEach(e => { e.textContent = t(e.dataset.t); });
  document.documentElement.lang = LANG ? 'en' : 'bn';
  paintSync();
}

/* ---------------- the sheet: add, edit, pay ---------------- */
/* ---------------- editing a row ----------------

   Every ledger could add and delete but never correct: one wrong digit in a
   loan balance meant deleting the row and typing all of it again, which on a
   DPS also threw away the record of which instalments had been paid.

   Each kind names its fields once here. The sheet, the prefill, the save and
   the validation all read from that one list, so a row cannot end up with an
   edit screen that disagrees with the form that created it, and a new kind
   needs no new sheet code. */
const FORMS = {
  dps: {
    title: 'dps', list: () => S.dps,
    fields: [
      { k: 'bank', lab: 'bank', type: 'text', req: true },
      { k: 'inst', lab: 'instalment', type: 'num' },
      { k: 'rate', lab: 'rate', type: 'num' },
      { k: 'tenure', lab: 'tenure', type: 'num' },
      { k: 'start', lab: 'start', type: 'month' },
      { k: 'dueDay', lab: 'dueDay', type: 'num' },
    ],
  },
  loan: {
    title: 'loans', list: () => S.loans,
    fields: [
      { k: 'lender', lab: 'lender', type: 'text', req: true },
      { k: 'out', lab: 'outstanding', type: 'num' },
      { k: 'emi', lab: 'emi', type: 'num' },
      { k: 'rate', lab: 'rate', type: 'num' },
      { k: 'dueDay', lab: 'dueDay', type: 'num' },
    ],
  },
  lend: {
    title: 'lending', list: () => S.lends,
    fields: [
      { k: 'person', lab: 'person', type: 'text', req: true },
      { k: 'amount', lab: 'amount', type: 'num' },
      { k: 'date', lab: 'date', type: 'date' },
      { k: 'note', lab: 'note', type: 'text' },
      { k: 'dir', lab: 'lending', type: 'dir' },
    ],
  },
  asset: {
    title: 'assets', list: () => S.assets,
    fields: [
      { k: 'name', lab: 'name', type: 'text', req: true },
      { k: 'value', lab: 'amount', type: 'num' },
    ],
  },
  rem: {
    title: 'reminders', list: () => S.reminders,
    fields: [
      { k: 'title', lab: 'remTitle', type: 'text', req: true },
      { k: 'amount', lab: 'amount', type: 'num' },
      { k: 'due', lab: 'deadline', type: 'date' },
      { k: 'repeat', lab: 'remMonthly', type: 'rep' },
    ],
  },
  goal: {
    title: 'goals', list: () => S.goals,
    fields: [
      { k: 'name', lab: 'name', type: 'text', req: true },
      { k: 'target', lab: 'target', type: 'num' },
      { k: 'saved', lab: 'savedAmt', type: 'num' },
      { k: 'deadline', lab: 'deadline', type: 'date' },
    ],
  },
  rec: {
    title: 'recurring', list: () => S.recur,
    fields: [
      { k: 'name', lab: 'name', type: 'text', req: true },
      { k: 'amount', lab: 'amount', type: 'num' },
      { k: 'cat', lab: 'category', type: 'cat' },
      { k: 'day', lab: 'dueDay', type: 'num' },
      { k: 'acct', lab: 'account', type: 'acct' },
    ],
  },
};

const findRec = (kind, id) => (FORMS[kind] ? FORMS[kind].list().find(x => x.id === id) : null);

function editField(f, rec) {
  const id = 'ed-' + f.k, v = rec[f.k];
  const lab = `<label class="fl" for="${id}">${t(f.lab)}</label>`;
  const sel = (opts, cur) => `<select class="inp w" id="${id}" name="${id}">` +
    opts.map(o => `<option value="${o.v}"${String(cur) === String(o.v) ? ' selected' : ''}>${esc(o.t)}</option>`).join('') + '</select>';
  let input;
  if (f.type === 'num') input = `<input class="inp w num" id="${id}" name="${id}" type="number" inputmode="decimal" value="${v ?? ''}">`;
  else if (f.type === 'date') input = `<input class="inp w" id="${id}" name="${id}" type="date" value="${v || ''}">`;
  else if (f.type === 'month') input = `<input class="inp w" id="${id}" name="${id}" type="month" value="${v || ''}">`;
  else if (f.type === 'cat') input = sel(S.cats.map(c => ({ v: c.id, t: L(c) })), v);
  else if (f.type === 'acct') input = sel(S.accts.map(a => ({ v: a.id, t: L(a) })), v);
  else if (f.type === 'dir') input = sel([{ v: 'gave', t: t('gave') }, { v: 'took', t: t('took') }], v);
  else if (f.type === 'rep') input = sel([{ v: '', t: t('oneTime') }, { v: 'monthly', t: t('remMonthly') }], v || '');
  else input = `<input class="inp w" id="${id}" name="${id}" value="${esc(v || '')}">`;
  return `<div>${lab}${input}</div>`;
}

function doEdit() {
  const f = FORMS[SH.kind], rec = findRec(SH.kind, SH.id);
  if (!f || !rec) return closeSheet();
  /* Read every field before writing any, so a rejected form leaves the record
     exactly as it was rather than half changed. */
  const next = {};
  for (const fd of f.fields) {
    const el = $('#ed-' + fd.k);
    if (!el) continue;
    const raw = el.value;
    if (fd.req && !String(raw).trim()) return toast(t('enterAmount'));
    next[fd.k] = fd.type === 'num' ? (Number(raw) || 0) : raw;
  }
  Object.assign(rec, next);
  closeSheet();
  toast(t('saved!'));
  change();
}

let SH = null;

function openSheet(mode, payload) {
  const today = todayISO();
  SH = { mode, ...payload };
  let body = '';

  if (mode === 'txn') {
    const x = SH.txn;
    const isNew = !x.id;
    SH.type = x.type || 'expense';
    SH.cat = x.cat || null; SH.src = x.src || null;
    SH.planned = x.planned !== false;
    body = `<div class="togg" style="margin-bottom:11px">
        <button data-shtype="expense" class="${SH.type === 'expense' ? 'on' : ''}">${t('expense')}</button>
        <button data-shtype="income" class="${SH.type === 'income' ? 'on' : ''}">${t('income')}</button>
      </div>
      <div class="chips">` +
      (SH.type === 'expense'
        ? S.cats.map(c => `<button class="chip ${SH.cat === c.id ? 'on' : ''}" data-shcat="${c.id}">${esc(L(c))}</button>`).join('')
        : S.srcs.map(s => `<button class="chip ${SH.src === s.id ? 'on' : ''}" data-shsrc="${s.id}">${esc(L(s))}</button>`).join('')) +
      `</div>
      <div class="chips" style="margin-top:9px">` +
      [50, 100, 200, 500, 1000].map(v => `<button class="chip mg" data-shquick="${v}">${grp(v)}</button>`).join('') + `</div>
      <label class="fl" for="shAmt">${t('amount')}</label>
      <input class="inp w num" id="shAmt" name="shAmt" type="number" inputmode="decimal" min="0" value="${x.amount || ''}">
      <label class="fl" for="shNote">${t('note')}</label>
      <input class="inp w" id="shNote" name="shNote" value="${esc(x.note || '')}">
      <div class="grid2">
        <div><label class="fl" for="shAcct">${t('account')}</label>${acctSelect('shAcct', x.acct || (S.accts[0] && S.accts[0].id))}</div>
        <div><label class="fl" for="shDate">${t('date')}</label>
          <input class="inp w" id="shDate" name="shDate" type="date" value="${x.date || today}"${isNew ? ' readonly' : ''}></div>
      </div>
      ${SH.type === 'expense' ? `<div class="chips" style="margin-top:12px">
        <button class="chip ${SH.planned ? 'on' : ''}" id="shPlanned">✓ ${t('planned')}</button></div>` : ''}
      <button class="btn wide" id="shSave" style="margin-top:16px">${t('save')}</button>`;
  }

  if (mode === 'pay') {
    body = `<div class="note">${esc(SH.label)}</div>
      <label class="fl" for="shAmt">${t('amount')}</label>
      <input class="inp w num" id="shAmt" name="shAmt" type="number" inputmode="numeric" value="${SH.amount}">
      <label class="fl" for="shAcct">${t('account')}</label>${acctSelect('shAcct', S.accts[0] && S.accts[0].id)}
      <button class="btn wide mg" id="shPay" style="margin-top:16px">${t('markPaid')}</button>`;
  }

  /* Part-repayment on a lend row. The amount defaults to everything still
     owed, so "they paid it all back" is one tap, and typing over it records a
     part instead. */
  if (mode === 'repay') {
    const l = S.lends.find(x => x.id === SH.id);
    if (!l) { closeSheet(); return; }
    const left = C.lendLeft(l);
    body = `<div class="note">${esc(l.person)} · ${l.dir === 'gave' ? t('gotBack') : t('paidBack')}
        · ${t('outstanding')} ${fmt(left)}</div>
      <label class="fl" for="shAmt">${t('amount')}</label>
      <input class="inp w num" id="shAmt" name="shAmt" type="number" inputmode="numeric" min="0" max="${left}" value="${left}">
      <label class="fl" for="shDate">${t('date')}</label>
      <input class="inp w" id="shDate" name="shDate" type="date" value="${today}">
      <button class="btn wide mg" id="shRepay" style="margin-top:16px">${t('add')}</button>`;
  }

  if (mode === 'edit') {
    const f = FORMS[SH.kind], rec = findRec(SH.kind, SH.id);
    if (!f || !rec) { closeSheet(); return; }
    body = `<div class="grid2">${f.fields.map(fd => editField(fd, rec)).join('')}</div>
      <button class="btn wide" id="shEdit" style="margin-top:16px">${t('save')}</button>`;
  }

  const title = mode === 'pay' ? t('payTitle')
    : mode === 'repay' ? t('repayTitle')
    : mode === 'edit' ? `${t('editRow')} — ${t(FORMS[SH.kind].title)}`
    : (SH.txn && SH.txn.id ? t('editEntry') : t('addExpense'));
  $('#sheet').innerHTML = `<div class="box">
    <div class="grab" aria-hidden="true"></div>
    <div class="head"><h3 id="sheetTitle">${title}</h3><button class="x" id="shClose" aria-label="${LANG ? 'Close' : 'বন্ধ'}">×</button></div>
    ${body}</div>`;
  $('#sheet').classList.remove('hide');
  const a = $('#shAmt'); if (a) a.focus();
}
function closeSheet() { SH = null; $('#sheet').classList.add('hide'); $('#sheet').innerHTML = ''; }

/* Tapping a category chip re-renders the sheet, so anything already typed has
   to be carried back into SH first or it would silently vanish. */
function reopenSheet() {
  if (!SH) return;
  if (SH.mode === 'txn' && SH.txn) {
    const a = $('#shAmt'), n = $('#shNote'), ac = $('#shAcct'), dt = $('#shDate');
    if (a) SH.txn.amount = Number(a.value) || '';
    if (n) SH.txn.note = n.value;
    if (ac) SH.txn.acct = ac.value;
    if (dt) SH.txn.date = dt.value;
  }
  openSheet(SH.mode, SH);
}

const val = id => { const e = $('#' + id); return e ? String(e.value).trim() : ''; };
const numv = id => Number(val(id)) || 0;

async function saveSheetTxn() {
  const amt = numv('shAmt');
  if (!amt) return toast(t('enterAmount'));
  if (SH.type === 'expense' && !SH.cat) return toast(t('pickCat'));
  if (SH.type === 'income' && !SH.src) return toast(t('pickCat'));

  const prev = SH.txn.id ? S.txns.find(x => x.id === SH.txn.id) : null;
  const next = {
    id: prev ? prev.id : uid(),
    date: val('shDate') || todayISO(),
    ts: prev ? prev.ts : new Date().toISOString(),
    type: SH.type, amount: amt, note: val('shNote'), acct: val('shAcct'),
  };
  if (SH.type === 'expense') { next.cat = SH.cat; next.planned = SH.planned; }
  else next.src = SH.src;

  if (prev) {
    C.editTxn(S, prev, next);
    Object.assign(prev, next);
    if (SH.type === 'expense') delete prev.src; else { delete prev.cat; delete prev.planned; }
  } else {
    S.txns.push(next);
    C.applyTxn(S, next);
  }
  closeSheet();
  toast(t('saved!'));
  change();
}

/* Auto-post fixed monthly items once their day arrives. Goes through
   applyTxn, so the account balance actually moves. */
function runRecurring() {
  const today = todayISO(), p = C.periodOf(S, today);
  const dom = Number(today.split('-')[2]);
  let added = 0;
  S.recur.forEach(r => {
    if (r.autoAdded === p || dom < Number(r.day)) return;
    const txn = {
      id: uid(), date: today, ts: new Date().toISOString(), type: 'expense',
      amount: Number(r.amount) || 0, cat: r.cat, note: r.name,
      acct: r.acct || (S.accts[0] && S.accts[0].id), planned: true,
    };
    S.txns.push(txn);
    C.applyTxn(S, txn);
    r.autoAdded = p; added++;
  });
  if (added) {
    toast(LANG ? `${added} fixed item(s) added` : `${bn(added)}টি নির্দিষ্ট খরচ বসানো হয়েছে`);
    queueSave();
  }
}

/* ---------------- events ---------------- */
async function doPay() {
  const amt = numv('shAmt'), acct = val('shAcct');
  if (!amt) return toast(t('enterAmount'));
  const today = todayISO();
  let txn = null;

  if (SH.kind === 'loan') {
    const l = S.loans.find(x => x.id === SH.id);
    if (!l) return closeSheet();
    const principal = Math.max(0, amt - C.loanInterest(l));
    l.out = Math.max(0, (Number(l.out) || 0) - principal);
    txn = { id: uid(), date: today, ts: new Date().toISOString(), type: 'expense', amount: amt, cat: 'emi', note: l.lender, acct, planned: true };
  } else {
    const x = S.dps.find(y => y.id === SH.id);
    if (!x) return closeSheet();
    const due = C.dpsNextDue(x, today);
    if (!due) return closeSheet();
    x.paid = [...(x.paid || []), due];
    txn = { id: uid(), date: today, ts: new Date().toISOString(), type: 'expense', amount: amt, cat: 'dps', note: `${x.bank} ${due}`, acct, planned: true };
  }
  S.txns.push(txn);
  C.applyTxn(S, txn);
  closeSheet();
  toast(t('saved!'));
  change();
}

/* Records part of a debt coming back. Deliberately does NOT touch an account
   balance: lending is not spending, and putting it through applyTxn would show
   a loan to a friend as a month of overspending. */
function doRepay() {
  const l = S.lends.find(x => x.id === SH.id);
  if (!l) return closeSheet();
  const amt = numv('shAmt');
  if (!amt) return toast(t('enterAmount'));
  if (!Array.isArray(l.repays)) l.repays = [];
  /* Clamped, so a slip of the keyboard cannot make a row owe less than nothing
     and quietly pull the net-worth total off. */
  l.repays.push({ id: uid(), amount: Math.min(amt, C.lendLeft(l)), date: val('shDate') || todayISO() });
  if (C.lendLeft(l) <= 0) l.settled = true;
  closeSheet();
  toast(t('saved!'));
  change();
}

document.addEventListener('click', async e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;

  /* sheet */
  if (b.id === 'shClose') return closeSheet();
  if (b.id === 'fab') return openSheet('txn', { txn: { type: 'expense', date: todayISO() } });
  if (d.shtype) { SH.txn.type = d.shtype; SH.txn.cat = null; SH.txn.src = null; return reopenSheet(); }
  if (d.shcat) { SH.txn.cat = d.shcat; return reopenSheet(); }
  if (d.shsrc) { SH.txn.src = d.shsrc; return reopenSheet(); }
  if (d.shquick) { const i = $('#shAmt'); i.value = (Number(i.value) || 0) + Number(d.shquick); i.focus(); return; }
  if (b.id === 'shPlanned') { SH.txn.planned = !SH.planned; return reopenSheet(); }
  if (b.id === 'shSave') return saveSheetTxn();
  if (b.id === 'shPay') return doPay();
  if (b.id === 'shRepay') return doRepay();
  if (b.id === 'shEdit') return doEdit();
  if (d.edit) { const [kind, id] = d.edit.split(':'); openSheet('edit', { kind, id }); return; }

  if (d.tab) { TAB = d.tab; render(); window.scrollTo(0, 0); return; }
  if (d.day) { openDay = openDay === d.day ? null : d.day; return render(); }
  if (d.lang !== undefined) { LANG = Number(d.lang); S.settings.lang = LANG; return change(); }

  /* entries */
  if (d.edittxn) {
    const x = S.txns.find(y => y.id === d.edittxn);
    if (x) openSheet('txn', { txn: { ...x } });
    return;
  }
  if (d.deltxn) {
    if (!confirm(t('confirmDel'))) return;
    const x = S.txns.find(y => y.id === d.deltxn);
    if (!x) return;
    C.revertTxn(S, x);
    S.txns = S.txns.filter(y => y.id !== d.deltxn);
    return change();
  }

  /* dps */
  if (b.id === 'dAdd') {
    if (!val('dBank') || !numv('dInst')) return toast(t('enterAmount'));
    S.dps.push({
      id: uid(), bank: val('dBank'), inst: numv('dInst'), rate: numv('dRate'),
      tenure: numv('dTen') || 36, start: val('dStart') || C.periodOf(S, todayISO()),
      dueDay: numv('dDay') || 5, paid: [],
    });
    return change();
  }
  if (d.dpspay) {
    const x = S.dps.find(y => y.id === d.dpspay);
    if (x) openSheet('pay', { kind: 'dps', id: x.id, label: x.bank, amount: Number(x.inst) || 0 });
    return;
  }
  if (d.deldps) { if (!confirm(t('confirmDel'))) return; S.dps = S.dps.filter(x => x.id !== d.deldps); return change(); }

  /* loans */
  if (b.id === 'lAdd') {
    if (!val('lName') || !numv('lEmi')) return toast(t('enterAmount'));
    S.loans.push({ id: uid(), lender: val('lName'), out: numv('lOut'), emi: numv('lEmi'), rate: numv('lRate'), dueDay: numv('lDay') || 10 });
    return change();
  }
  if (d.loanpay) {
    const l = S.loans.find(x => x.id === d.loanpay);
    if (l) openSheet('pay', { kind: 'loan', id: l.id, label: l.lender, amount: Number(l.emi) || 0 });
    return;
  }
  if (d.delloan) { if (!confirm(t('confirmDel'))) return; S.loans = S.loans.filter(x => x.id !== d.delloan); return change(); }

  /* lending */
  if (b.id === 'ldGave' || b.id === 'ldTook') {
    $('#ldGave').classList.toggle('on', b.id === 'ldGave');
    $('#ldTook').classList.toggle('on', b.id === 'ldTook');
    return;
  }
  if (b.id === 'ldAdd') {
    if (!val('ldPerson') || !numv('ldAmt')) return toast(t('enterAmount'));
    S.lends.push({
      id: uid(), person: val('ldPerson'), amount: numv('ldAmt'),
      dir: $('#ldGave').classList.contains('on') ? 'gave' : 'took',
      date: val('ldDate') || todayISO(), note: val('ldNote'), repays: [], settled: false,
    });
    return change();
  }
  if (d.lendrepay) { openSheet('repay', { id: d.lendrepay }); return; }
  if (d.settle) { const l = S.lends.find(x => x.id === d.settle); if (l) l.settled = true; return change(); }
  if (d.dellend) { S.lends = S.lends.filter(x => x.id !== d.dellend); return change(); }

  /* assets, goals, recurring, reminders */
  if (b.id === 'asAdd') { if (!val('asName')) return; S.assets.push({ id: uid(), name: val('asName'), value: numv('asVal') }); return change(); }
  if (d.delasset) { S.assets = S.assets.filter(x => x.id !== d.delasset); return change(); }
  if (b.id === 'gAdd') {
    if (!val('gName') || !numv('gTarget')) return toast(t('enterAmount'));
    S.goals.push({ id: uid(), name: val('gName'), target: numv('gTarget'), saved: 0, deadline: val('gDate') });
    return change();
  }
  if (d.delgoal) { S.goals = S.goals.filter(x => x.id !== d.delgoal); return change(); }
  if (b.id === 'rAdd') {
    if (!val('rName') || !numv('rAmt')) return toast(t('enterAmount'));
    S.recur.push({ id: uid(), name: val('rName'), amount: numv('rAmt'), cat: val('rCat'), day: numv('rDay') || 1, acct: val('rAcct') });
    return change();
  }
  if (d.delrec) { S.recur = S.recur.filter(x => x.id !== d.delrec); return change(); }
  if (b.id === 'nAdd') {
    if (!val('nTitle') || !numv('nAmt')) return toast(t('enterAmount'));
    S.reminders.push({
      id: uid(), title: val('nTitle'), amount: numv('nAmt'),
      due: val('nDue') || todayISO(), repeat: val('nRep') || null, note: '', done: false,
    });
    return change();
  }
  if (d.remdone) {
    const r = S.reminders.find(x => x.id === d.remdone);
    if (!r) return;
    if (r.repeat === 'monthly') r.doneFor = C.nextDom(todayISO(), Number(r.due.split('-')[2])).slice(0, 7);
    else r.done = true;
    return change();
  }
  if (d.delrem) { S.reminders = S.reminders.filter(x => x.id !== d.delrem); return change(); }

  /* settings */
  if (b.id === 'sySave') {
    S.settings.sync = { owner: val('syOwner'), repo: val('syRepo'), path: 'khata.json' };
    const tok = val('syTok');
    if (tok) { await saveToken(KEY, tok); setMeta({ hasTok: true }); }
    await flushSave(); toast(t('saved!')); render(); return;
  }
  if (b.id === 'syNow') { await doSync(false); render(); return; }
  if (b.id === 'cfLocal') { await doSync(true); render(); return; }
  if (b.id === 'cfRemote') {
    if (window._remoteState) {
      S = migrate(window._remoteState); LANG = S.settings.lang || 0;
      await flushSave();
      setMeta({ dirty: false, sha: meta().remoteSha, syncedAt: new Date().toISOString(), syncState: 'ok' });
    }
    render(); return;
  }
  if (b.id === 'bkExport') {
    try {
      const blob = new Blob([await exportBlob(KEY, S)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `khata-${todayISO()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (err) { toast(String(err.message || err)); }
    return;
  }
  if (b.id === 'bkImport') { $('#bkFile').click(); return; }
  if (b.id === 'chPass') {
    const np = prompt(t('setPass'));
    if (!np) return;
    if (np.length < 6) return toast(LANG ? 'At least 6 characters.' : 'অন্তত ৬ অক্ষর দিন।');
    if (prompt(LANG ? 'Repeat' : 'আবার লিখুন') !== np) return toast(t('wrongPass'));
    KEY = await rekey(KEY, np, S);
    toast(t('saved!')); return;
  }
  if (b.id === 'wipeAll') {
    if (!confirm(LANG
      ? 'Erase all data from this device? Backups and the synced copy stay.'
      : 'এই ডিভাইসের সব তথ্য মুছে যাবে। ব্যাকআপ আর সিঙ্ক করা কপি থাকবে।')) return;
    wipeLocal(); location.reload(); return;
  }
});

document.addEventListener('change', async e => {
  const d = e.target.dataset || {};
  if (d.bal) { const a = C.acctOf(S, d.bal); if (a) a.bal = Number(e.target.value) || 0; return queueSave(); }
  if (d.budget) { const c = C.catOf(S, d.budget); if (c) c.budget = e.target.value === '' ? null : Number(e.target.value); return queueSave(); }
  if (d.goalsaved) { const g = S.goals.find(x => x.id === d.goalsaved); if (g) g.saved = Number(e.target.value) || 0; return queueSave(); }
  if (e.target.id === 'stStart') { S.settings.monthStartDay = Math.min(28, Math.max(1, Number(e.target.value) || 1)); return change(); }
  if (e.target.id === 'stDaily') { S.settings.dailyBudget = Number(e.target.value) || 0; return change(); }
  if (e.target.id === 'bkFile') {
    const f = e.target.files[0];
    if (!f) return;
    const pass = prompt(LANG ? 'Passphrase for this file' : 'এই ফাইলের পাসফ্রেজ');
    if (!pass) return;
    try {
      S = migrate(await importBlob(await f.text(), pass));
      LANG = S.settings.lang || 0;
      KEY = await createVault(pass);
      await flushSave();
      toast(t('saved!')); render();
    } catch { toast(t('wrongPass')); }
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && SH) return closeSheet();
  if (e.key === 'Enter' && e.target.id === 'shAmt') {
    e.preventDefault();
    const s = $('#shSave') || $('#shPay') || $('#shRepay') || $('#shEdit'); if (s) s.click();
  }
  if (e.key === 'Enter' && (e.target.id === 'gPass' || e.target.id === 'gPass2')) $('#gGo').click();
});
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });

/* ---------------- gate and boot ---------------- */
function paintGate() {
  const first = !hasVault();
  $('#gSub').textContent = first ? t('setPass') : (LANG ? 'Enter passphrase' : 'পাসফ্রেজ দিন');
  $('#gGo').textContent = first ? t('create') : t('open');
  $('#gConfirmWrap').classList.toggle('hide', !first);
  $('#gIntro').classList.toggle('hide', !first);
}

$('#gGo').addEventListener('click', async () => {
  const pass = $('#gPass').value;
  const err = $('#gErr');
  if (!pass || pass.length < 6) { err.textContent = LANG ? 'At least 6 characters.' : 'অন্তত ৬ অক্ষর দিন।'; return; }
  err.textContent = LANG ? 'Opening…' : 'খোলা হচ্ছে…';
  try {
    if (!hasVault()) {
      if (pass !== $('#gPass2').value) { err.textContent = t('wrongPass'); return; }
      KEY = await createVault(pass);
      S = freshState();
      await saveState(KEY, S);
    } else {
      const r = await unlockVault(pass);
      KEY = r.key;
      S = migrate(r.state);
      LANG = S.settings.lang || 0;
    }
  } catch { err.textContent = t('wrongPass'); return; }
  err.textContent = '';
  $('#gate').classList.add('hide');
  $('#shell').classList.remove('hide');
  runRecurring();
  render();
  doSync(false);
});

/* One interval drives the clock. It never re-renders the view, so an amount
   you are halfway through typing is never lost. */
let CURDAY = todayISO();
function tick() {
  const c = clockNow();
  const el = $('#clock');
  if (el) el.innerHTML = `${c.hms} <i>${c.ap}</i>`;
  if (todayISO() !== CURDAY) {          // midnight in Dhaka: new day, new page
    CURDAY = todayISO();
    if (KEY) { runRecurring(); render(); }
  }
}
setInterval(tick, 1000);
tick();
paintGate();

window.addEventListener('online', () => { if (KEY) doSync(false); });

/* Closing the laptop lid, switching apps on the phone, locking the screen —
   all of these fire this, and all of them are moments where unsent work would
   otherwise be stranded. Coming back the other way is when the other device's
   changes are worth fetching. */
document.addEventListener('visibilitychange', () => {
  if (!KEY) return;
  if (document.hidden) { clearTimeout(syncTimer); autoSync(); }
  else autoSync(true);
});

/* A device left open all evening would never hear about the other one. */
setInterval(() => { if (KEY && !document.hidden) autoSync(true); }, 180000);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

/* Exposed for the verification harness only — no app code reads this. */
window._khata = {
  get S() { return S; }, set S(v) { S = v; },
  get KEY() { return KEY; },
  C, render, flushSave, runRecurring, todayISO, clockNow, migrate, freshState, openSheet, ITER,
};
