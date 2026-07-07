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
