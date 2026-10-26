const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'calculadora.sqlite');

let db = null;

async function iniciarBaseDeDatos() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre        TEXT    NOT NULL,
      usuario       TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      rol           TEXT    NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
      creado_en     TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS calculos (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id     INTEGER NOT NULL,
      tipo           TEXT    NOT NULL,
      descripcion    TEXT    NOT NULL DEFAULT '',
      datos          TEXT    NOT NULL,
      resultado      TEXT    NOT NULL,
      creado_en      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      actualizado_en TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
  `);

  const admin = consultarUno("SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1");
  if (!admin) {
    ejecutar(
      'INSERT INTO usuarios (nombre, usuario, password_hash, rol) VALUES (?, ?, ?, ?)',
      ['Administrador', 'admin', bcrypt.hashSync('admin123', 10), 'admin']
    );
  }

  guardar();
}

function guardar() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function consultarTodos(sql, params = []) {
  const sentencia = db.prepare(sql);
  sentencia.bind(params);
  const filas = [];
  while (sentencia.step()) {
    filas.push(sentencia.getAsObject());
  }
  sentencia.free();
  return filas;
}

function consultarUno(sql, params = []) {
  const filas = consultarTodos(sql, params);
  return filas.length > 0 ? filas[0] : null;
}

function ejecutar(sql, params = []) {
  db.run(sql, params);
  const cambios = db.getRowsModified();
  const fila = consultarUno('SELECT last_insert_rowid() AS id');
  guardar();
  return { id: fila ? fila.id : null, cambios };
}

module.exports = { iniciarBaseDeDatos, consultarTodos, consultarUno, ejecutar };
