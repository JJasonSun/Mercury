const Database = require('better-sqlite3')

const db = new Database(':memory:')
db.exec('CREATE TABLE check_ok (id INTEGER PRIMARY KEY, name TEXT NOT NULL)')
db.prepare('INSERT INTO check_ok (name) VALUES (?)').run('electron')
const row = db.prepare('SELECT name FROM check_ok WHERE id = 1').get()
db.close()

console.log(`Electron native check passed: ${row.name}`)
console.log(`electron=${process.versions.electron}`)
console.log(`modules=${process.versions.modules}`)
process.exit(0)
