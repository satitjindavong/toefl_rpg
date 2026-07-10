// A tiny chiptune audio engine built on the Web Audio API so the game ships
// with music and sound effects without any binary audio assets.
//
// - BGM tracks (main / win / lose) are scheduled melodies that loop.
// - SFX are short one-shot synthesized sounds.
// Toggles for BGM and SFX are respected independently.

class AudioEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.bgmGain = null
    this.sfxGain = null
    this.bgmOn = false
    this.sfxOn = true
    this._loop = null // { timer, notes, index, gain }
  }

  _ensure() {
    if (this.ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.9
    this.master.connect(this.ctx.destination)

    this.bgmGain = this.ctx.createGain()
    this.bgmGain.gain.value = this.bgmOn ? 0.24 : 0
    this.bgmGain.connect(this.master)

    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.value = this.sfxOn ? 0.5 : 0
    this.sfxGain.connect(this.master)
  }

  // Must be called from a user gesture to unlock audio on mobile browsers.
  unlock() {
    this._ensure()
    if (this.ctx.state === 'suspended') this.ctx.resume()
  }

  setBgm(on) {
    this.bgmOn = on
    if (this.bgmGain) this.bgmGain.gain.value = on ? 0.24 : 0
  }

  setSfx(on) {
    this.sfxOn = on
    if (this.sfxGain) this.sfxGain.gain.value = on ? 0.5 : 0
  }

  _tone(freq, start, dur, type, dest, peak = 0.4) {
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, start)
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(peak, start + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    o.connect(g)
    g.connect(dest)
    o.start(start)
    o.stop(start + dur + 0.05)
  }

  // ---- Background music ----------------------------------------------------

  _startLoop(notes, tempo, type = 'square') {
    this._ensure()
    this.stopBgm()
    const beat = 60 / tempo
    const state = { index: 0, stopped: false, timer: null }
    const scheduleNext = () => {
      if (state.stopped) return
      const n = notes[state.index % notes.length]
      const t = this.ctx.currentTime + 0.02
      if (n.f) this._tone(n.f, t, n.d * beat * 0.9, type, this.bgmGain, 0.5)
      // simple bass an octave down on down-beats
      if (n.f && state.index % 2 === 0)
        this._tone(n.f / 2, t, n.d * beat * 0.9, 'triangle', this.bgmGain, 0.35)
      state.index++
      state.timer = setTimeout(scheduleNext, n.d * beat * 1000)
    }
    this._loop = state
    scheduleNext()
  }

  stopBgm() {
    if (this._loop) {
      this._loop.stopped = true
      clearTimeout(this._loop.timer)
      this._loop = null
    }
  }

  // Pick a theme's background track by name.
  playBgm(name) {
    if (name === 'molihua') return this.playMoliHua()
    if (name === 'kids') return this.playKidsTune()
    if (name === 'adventure') return this.playAdventureTune()
    return this.playMainBgm()
  }

  // Fast, exciting adventure theme: a driving square-wave riff in C major with
  // leaps and short notes to keep the pulse up.
  playAdventureTune() {
    const N = {
      G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33,
      E5: 659.25, F5: 698.46, G5: 783.99, R: 0,
    }
    const seq = [
      ['C5', 1], ['C5', 1], ['G4', 2], ['C5', 1], ['E5', 1], ['D5', 2],
      ['C5', 1], ['B4', 1], ['C5', 2], ['D5', 1], ['E5', 1], ['G5', 2],
      ['E5', 1], ['D5', 1], ['C5', 2], ['B4', 1], ['A4', 1], ['G4', 2],
      ['A4', 1], ['B4', 1], ['C5', 2], ['E5', 2], ['D5', 4], ['R', 2],
      ['E5', 1], ['F5', 1], ['G5', 2], ['E5', 1], ['C5', 1], ['G4', 2],
      ['A4', 1], ['C5', 1], ['E5', 2], ['D5', 1], ['B4', 1], ['C5', 4], ['R', 2],
    ]
    this._startLoop(seq.map(([k, d]) => ({ f: N[k], d })), 250, 'square')
  }

  // Bouncy children's-cartoon tune: bright C-major arpeggios on a square wave.
  playKidsTune() {
    const N = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
      A4: 440.0, B4: 493.88, C5: 523.25, R: 0,
    }
    const seq = [
      ['C4', 2], ['E4', 2], ['G4', 2], ['C5', 2], ['G4', 2], ['E4', 2], ['G4', 4],
      ['F4', 2], ['A4', 2], ['C5', 2], ['A4', 2], ['F4', 4], ['R', 2],
      ['E4', 2], ['G4', 2], ['C5', 2], ['B4', 2], ['A4', 2], ['G4', 2], ['F4', 4],
      ['D4', 2], ['F4', 2], ['A4', 2], ['G4', 2], ['E4', 2], ['D4', 2], ['C4', 6], ['R', 2],
    ]
    this._startLoop(seq.map(([k, d]) => ({ f: N[k], d })), 220, 'square')
  }

  // Chinese-style pentatonic melody in the spirit of "Mo Li Hua" (茉莉花).
  // Uses only C-major pentatonic (C D E G A), which gives the characteristic
  // Chinese folk colour. Durations in eighth-note beats.
  playMoliHua() {
    const N = {
      C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0,
      C5: 523.25, D5: 587.33, R: 0,
    }
    const seq = [
      ['E4', 2], ['E4', 2], ['G4', 2], ['A4', 2], ['C5', 4], ['A4', 2], ['R', 2],
      ['G4', 2], ['A4', 2], ['G4', 2], ['E4', 2], ['G4', 6], ['R', 2],
      ['E4', 2], ['E4', 2], ['G4', 2], ['A4', 2], ['C5', 4], ['A4', 2], ['R', 2],
      ['G4', 2], ['A4', 2], ['G4', 2], ['E4', 2], ['D4', 6], ['R', 2],
      // bridge
      ['E4', 2], ['D4', 2], ['E4', 2], ['G4', 2], ['A4', 4], ['G4', 2], ['R', 2],
      ['A4', 2], ['C5', 2], ['D5', 2], ['C5', 2], ['A4', 4], ['G4', 2], ['R', 2],
      // cadence
      ['E4', 2], ['G4', 2], ['A4', 2], ['G4', 2], ['E4', 4], ['D4', 2],
      ['C4', 2], ['D4', 2], ['C4', 6], ['R', 4],
    ]
    this._startLoop(seq.map(([k, d]) => ({ f: N[k], d })), 200, 'triangle')
  }

  // Gentle classical melody in A-minor — "Greensleeves". Soft triangle voice,
  // durations in eighth-note beats (q=2, dq=3, e=1).
  playMainBgm() {
    const N = {
      G3: 196.0, A3: 220.0, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63,
      F4: 349.23, G4: 392.0, Gs4: 415.3, A4: 440.0, B4: 493.88, C5: 523.25,
      D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, R: 0,
    }
    const seq = [
      // verse: "Alas my love, you do me wrong..."
      ['A4', 2],
      ['C5', 3], ['D5', 1], ['E5', 3], ['F5', 1], ['E5', 2],
      ['D5', 2], ['B4', 3], ['G4', 1], ['A4', 3], ['B4', 1],
      ['C5', 3], ['A4', 1], ['A4', 2], ['Gs4', 2], ['A4', 4],
      // repeat with a softer cadence
      ['A4', 2],
      ['C5', 3], ['D5', 1], ['E5', 3], ['F5', 1], ['E5', 2],
      ['D5', 2], ['B4', 3], ['G4', 1], ['A4', 3], ['B4', 1],
      ['C5', 3], ['B4', 1], ['A4', 2], ['Gs4', 2], ['A4', 4],
      // chorus: "Greensleeves was all my joy..."
      ['G5', 3], ['G5', 1], ['F5', 2], ['E5', 3], ['D5', 1],
      ['B4', 2], ['G4', 2], ['A4', 3], ['B4', 1],
      ['C5', 3], ['A4', 1], ['A4', 2], ['Gs4', 2], ['A4', 4], ['R', 2],
    ]
    this._startLoop(seq.map(([k, d]) => ({ f: N[k], d })), 200, 'triangle')
  }

  playWinBgm() {
    const N = { C: 523.25, E: 659.25, G: 783.99, C2: 1046.5, R: 0 }
    const seq = [['C', 1], ['E', 1], ['G', 1], ['C2', 2], ['G', 1], ['C2', 3], ['R', 2]]
    this._startLoop(seq.map(([k, d]) => ({ f: N[k], d })), 170, 'triangle')
  }

  playLoseBgm() {
    const N = { A: 440, G: 392, F: 349.23, E: 329.63, D: 293.66, C: 261.63, R: 0 }
    const seq = [['A', 2], ['G', 2], ['F', 2], ['E', 3], ['R', 1], ['D', 2], ['C', 4], ['R', 2]]
    this._startLoop(seq.map(([k, d]) => ({ f: N[k], d })), 110, 'triangle')
  }

  // ---- Sound effects -------------------------------------------------------

  // Play a sound effect by name (themes refer to these names).
  sfx(name) {
    switch (name) {
      case 'blue': return this.sfxBlue()
      case 'fire': return this.sfxFire()
      case 'hurt': return this.sfxHurt()
      case 'ink': return this.sfxInk()
      case 'book': return this.sfxBook()
      case 'fart': return this.sfxFart()
      case 'sword': return this.sfxSword()
      case 'candy': return this.sfxCandy()
      case 'roar': return this.sfxRoar()
      case 'arrow': return this.sfxArrow()
      case 'firearrow': return this.sfxFireArrow()
      case 'shock': return this.sfxShock()
      case 'click': return this.sfxClick()
      default: return undefined
    }
  }

  // Band-passed noise burst, swept from f0 to f1 — the basis of whooshes.
  _noise(start, dur, f0, f1, peak = 0.5, type = 'bandpass') {
    const buf = this.ctx.createBuffer(1, Math.max(1, this.ctx.sampleRate * dur), this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const f = this.ctx.createBiquadFilter()
    f.type = type
    f.frequency.setValueAtTime(f0, start)
    f.frequency.exponentialRampToValueAtTime(f1, start + dur)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(peak, start)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    src.connect(f); f.connect(g); g.connect(this.sfxGain)
    src.start(start)
  }

  // Brush swipe: a fast swoosh that lands in a wet ink splat.
  sfxInk() {
    this._ensure()
    const t = this.ctx.currentTime
    this._noise(t, 0.3, 2800, 500, 0.5) // swoosh
    this._tone(150, t + 0.18, 0.14, 'sine', this.sfxGain, 0.4) // splat body
    this._noise(t + 0.18, 0.16, 900, 220, 0.35) // splat spatter
  }

  // Thrown book: pages flutter, then a papery thud on impact.
  sfxBook() {
    this._ensure()
    const t = this.ctx.currentTime
    this._noise(t, 0.22, 1600, 3200, 0.32, 'highpass') // page flutter
    this._tone(220, t + 0.02, 0.05, 'square', this.sfxGain, 0.2) // flap
    this._tone(120, t + 0.3, 0.16, 'triangle', this.sfxGain, 0.45) // thud
    this._noise(t + 0.3, 0.14, 1200, 300, 0.3) // impact dust
  }

  // Panda fart: a low buzzy sawtooth that slides down, flutter-modulated.
  sfxFart() {
    this._ensure()
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(1000, t)
    lp.frequency.exponentialRampToValueAtTime(420, t + 0.45)
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(165, t)
    o.frequency.exponentialRampToValueAtTime(72, t + 0.42)
    // flutter: square LFO wobbling the pitch gives the classic buzzy raspberry
    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()
    lfo.type = 'square'
    lfo.frequency.setValueAtTime(26, t)
    lfo.frequency.linearRampToValueAtTime(14, t + 0.45)
    lfoGain.gain.setValueAtTime(40, t)
    lfo.connect(lfoGain); lfoGain.connect(o.frequency)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.46)
    o.connect(lp); lp.connect(g); g.connect(this.sfxGain)
    o.start(t); lfo.start(t)
    o.stop(t + 0.5); lfo.stop(t + 0.5)
    this._noise(t + 0.02, 0.3, 400, 160, 0.16, 'lowpass') // breathy hiss
  }

  // Triple light arrow: a bow twang and three quick shimmering whooshes.
  sfxArrow() {
    this._ensure()
    const t = this.ctx.currentTime
    this._tone(180, t, 0.07, 'sawtooth', this.sfxGain, 0.28) // bow twang
    for (let i = 0; i < 3; i++) {
      this._noise(t + 0.03 + i * 0.05, 0.14, 4200, 1200, 0.28)
      this._tone(1400 + i * 260, t + 0.03 + i * 0.05, 0.09, 'sine', this.sfxGain, 0.18)
    }
  }

  // Fire arrow: a twang, a flaming whoosh, then a burning thud.
  sfxFireArrow() {
    this._ensure()
    const t = this.ctx.currentTime
    this._tone(190, t, 0.08, 'sawtooth', this.sfxGain, 0.3) // twang
    this._noise(t + 0.02, 0.34, 900, 2600, 0.4) // flaming whoosh
    this._tone(120, t + 0.3, 0.16, 'triangle', this.sfxGain, 0.4) // impact
    this._noise(t + 0.3, 0.18, 1800, 400, 0.3) // crackle
  }

  // Electric discharge: a buzzing sawtooth chopped by a fast LFO, plus sparks.
  sfxShock() {
    this._ensure()
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(1500, t)
    o.frequency.exponentialRampToValueAtTime(280, t + 0.4)
    // fast square LFO on pitch = crackly zap
    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()
    lfo.type = 'square'
    lfo.frequency.setValueAtTime(70, t)
    lfoGain.gain.setValueAtTime(420, t)
    lfo.connect(lfoGain); lfoGain.connect(o.frequency)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.42, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    o.connect(g); g.connect(this.sfxGain)
    o.start(t); lfo.start(t)
    o.stop(t + 0.5); lfo.stop(t + 0.5)
    this._noise(t, 0.3, 6000, 2000, 0.3, 'highpass') // sparks
    this._tone(90, t + 0.02, 0.14, 'square', this.sfxGain, 0.22) // body thump
  }

  // Sword slash: a bright metallic swish that lands on a short clang.
  sfxSword() {
    this._ensure()
    const t = this.ctx.currentTime
    this._noise(t, 0.18, 5200, 900, 0.45) // swish
    this._tone(1250, t + 0.02, 0.1, 'triangle', this.sfxGain, 0.22) // blade ring
    this._tone(760, t + 0.16, 0.16, 'triangle', this.sfxGain, 0.3) // clang
  }

  // Lollipop toss: a cartoon "pop" that rises, then a sugary twinkle.
  sfxCandy() {
    this._ensure()
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(420, t)
    o.frequency.exponentialRampToValueAtTime(1150, t + 0.11)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17)
    o.connect(g); g.connect(this.sfxGain)
    o.start(t); o.stop(t + 0.2)
    this._tone(1568, t + 0.18, 0.1, 'sine', this.sfxGain, 0.26) // twinkle
    this._tone(2093, t + 0.26, 0.12, 'sine', this.sfxGain, 0.2)
  }

  // Dino roar: a growling sawtooth sliding down, amplitude-wobbled, plus breath.
  sfxRoar() {
    this._ensure()
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(1300, t)
    lp.frequency.exponentialRampToValueAtTime(500, t + 0.55)
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(240, t)
    o.frequency.exponentialRampToValueAtTime(95, t + 0.5)
    // growl: a slow amplitude wobble summed into the gain param
    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(19, t)
    lfoGain.gain.setValueAtTime(0.16, t)
    lfo.connect(lfoGain); lfoGain.connect(g.gain)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.06)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
    o.connect(lp); lp.connect(g); g.connect(this.sfxGain)
    o.start(t); lfo.start(t)
    o.stop(t + 0.65); lfo.stop(t + 0.65)
    this._noise(t, 0.5, 700, 200, 0.2, 'lowpass') // breath
  }

  sfxBlue() {
    this._ensure()
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(300, t)
    o.frequency.exponentialRampToValueAtTime(1400, t + 0.25)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    o.connect(g); g.connect(this.sfxGain)
    o.start(t); o.stop(t + 0.5)
    this._tone(880, t + 0.05, 0.2, 'sine', this.sfxGain, 0.3)
  }

  sfxFire() {
    this._ensure()
    const t = this.ctx.currentTime
    // filtered noise burst = whoosh
    const dur = 0.5
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(500, t)
    bp.frequency.exponentialRampToValueAtTime(1600, t + dur)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.6, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(bp); bp.connect(g); g.connect(this.sfxGain)
    src.start(t)
    this._tone(180, t, 0.3, 'sawtooth', this.sfxGain, 0.3)
  }

  sfxHurt() {
    this._ensure()
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = 'square'
    o.frequency.setValueAtTime(200, t)
    o.frequency.exponentialRampToValueAtTime(60, t + 0.3)
    g.gain.setValueAtTime(0.5, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    o.connect(g); g.connect(this.sfxGain)
    o.start(t); o.stop(t + 0.4)
  }

  sfxClick() {
    this._ensure()
    this._tone(660, this.ctx.currentTime, 0.08, 'square', this.sfxGain, 0.3)
  }
}

export const audio = new AudioEngine()
