# Mage Spell Battle 🧙‍♂️🔥🐉

A vertical **pixel-art RPG** where a Mage battles a Dragon by answering
vocabulary multiple-choice questions from swappable question sets (English →
Thai, and more). Built with **React + Vite**, playable on mobile and desktop.

## How to play

- Pick a difficulty on the start menu:
  | Difficulty | Time / question | Wizard HP | Dragon HP |
  |-----------|-----------------|-----------|-----------|
  | **Easy**   | 15s | 5 | 10 |
  | **Medium** | 8s  | 4 | 20 |
  | **Hard**   | 4s  | 3 | 30 |
- Read the English word and tap the correct Thai meaning (A–D).
  - 🔊 Tap the speaker beside the word to **hear it pronounced** (see
    [Pronunciation](#pronunciation-text-to-speech)).
  - ✅ Any correct answer in time → Dragon **−1 HP**.
  - ⚡ Answer within the **first half** of the timer → flashier **Critical** blue
    beam + **double** the base points (still 1 damage).
  - ➕ Every correct answer adds a speed bonus of **10 × seconds left**.
  - ❌ Wrong or timeout → Wizard **−1 HP**.
  - ⏳ In the closing seconds the **battle scene pulses coral** as a time-is-up
    warning (see [Time warning](#time-warning)).
- Reduce the Dragon's HP to 0 to **win**; if your HP hits 0 you **lose**.
- Winning grants an end bonus of **500 × surviving Wizard HP**.
- Toggle 🎵 music and 🔊 sound effects any time (audio is fully synthesized via
  the Web Audio API — no audio files needed). **Music and sound effects are both
  on by default.** The default background theme is a calm, easy-listening
  lo-fi-style melody that loops gently without distracting from study.

### Time warning

Players kept getting caught out by the question changing: their eyes are on the
answer options at the bottom, so the red timer bar at the top goes unnoticed. In
the closing seconds the **battle scene** pulses coral once per second (a coral
border, an outer halo, and an in-scene vignette), which reads as in-game danger
and stays clear of the text being read. It only animates the border colour and
glow — **never the size or padding** — so nothing in the layout can shift under a
finger mid-tap.

> Glowing the quiz box itself was tried first: it is closer to where the eyes
> rest, but pulsing right behind the options made them harder to read. The scene
> is the calmer place for it.

The window is `min(DANGER_SECONDS, timeLimit × DANGER_MAX_FRACTION)`
(`src/game/constants.js`) — 3 s normally, but capped to a fraction of the timer
so **Hard mode (4 s) pulses for 1.6 s instead of 75% of the turn**, which would
just be noise:

| Difficulty | Timer | Pulses for |
| :-- | :-- | :-- |
| Easy | 15 s | 3.0 s |
| Medium | 8 s | 3.0 s |
| Hard | 4 s | 1.6 s |

A **soft clock tick** also plays on each remaining second of that same window,
for players who look away from the screen while thinking. It obeys the 🔊 SFX
toggle like every other sound, and can be switched off on its own with
**`TICK_ENABLED`** in `src/game/constants.js` (the pulse stays).

The pulse stops the instant the turn resolves (answered *or* timed out), and
`prefers-reduced-motion` gets a steady tint instead of a pulse.

### Pronunciation (text-to-speech)

A 🔊 button next to each vocab word speaks it aloud using the browser's built-in
**Web Speech API** (`src/audio/speech.js`) — entirely client-side, so there's no
server, no API cost, and no audio files. It's fire-and-forget, so the timer keeps
running and tapping it never counts as an answer.

The language is auto-detected from the word's script (CJK → Chinese, Thai block →
Thai, otherwise English), and any romanization in parentheses is stripped before
speaking (e.g. `打电话 (dǎ diànhuà)` is read as just `打电话`). Because installed
voices vary by device, the button **only appears when the device actually has a
voice for that word's language** — devices (or in-app webviews) without speech
support, or without the needed language, simply don't show it, so nothing errors
and no word is ever mispronounced by a wrong-language voice.

### Scoreboard

- Each set + mode keeps its own **top-20** high-score board (name, score, when
  played, and surviving HP).
- Finish a run with a qualifying total and you're prompted to **enter your name**.
- View boards any time from the **🏆 SCOREBOARD** button on the title screen.
- Boards are **persisted in the browser** (`localStorage`, with a cookie
  fallback for in-app browsers that wipe `localStorage`), so scores survive
  closing the tab/browser. They are **per device** — there is no server/database,
  scores aren't shared between players, and they are not auto-cleared.

## Run it

```bash
cd game
npm install
npm run dev        # open the printed http://localhost:5173 URL
```

Build for production:

```bash
npm run build      # outputs to game/dist
npm run preview
```

### Analytics

Visitor traffic is tracked with **Vercel Web Analytics** (`<Analytics />` from
`@vercel/analytics/react`, mounted in `App.jsx`). It is a no-op off Vercel — the
`/_vercel/insights/script.js` request 404s locally, which is expected and
harmless; it resolves once deployed. Enable *Analytics* for the project in the
Vercel dashboard for data to show up.

## Project layout

```
game/
├─ public/
│  ├─ default.txt         # default question set (+ any other *.txt sets)
│  ├─ background.png      # sky / castle battle backdrop
│  └─ sprites/            # extracted per-state character sprites (PNG)
└─ src/
   ├─ App.jsx             # routing + BGM + global state
   ├─ audio/audioEngine.js# Web Audio synth (BGM + SFX)
   ├─ game/
   │  ├─ constants.js     # difficulty + damage/timing rules
   │  └─ questions.js     # fetch, parse (CSV), Fisher–Yates shuffle
   └─ components/
      ├─ StartMenu.jsx  GameContainer.jsx  ResultScreen.jsx
      ├─ StatusBar.jsx  TimerBar.jsx  BattleArena.jsx
      └─ QuestionBoard.jsx  SoundControls.jsx
```

### Sprites

Individual character sprites are extracted from the reference
`design/assets/sprite_sheet2.png` by `tools/extract_sprites2.py` (flood-fills
the gray tile background to transparency, drops stray fragments, and auto-crops
each frame). The battle backdrop comes from `design/assets/background2.png`.
Re-run with `python tools/extract_sprites2.py` if the sheet changes.

## Database format

`exam.txt`, one question per line:

```
vocab, choice1, choice2, choice3, choice4, correct_answer_number(1-4)
abandon, ละทิ้ง, รุนแรง, รูปแบบ, รัฐบาล, 1
```

Choices may not contain commas (the parser splits on `,`). Malformed lines are
skipped. The loaded-word count on the title screen is derived from the file, so
dropping in a new file needs no code change (rebuild before deploying).

## Question sets

The game can hold **multiple question sets**. Any `*.txt` file in `public/`
(e.g. `default.txt`, `toefl_en_5k_words.txt`, `chinese.txt`) is offered in the
**📚 ชุดข้อสอบ** picker on the title screen; **`default.txt` is the default set**
(and is listed first). The picker label is derived from the file name
(`toefl_en_5k_words.txt` → "Toefl En 5k Words").

- A Vite plugin (`examManifest` in `vite.config.js`) scans `public/` and serves
  `/exam-sets.json` (file name + word count) in dev, and emits it into the
  build. Just drop a new `*.txt` set in `public/` and rebuild — no code change.
- Switching sets reloads the questions and updates the word count everywhere.
- **Scoreboards are per set** (and per difficulty): scores are saved and shown
  for whichever set is active.

### Themes (scene, characters, music, effects)

A question set can bring its own **scene, characters, music and attack effects**.
`src/game/themes.js` holds a theme registry matched against the set's file name:

| Set name starts with | Theme | Hero → Enemy | Critical | Normal | Enemy attack | Music |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| `chinese…` | Wuxia | Warrior → Panda | ink slash | thrown book | punch flurry (wrong) · fart (timeout) | pentatonic, "Mo Li Hua"-style |
| `english_for_kid…` | Kid | Knight → Dino | sword slash | thrown lollipop | fart (wrong) · roar (timeout) | bouncy C-major cartoon tune |
| `english_highschool…` | High school | Archer → Pig | triple light arrow | fire arrow | body-slam (wrong) · electric zap (timeout) | fast, exciting adventure riff |
| *(anything else)* | Default | Wizard → Dragon | blue beam | fireball | fire breath (wrong) · muscle flex (timeout) | calm, easy-listening lo-fi loop |

A theme swaps the backdrop, both fighters' sprites (idle / attack / hurt / die),
the effect visuals, the sound effects, the BGM, and the on-screen character names
(HUD and menu copy). **Game rules are identical across themes.**

Some themes use one enemy attack for any miss. A theme can also react
differently to a **wrong answer** vs a **timeout** by adding an `attack_timeout`
enemy sprite plus `enemy_timeout` entries to its `fx`/`sfx` maps — the
high-school pig body-slams a wrong answer but zaps you when the timer runs out,
the kid dino farts a wrong answer but roars on a timeout, the wuxia panda throws
a punch flurry on a wrong answer but farts on a timeout, and the default dragon
breathes fire on a wrong answer but flexes to show off on a timeout. Themes
without those entries fall back to their single enemy attack (see
`enemySpriteName` / `fxName` / `sfxName` in `themes.js`).

To add a theme for a future set: drop the art in `public/`, add a theme object in
`themes.js`, and append a prefix rule to `THEME_RULES`.

Themed art lives in `design/assets/` and is extracted into `public/sprites/<theme>/`
(the default theme extracts into the `public/sprites/` root):

| Theme | Asset | Source | Tool |
| :-- | :-- | :-- | :-- |
| Default | hero (witch) | `sprite_sheet1_hero.png` | `tools/extract_sprites_default.py` |
| Default | enemy (dragon) | `sprite_sheet1_monster.png` | `tools/extract_sprites_default.py` |
| Default | backdrop | `background.png` | sky / castle field |
| Wuxia | hero (sword girl) | `sprite_sheet2_swordgirl.png` | `tools/extract_swordgirl.py` |
| Wuxia | enemy (panda) | `sprite_sheet2_monster.png` | `tools/extract_sprites_cn.py` |
| Wuxia | backdrop | `background2.png` | landscape crop (y 100–1029) |
| Kid | hero (knight) | `sprite_sheet3_hero.png` | `tools/extract_sprites_kid.py` |
| Kid | enemy (dino) | `sprite_sheet3_monster.png` | `tools/extract_sprites_kid.py` |
| Kid | backdrop | `background3.png` | landscape crop (y 150–1079) |
| High school | hero (archer) | `sprite_sheet4_hero.png` | `tools/extract_sprites_hs.py` |
| High school | enemy (pig) | `sprite_sheet4_monster.png` | `tools/extract_sprites_hs.py` |
| High school | backdrop | `background4.png` | landscape crop (y 150–1079) |

The sword-girl and knight sheets have no hurt/defeated frame, so those themes map
`hurt` and `die` to the idle frame; the CSS hurt-flash and lose-screen
treatment carry those states. The archer and witch sheets have a fallen (die)
frame but no hurt frame, so only `hurt` reuses idle. The sword girl is smooth
illustration
(not blocky pixel art), so she renders with `image-rendering: auto`; everything
else stays
crisp.

### Languages / fonts

Fonts fall through per glyph: **Fredoka** (Latin) → **Mali** (Thai) → **ZCOOL
KuaiLe** (Simplified Chinese, a cute rounded CJK face). So English, Thai, and
Simplified-Chinese question sets all render in-theme. The Chinese font is served
by Google Fonts in small unicode-range subsets, so its glyphs download only when
a Chinese set is actually shown.
