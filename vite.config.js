import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
// Shared with the app: config.js is plain data (no browser APIs), so Node can
// import it directly and the picker order stays in sync with the game's default.
import config from './src/game/config.js'

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'public')
const DEFAULT_EXAM = String(config.defaultExam || '').toLowerCase()

// Scan public/ for question-set files (any *.txt) and report each file with its
// question count (non-empty lines). Used to populate the in-game set picker.
function scanExamSets() {
  let files = []
  try {
    files = fs.readdirSync(publicDir)
  } catch {
    return []
  }
  return files
    .filter((f) => /\.txt$/i.test(f))
    .map((f) => {
      let count = 0
      try {
        const raw = fs.readFileSync(path.join(publicDir, f), 'utf8')
        count = raw.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim()).length
      } catch {
        /* ignore unreadable file */
      }
      return { file: f, count }
    })
    // The configured default set first, then the rest alphabetically
    .sort((a, b) =>
      a.file.toLowerCase() === DEFAULT_EXAM
        ? -1
        : b.file.toLowerCase() === DEFAULT_EXAM
          ? 1
          : a.file.localeCompare(b.file)
    )
}

// Exposes /exam-sets.json in dev (computed live so newly dropped files appear on
// refresh) and emits the same file into the build output.
function examManifest() {
  return {
    name: 'exam-manifest',
    // Catch a mistyped config.defaultExam at build/dev-server start rather than
    // leaving it to the browser's runtime fallback.
    configResolved() {
      const files = scanExamSets().map((s) => s.file.toLowerCase())
      if (files.length && !files.includes(DEFAULT_EXAM)) {
        console.warn(
          `\n⚠  config.defaultExam is "${config.defaultExam}", but no such file exists in public/.` +
            `\n   The game will fall back to "default.txt" at runtime.` +
            `\n   Available sets: ${files.join(', ')}\n`
        )
      }
    },
    configureServer(server) {
      server.middlewares.use('/exam-sets.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(scanExamSets()))
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'exam-sets.json', source: JSON.stringify(scanExamSets()) })
    },
  }
}

export default defineConfig({
  plugins: [react(), examManifest()],
  server: { host: true },
})
