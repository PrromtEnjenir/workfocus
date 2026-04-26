#!/usr/bin/env node
// scripts/reset-db.js
// Usuwa bazę danych WorkFocus (dev only)
// Użycie: node scripts/reset-db.js

const fs = require('fs')
const path = require('path')
const os = require('os')

// Electron userData path — taki sam jak app.getPath('userData')
const platform = os.platform()
let userDataPath

if (platform === 'win32') {
  userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'workfocus')
} else if (platform === 'darwin') {
  userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'workfocus')
} else {
  userDataPath = path.join(os.homedir(), '.config', 'workfocus')
}

const dbPath = path.join(userDataPath, 'workfocus.db')
const dbWalPath = dbPath + '-wal'
const dbShmPath = dbPath + '-shm'

console.log(`\n🗑  WorkFocus DB Reset`)
console.log(`📁 userData: ${userDataPath}\n`)

let deleted = false

for (const filePath of [dbPath, dbWalPath, dbShmPath]) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    console.log(`✓ Usunięto: ${path.basename(filePath)}`)
    deleted = true
  }
}

if (!deleted) {
  console.log('ℹ  Baza danych nie istnieje — nic do usunięcia.')
} else {
  console.log('\n✅ Reset zakończony. Uruchom aplikację ponownie.\n')
}
