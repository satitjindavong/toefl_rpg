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
  - ✅ Any correct answer in time → Dragon **−1 HP**.
  - ⚡ Answer within the **first half** of the timer → flashier **Critical** blue
    beam + **double** the base points (still 1 damage).
  - ➕ Every correct answer adds a speed bonus of **10 × seconds left**.
  - ❌ Wrong or timeout → Wizard **−1 HP**.
- Reduce the Dragon's HP to 0 to **win**; if your HP hits 0 you **lose**.
- Winning grants an end bonus of **500 × surviving Wizard HP**.
- Toggle 🎵 music and 🔊 sound effects any time (audio is fully synthesized via
  the Web Audio API — no audio files needed). **Music is off by default; sound
  effects are on.** The background theme is a gentle "Greensleeves"-style tune.

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
| `chinese…` | Wuxia | Warrior → Panda | ink slash | thrown book | panda fart | pentatonic, "Mo Li Hua"-style |
| `english_for_kid…` | Kid | Knight → Dino | sword slash | thrown lollipop | dino roar | bouncy C-major cartoon tune |
| `english_highschool…` | High school | Archer → Hamster | triple light arrow | fire arrow | electric aura | fast, exciting adventure riff |
| *(anything else)* | Default | Wizard → Dragon | blue beam | fireball | dragon fire | "Greensleeves"-style |

A theme swaps the backdrop, both fighters' sprites (idle / attack / hurt / die),
the effect visuals, the sound effects, the BGM, and the on-screen character names
(HUD and menu copy). **Game rules are identical across themes.**

To add a theme for a future set: drop the art in `public/`, add a theme object in
`themes.js`, and append a prefix rule to `THEME_RULES`.

Themed art lives in `design/assets/` and is extracted into `public/sprites/<theme>/`:

| Theme | Asset | Source | Tool |
| :-- | :-- | :-- | :-- |
| Wuxia | hero (sword girl) | `sprite_sheet2_swordgirl.png` | `tools/extract_swordgirl.py` |
| Wuxia | enemy (panda) | `sprite_sheet2.png` | `tools/extract_sprites_cn.py` |
| Wuxia | backdrop | `background2.png` | landscape crop (y 100–1029) |
| Kid | hero + enemy | `sprite_sheet3.png` | `tools/extract_sprites_kid.py` |
| Kid | backdrop | `background3.png` | landscape crop (y 150–1079) |
| High school | hero + enemy | `sprite_sheet4.png` | `tools/extract_sprites_hs.py` |
| High school | backdrop | `background4.png` | landscape crop (y 150–1079) |

The sword-girl and knight sheets have no hurt/defeated frame, so those themes map
`hurt` and `die` to the idle frame; the CSS hurt-flash and lose-screen
treatment carry those states. The sword girl is smooth illustration (not blocky
pixel art), so she renders with `image-rendering: auto`; everything else stays
crisp.

### Languages / fonts

Fonts fall through per glyph: **Fredoka** (Latin) → **Mali** (Thai) → **ZCOOL
KuaiLe** (Simplified Chinese, a cute rounded CJK face). So English, Thai, and
Simplified-Chinese question sets all render in-theme. The Chinese font is served
by Google Fonts in small unicode-range subsets, so its glyphs download only when
a Chinese set is actually shown.
