# Monthly budget envelopes

**Date:** 2026-08-02

## Problem

The Plan tab lets you put a number beside each of sixteen fixed categories. That is
not how the household actually writes a budget. The budget on paper is a short list
of *named lines*, gathered into *groups*, with a subtotal per group:

```
His expenses     Bike spends 2000 · Lunch 2500 · Regular snacking 3000 · Pocket money 2000
Her expenses     Skincare 3000 · Shopping 3000 · Meds 1000 · Pocket money 2000
Travel and tour  6000/month, for a tour every 3 months
Extra expenses   5000
```

Two things are missing. You cannot name your own lines, and when you spend ৳100 on a
snack there is nothing that tells you how much of the snack budget is left.

## Decisions taken

| Question | Answer |
|---|---|
| Replace the sixteen categories, or add to them? | **Replace.** Seed the note's lines; hide the stock categories that were never used. |
| The travel fund | **Accrues.** Never resets, and stays out of the daily budget. |
| Ordinary lines | **Reset every month.** Unspent money does not roll over. |
| Picking a line while spending | Chips grouped under headings; the chosen line shows what is left and what will be left after this entry. |

## Data model

A new array, `S.groups`:

```js
{ id, bn, en, kind }        // kind: 'var' | 'fixed' | 'save'
```

`kind` is the only switch, and it drives three separate behaviours from one place:

| kind | month end | daily budget | fixed/variable split |
|---|---|---|---|
| `var` | resets | counted | variable |
| `fixed` | resets | counted | fixed |
| `save` | **accrues** | **excluded** | fixed |

`S.cats` entries gain `group` (now a group id, not a hardcoded string), `archived`,
and `since` (`YYYY-MM`, the period a saving envelope started accruing from).

Eight groups are seeded: the note's four (`his`, `her`, `travel`, `extra`) plus four
that receive the existing categories unchanged (`fixed`, `var`, `debt`, `save`). The
legacy four all keep the behaviour they had, so migrating an existing book changes no
number: only `travel` is `kind:'save'`.

## calc.js

`group` was load-bearing — `fixedVar` read the raw string. Every reader now goes
through `kindOf(S, cat)`, which resolves the group and falls back to `'var'`.

New pure functions:

- `groupOf`, `kindOf`, `activeCats`
- `spentInCat(S, catId, p)`, `spentSince(S, catId, fromP)`
- `envelope(S, cat, p)` → `{ kind, budget, allocated, spent, left, months }`.
  Ordinary lines: allocated is this month's budget. Saving lines: allocated is the
  budget times the number of months since `since`, and spend is counted over the same
  span. Same shape either way, so no view has to branch.
- `byGroup(S, p)` — the Overview breakdown, grouped, with orphans collected.
- `monthBudget` now excludes `save` groups and archived lines; `saveBudget` is the
  counterpart. `dailyBudget` therefore no longer counts the tour fund.

## Views

**Plan** — one block per group: heading, subtotal, edit and delete; the lines beneath
with an inline amount box and per-line spent/left; `+ লাইন` per group; `+ নতুন গ্রুপ`
at the bottom. Totals split three ways — spending budget, savings, total — then the
daily budget. Hidden lines sit at the end as chips; one tap restores.

**Add expense** — chips under group headings. Choosing one opens a panel with the
line's name, what is left, a bar, and a live line that recomputes as the amount is
typed: `এই ১০০ দিলে বাকি রবে ৳২,৩০০`. The panel updates by writing one text node, never
by re-rendering, so a half-typed amount is never lost.

**Overview** — `খাত অনুযায়ী` grouped, with a subtotal per group. A saving group reports
`জমেছে ৳X` instead of a monthly figure.

## Safety

- Hiding is not deleting. An archived category still resolves through `catOf`, so
  history, `byGroup` and the day view are unaffected, and `S.recur` rows pointing at
  one keep working.
- `emi` and `dps` are never auto-hidden: `doPay` writes those two ids directly.
- Migration is idempotent behind a `budgetSeeded` flag and re-runs safely on every
  load and on every remote adopt.
- `groups` joins the array-forcing list in `migrate`.
- `sw.js` `BUILD` is bumped, or installed devices keep the old code.

## Not doing

- No transfer of money into an account for a saving envelope. It is a budget line;
  no balance moves.
- No separate per-person view. The groups are the answer.

## Known discrepancy

The note's stated subtotal is 30,000; its lines add to 29,500. The lines are seeded
exactly as written and the totals are shown live, so the gap is visible and editable.
