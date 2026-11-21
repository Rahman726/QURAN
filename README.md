# Quran Pak — The Noble Quran Reader

A fast, offline-first Quran reader built with plain HTML, CSS and JavaScript.
No frameworks, no build step, no package install.

## Features

- All **114 surahs / 6,236 ayahs** in Uthmani Arabic script, stored locally
- **English** (Sahih International) and **Urdu** (Jalandhry) translations, or Arabic only
- **Five reciters** to choose from (Alafasy, Abdul Basit, Al-Husary, El-Minshawi, As-Sudais)
  with their names and photos in the top-bar reciter menu; the choice is remembered
- **Verse-by-verse recitation** by the selected reciter — tap **Continue listen** in the
  top bar and pick *without translation* (whole surah in Arabic) or *with translation*
  (each ayah followed by its English or Urdu translation audio); otherwise only the
  chosen ayah plays — playback speed (0.5×–2×) can be changed from the player bar
- **Recite & check** — tap the green **Recite & check** button at the top of the surah (it
  opens the ayah you are reading, and the modal can step through the surah), or **Recite**
  under any single ayah. Allow the microphone and recite out loud: the browser transcribes
  your voice and highlights missed or mispronounced words, with a match score, the words to
  review, and a *Listen to this ayah* button to hear the correct recitation. Chrome/Edge
  recommended; needs a microphone and internet for the speech service.
- **Recite full surah** — the header also has a mic button that opens the whole surah.
  Recite it in order; the browser keeps listening through pauses, then rates the recitation
  **out of 100** with every missed word highlighted and a per-ayah list of the ayahs to review.
- **Accounts** — **Sign in / Create account** in the top bar (email + password, or Google)
  using Firebase Authentication, with an account menu and sign out
- **Download / install as an app** — **Download app** in the sidebar (and in the account
  menu) installs the reader on Windows, Mac, Linux, Android or iOS. Once installed it opens
  from its own icon and works offline; step-by-step instructions are shown when the browser
  does not offer a native install prompt
- **Bookmarks** saved in `localStorage`
- **Resume reading** from the last opened surah and ayah
- **Three themes** — light, sepia, dark (follows your OS on first visit)
- Adjustable Arabic font size, searchable surah list, deep links (`#/surah/2/255`)
- Responsive layout with an off-canvas sidebar on mobile

## Run it

Browsers block `fetch()` on `file://` pages, so serve the folder over HTTP:

```bash
# Option 1 — Python
python -m http.server 8000

# Option 2 — Node
npx serve .
```

Then open <http://localhost:8000>.

## Install it as an app (PWA)

The reader is a Progressive Web App: `manifest.webmanifest` supplies the name and icons and
`sw.js` caches the app shell plus Quran data, so installed copies keep working without a
connection (audio still needs internet).

- **Chrome / Edge (Windows, Mac, Linux)** — click the install icon in the address bar, or
  **Download app** in the sidebar
- **Android (Chrome)** — menu ⋮ → Add to Home screen
- **iPhone / iPad (Safari)** — Share → Add to Home Screen
- **Mac (Safari)** — File → Add to Dock

Installing requires HTTPS (Vercel provides it) or `localhost`. To publish an update, bump
`CACHE` in `sw.js` so installed copies pick up the new files.

## Deploy on Vercel

The app is fully static — there is no build command and no output step.

1. Push this repository to GitHub.
2. In Vercel choose **Add New → Project** and import the repo.
3. Framework preset **Other**, build command left empty, output directory set to `.`
   (the repository root).
4. Deploy. `vercel.json` already adds long-lived cache headers for `assets/`, `data/`,
   `css/` and `js/`, and enables clean URLs.

From the CLI instead:

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

Vercel serves the site over HTTPS, which the **Recite & check** microphone feature requires.

## Enable accounts (Firebase)

The sign-in button works as soon as a Firebase web config is filled in. The repo ships
with `js/firebase-config.js` empty, so the dialog shows a setup note instead.

1. Create a project at <https://console.firebase.google.com>.
2. **Project settings → Your apps → Web app**, register the app and copy the
   `firebaseConfig` values into `js/firebase-config.js`.
3. **Authentication → Sign-in method**: enable **Email/Password** and, for the Google
   button, **Google** (set a support email).
4. **Authentication → Settings → Authorized domains**: add your Vercel domain
   (`your-project.vercel.app`) and keep `localhost` for local testing.
5. Commit and redeploy. Sign in, create an account, then use the avatar menu to sign out.

These config values are public client identifiers, not secrets — Firebase secures the
project through its own rules. Accounts are only used for sign-in; reading data,
bookmarks and settings continue to live on the device.

## Project structure

```
Quran/
├── index.html              # App shell: sidebar, top bar, content, audio player
├── assets/
│   └── favicon.svg
├── css/
│   └── style.css           # Themes, layout, ayah typography, responsive rules
├── js/
│   ├── app.js              # Routing, search, rendering, bookmarks, audio, settings, accounts
│   └── firebase-config.js  # Firebase web config for sign-in (empty by default)
├── data/
│   ├── surahs.json         # Index of all 114 surahs (names, counts, revelation type)
│   └── surahs/
│       ├── 001.json        # Full surah: Arabic + English + Urdu per ayah
│       ├── 002.json
│       └── ...             # through 114.json
└── README.md
```

Surah files are loaded lazily, so opening the app only downloads the index plus
one surah (a few KB to ~100 KB) instead of the whole 4 MB corpus.

## Data format

`data/surahs.json`

```json
{
  "number": 2,
  "name": "البقرة",
  "englishName": "Al-Baqara",
  "englishNameTranslation": "The Cow",
  "revelationType": "Medinan",
  "ayahCount": 286
}
```

`data/surahs/002.json`

```json
{
  "number": 2,
  "name": "البقرة",
  "englishName": "Al-Baqara",
  "englishNameTranslation": "The Cow",
  "revelationType": "Medinan",
  "ayahCount": 286,
  "bismillah": true,
  "ayahs": [
    { "n": 1, "g": 8, "text": "الٓمٓ", "en": "Alif, Lam, Meem.", "ur": "الم", "juz": 1 }
  ]
}
```

- `n` — ayah number within the surah
- `g` — ayah number across the whole Quran (used for audio URLs)
- `bismillah` — render Bismillah as a surah header (false for Al-Faatiha and At-Tawbah,
  where it is not a separate verse)

## Credits

- Arabic text: [Al Quran Cloud](https://alquran.cloud) (`quran-uthmani`)
- English translation: Sahih International (`en.sahih`)
- Urdu translation: Fateh Muhammad Jalandhry (`ur.jalandhry`)
- Recitation audio: [EveryAyah / Islamic Network CDN](https://islamic.network/quran/)
- Translation audio: Ibrahim Walk (English, `en.walk`) and Shamshad Ali Khan (Urdu, `ur.khan`)
  from the same CDN
- Reciter photos: Quran.com's public static CDN, stored locally in `assets/reciters/`
- Recitation checking: the browser's own speech recognition (Web Speech API) plus local
  word-by-word alignment. It is a practice aid, not a certified tajweed analysis — the exact
  words are compared, while makharij and madd rules are only caught indirectly.
- Fonts: Amiri Quran, Noto Nastaliq Urdu, Inter (Google Fonts)

Recitation and web fonts need an internet connection; the text itself is fully local.
