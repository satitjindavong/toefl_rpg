# TOEFL Vocab Battle 🧙‍♂️🔥🐉

A vertical **pixel-art RPG** where a Wizard battles a Dragon by answering
TOEFL-level English → Thai vocabulary questions. Built with **React + Vite**,
playable on mobile and desktop. Made for Thai students.

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

- Each mode keeps its own **top-20** high-score board (name, score, when played,
  and surviving HP), stored locally in the browser (`localStorage`).
- Finish a run with a qualifying total and you're prompted to **enter your name**.
- View boards any time from the **🏆 SCOREBOARD** button on the title screen.
- Boards **reset weekly**, at the start of every **Monday** (local time).

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
│  ├─ exam.txt            # vocabulary database (500 questions)
│  ├─ background.png      # forest battle backdrop
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
