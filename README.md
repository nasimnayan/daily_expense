# খাতা — personal money ledger

Ekta single-page app. Kono backend nai, kono database nai, kono build step nai, kono
dependency nai. Shob data tomar browser-e AES-256-GCM diye encrypted hoye thake. Sync
korle sheta tomar **private** GitHub repo-te encrypted file hishebe jai — GitHub-o porte
parbe na, karon passphrase kokhono device chere jai na.

Ei repo-te shudhu **code** ache. Kono taka-poishar tottho ekhane nai.

---

## Ki ki ache

**এক নজরে / Overview** — khulei ekhane asho. Aajker khoroch, budget bar, shesh 7 din-er
sparkline, **সামনে যা আছে** (credit card bill, EMI, DPS kisti, bhara — shob ek jaigai,
kotodin baki shathe), mash-er khoroch vs budget, savings rate, net worth, runway, DTI, ar
khat onujayi bhag.

**দিনলিপি / Days** — proti din-er hishab, notun theke purono. `মঙ্গলবার · ২৮ জুলাই · ৩ এন্ট্রি
· ৳1,140`. Tap korle oi din-er shob entry khule jai, shomoy shathe. **Je kono purono entry
bodlano ba mucha jai** — bhul amount likhle porer din thik kore newa jai.

**হিসাব / Accounts** — balances, DPS (maturity projection + kisti tracking), loan
(amortisation + payoff date), dhar dewa-newa, FDR/সঞ্চয়পত্র. Kisti dile **kon account
theke jacche sheta tumi becho** — jhorlei prothom account theke katbe na.

**পরিকল্পনা / Plan** — **মনে রাখার বিল** (ek baar ba proti mash), per-category budget,
goals, ar proti mash-er fixed khoroch (nijei boshe jai, ar account-o thik kore).

**সেটিংস / Settings** — bhasha, sync, backup, month start day, passphrase, data size.

Bangla default, ek tap-e English.

---

## Tarikh ar shomoy

Header-e **12-ghontar ghori** chole (`4:20:02 PM`), proti second-e nijei update hoi.
Shathe puro tarikh: `মঙ্গলবার, ২৮ জুলাই ২০২৬`.

- Shob tarikh **Asia/Dhaka** dhore hishab hoi — device-er timezone jai hok. Tai phone ar
  laptop kokhono alada din-e entry felbe na.
- Proti entry-te tarikh-shomoy nijei boshe jai. Purono entry edit korle tarikh bodlano jai.
- **Raat 12:00 baje** din nijei ghure jai — reload lage na.
- Ghori-r ontor puro screen redraw kore na, tai amount type korle harabe na.
- Tarikh ar din-er gonona Bangla onko-te (`১৪ দিন পর`), kintu **taka ar ghori Western**
  onko-te — tai column gulo mile jai.

---

## Setup — ekbar-i, 10 minute

### 1. App ta live koro (ei public repo)

Repo → **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save**.

2-3 minute por site live:

```
https://nasimnayan.github.io/daily_expense/
```

> Repo public, kintu **kono data nai** — shudhu code. Onno keu link khullei ekta
> passphrase screen dekhbe, ar tar nijer khali khata. Tomar kichu dekhte parbe na.

### 2. Data-r jonno alada **private** repo

Notun repo banao, nam `khata-data`, **Private** select koro, ar "Add a README file" tick
koro (repo ta initialise hote hobe). Ei repo-te `khata.json` boshbe — puro file encrypted.
GitHub commit history rakhe, tai proti sync-i ekta version — automatic versioned backup.

### 3. Ekta fine-grained token banao

`github.com/settings/personal-access-tokens/new`

| Field | Value |
|---|---|
| Token name | `khata sync` |
| Resource owner | tomar account |
| Repository access | **Only select repositories** → `khata-data` |
| Permissions → Repository permissions → **Contents** | **Read and write** |

Baki shob permission `No access` rakho.

> Ei token diye shudhu oi ekta private repo-r file lekha jai — ar kichu na. Token tomar
> device-e **passphrase diye encrypted** hoye thake, kokhono sync hoi na, public repo-te
> jai na.

### 4. Phone / laptop e chalu koro

1. Site khulo → ekta **passphrase** dao (6+ character). Eta-i tomar encryption key.
2. **সেটিংস** tab → username, `khata-data`, token dao → **সেভ** → **এখন সিঙ্ক করুন**.
3. Browser menu → "Add to Home screen" / "Install app". Ekhon offline-eo chole.

### 5. Ditiyo device

Same URL khulo → **hubohu ekoi passphrase** dao → Settings-e same username, repo, token
dao → **এখন সিঙ্ক করুন**. Khata khali thakle sheta nijei server theke data neme ashbe.

