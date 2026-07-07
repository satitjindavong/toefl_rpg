// BGM + SFX toggle buttons, matching the two icon buttons in the mock-up.

export default function SoundControls({ bgmOn, sfxOn, onToggleBgm, onToggleSfx }) {
  return (
    <div className="sound-controls">
      <button
        className={`snd-btn ${sfxOn ? 'on' : 'off'}`}
        onClick={onToggleSfx}
        title="Sound effects"
        aria-label="Toggle sound effects"
      >
        {sfxOn ? '🔊' : '🔇'}
      </button>
      <button
        className={`snd-btn ${bgmOn ? 'on' : 'off'}`}
        onClick={onToggleBgm}
        title="Background music"
        aria-label="Toggle background music"
      >
        {bgmOn ? '🎵' : '🎶'}
      </button>
    </div>
  )
}
