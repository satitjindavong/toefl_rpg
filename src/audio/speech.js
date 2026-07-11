// Client-side text-to-speech for the vocab word, via the Web Speech API.
//
// Zero server, no audio files, no cost. It runs entirely in the browser and is
// non-blocking, so it never touches the game timer. Voice availability varies by
// device (English is near-universal, Chinese common, Thai often missing, and
// some in-app webviews have no speech at all), so we only ever offer the button
// when the device actually has a voice for the word's language — otherwise the
// word is simply not spoken rather than mispronounced by a wrong-language voice.

// ─── Master switch for the pronounce (text-to-speech) feature ───────────────
// Flip FEATURE_ENABLED to false to remove the 🔊 button everywhere and disable
// all speech — nothing else needs to change. It can also be turned off at build
// time without editing code by setting the env var VITE_SPEECH=off.
const FEATURE_ENABLED = true
const ENABLED = FEATURE_ENABLED && import.meta.env.VITE_SPEECH !== 'off'

const SUPPORTED =
  ENABLED &&
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance !== 'undefined'

class Speech {
  constructor() {
    this.voices = []
    this.listeners = new Set()
    if (!SUPPORTED) return
    this._load()
    // Voices frequently load asynchronously (notably on iOS Safari and Android),
    // so refresh when the browser signals they're ready, plus a couple of light
    // retries in case the event never fires in some webviews.
    try {
      window.speechSynthesis.onvoiceschanged = () => this._load()
    } catch {
      /* ignore */
    }
    setTimeout(() => this._load(), 300)
    setTimeout(() => this._load(), 1200)
  }

  get supported() {
    return SUPPORTED
  }

  _load() {
    if (!SUPPORTED) return
    let v = []
    try {
      v = window.speechSynthesis.getVoices() || []
    } catch {
      v = []
    }
    // Only notify subscribers when the set actually changes (avoid render churn).
    if (v.length !== this.voices.length) {
      this.voices = v
      this.listeners.forEach((fn) => fn())
    } else {
      this.voices = v
    }
  }

  subscribe(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  // Pick the language from the word's script: CJK -> Chinese, Thai block -> Thai,
  // anything else -> English.
  langFor(word) {
    const s = String(word || '')
    if (/[㐀-鿿]/.test(s)) return 'zh' // CJK ideographs (Ext A + Unified)
    if (/[฀-๿]/.test(s)) return 'th' // Thai block
    return 'en'
  }

  // Drop any romanization / pinyin in parentheses, e.g. "打电话 (dǎ diànhuà)".
  clean(word) {
    const raw = String(word || '').trim()
    const stripped = raw.replace(/[([（【].*?[)\]）】]/g, '').trim()
    return stripped || raw
  }

  // A device voice whose language matches by prefix (en / zh / th).
  voiceFor(lang) {
    return this.voices.find((v) => (v.lang || '').toLowerCase().startsWith(lang)) || null
  }

  // Whether this exact word can be pronounced on this device right now.
  canSpeak(word) {
    if (!SUPPORTED || !word) return false
    return !!this.voiceFor(this.langFor(word))
  }

  speak(word) {
    if (!SUPPORTED || !word) return
    const voice = this.voiceFor(this.langFor(word))
    if (!voice) return
    const text = this.clean(word)
    if (!text) return
    try {
      window.speechSynthesis.cancel() // stop anything mid-utterance
      const u = new window.SpeechSynthesisUtterance(text)
      u.voice = voice
      u.lang = voice.lang
      u.rate = 0.9 // a touch slower for clarity
      u.pitch = 1
      window.speechSynthesis.speak(u)
    } catch {
      /* never let TTS break gameplay */
    }
  }

  stop() {
    if (!SUPPORTED) return
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
  }
}

export const speech = new Speech()