> Prothom device ta ekbar sync korie nio, tarpor ditiyo device-e jao. Purono version-e
> lekha `khata.json`-e salt thakto na, ar oi file ditiyo device kokhono khulte parto na.
> Purono file hole prothom device-er porer sync-e sheta nijei thik hoye jai.

---

## Sync kivabe kaj kore

- Proti change local-e encrypted save hoi, ar `dirty` flag boshe.
- Sync-e app ta remote file-er `sha` compare kore. Local-e kichu notun na thakle app
  **kokhono upload kore na** — remote notun hole sheta neme ashe.
- **Dutai jaigai alada change** thakle app kono kichu overwrite kore na — ekta
  "দুই রকম তথ্য" banner dekhai, tumi bechhe nao kon ta rakhbe.
- Offline thakle sync skip hoi, net asha matro nijei try kore.
- `khata.json`-er bhitore ciphertext-er pashe **salt ar PBKDF2 count-o** thake. Chabi ta
  passphrase **ar** salt — duita mile hoi, ar protita device prothom bar nijer salt random
  banai. Salt ta file-e na thakle notun device ekoi passphrase diye-o **alada chabi**
  banato ar file ta khulte parto na — sheta bhul kore "পাসফ্রেজ মেলেনি" hishebe dekhato.
  Ekhon notun device file-er salt ta niye nei, tai duita device ekta-i chabi pai.

Practical niyom: ek device-e kaj shesh kore sync koro, tarpor onno device-e sync koro.

---

## Backup — eta obosshoi koro

Settings → **ফাইল নামান**. Encrypted `.json` file namebe. Mashe ekbar niye
Drive/pendrive-e rakho. Backup file-er bhitore salt ar PBKDF2 count-o thake, tai purono
backup-o bhobishyote khulbe.

**Passphrase bhule gele kono way nai** — data ar khola jabe na. Amrao parbo na, GitHub-o
parbe na. Eta encryption-er point, bug na. Passphrase ta password manager-e rakho.

### Kotodur cholbe

Din-e ~8 entry dhorle (mapa hoyeche, andaj na):

| Entry | Sync file | Obostha |
|---|---|---|
| ~1,500 (6 mash) | ~409 KB | thik ache |
| ~3,000 (1 bochor) | ~814 KB | thik ache |
| ~6,000 (2 bochor) | ~1.6 MB | **GitHub Contents API-r 1 MB limit chariye jai** |

Settings-e data size dekha jai, ar 700 KB par hole app nijei warn kore. Oi shomoy purono
bochor-er entry alada file-e sorate hobe. **Ek bochor-er jonno ekhon kichu korte hobe na.**

---

## Number niye ekta kotha

DPS maturity ar loan payoff **projection** — actual bank calculation-er shathe choto
ফারাক hote pare (bank-er compounding niyom, excise duty, source tax alada). Planning-er
jonno kaje dibe, kintu bank statement-i final.

---

## File gulo

| File | Kaj |
|---|---|
| `index.html` | shell |
| `app.css` | shob style. Kono webfont download hoi na — device-er font use hoi. |
| `js/vault.js` | passphrase, encryption, localStorage |
| `js/calc.js` | shob hishab. Account balance shudhu ekhane bodlai. |
| `js/app.js` | state, Dhaka ghori, sync, view, event |
| `sw.js` | offline cache (api.github.com kokhono cache hoi na) |
| `manifest.webmanifest`, `icon.svg` | home screen install |

Native ES module, tai kono build step nai. `BUILD` string `sw.js`-e — proti release-e
bump koro, tanahole install kora device purono version-ei atke thakbe.

---

## Notun kore ki thik hoyeche

- **Save/sync/backup ~717 entry-r por chup kore bhenge jacchilo.** `String.fromCharCode(...)`
  puro array spread kore call stack uchhe felto. Ekhon chunk kore hoi — 10,000 entry-teo
  chole. Ar save byartho hole ekhon ekta **lal banner** thake, chup kore jai na.
- **Fixed monthly khoroch account theke taka katto na**, ar oita delete korle uposhthito
  na-thaka taka *ferot* diye ditto. Ekhon shob balance ekta jaigai diye jai.
- **Loan/DPS kisti shobshomoy prothom account theke katto.** Ekhon tumi bechho.
- Purono din-er entry dekha ba thik korar kono upai chilo na — ekhon **দিনলিপি** ache.
- Google Fonts hotano hoyeche: proti launch-e tomar IP Google-e jacchilo, ar offline-e
  font ashto-o na.
- PBKDF2 250k → 310k, ar count-ta blob-er shathe rakha hoi.
- Shob form field-e ekhon label lagano (age 30-ta field-e label chilo na).
