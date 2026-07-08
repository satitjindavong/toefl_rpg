import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'public')

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
    // default.txt (the default set) first, then the rest alphabetically
    .sort((a, b) =>
      a.file.toLowerCase() === 'default.txt'
        ? -1
        : b.file.toLowerCase() === 'default.txt'
          ? 1
          : a.file.localeCompare(b.file)
    )
}

// Exposes /exam-sets.json in dev (computed live so newly dropped files appear on
// refresh) and emits the same file into the build output.
function examManifest() {
  return {
    name: 'exam-manifest',
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
