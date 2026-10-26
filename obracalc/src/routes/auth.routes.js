const express = require('express');
const bcrypt = require('bcryptjs');
const { consultarUno, ejecutar } = require('../db');
const { generarToken, verificarToken } = require('../middleware/auth');
const { validarNombre, validarUsuario, validarPassword } = require('../validaciones');
const { ErrorValidacion } = require('../services/calculadora');

const router = express.Router();

function limpiarUsuario(fila) {
  return { id: fila.id, nombre: fila.nombre, usuario: fila.usuario, rol: fila.rol, creado_en: fila.creado_en };
}

router.post('/registro', (req, res) => {
  const usuario = validarUsuario(req.body.usuario);
  const nombre = validarNombre(req.body.nombre || req.body.usuario);
  const password = validarPassword(req.body.password);
  if (consultarUno('SELECT id FROM usuarios WHERE usuario = ?', [usuario])) {
    return res.status(409).json({ mensaje: 'Ese nombre de usuario ya está registrado.' });
  }
  const { id } = ejecutar(
    'INSERT INTO usuarios (nombre, usuario, password_hash, rol) VALUES (?, ?, ?, ?)',
    [nombre, usuario, bcrypt.hashSync(password, 10), 'usuario']
  );
  const nuevo = consultarUno('SELECT * FROM usuarios WHERE id = ?', [id]);
  return res.status(201).json({ token: generarToken(nuevo), usuario: limpiarUsuario(nuevo) });
});

router.post('/login', (req, res) => {
  const usuario = String(req.body.usuario || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const password = String(req.body.password || '');
  if (!usuario || !password) {
    throw new ErrorValidacion('Escribe tu usuario y tu contraseña.');
  }
  const fila = consultarUno('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
  if (!fila || !bcrypt.compareSync(password, fila.password_hash)) {
    return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
  }
  return res.json({ token: generarToken(fila), usuario: limpiarUsuario(fila) });
});

router.get('/perfil', verificarToken, (req, res) => {
  const fila = consultarUno('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);
  if (!fila) {
    return res.status(401).json({ mensaje: 'Tu cuenta ya no existe.' });
  }
  return res.json(limpiarUsuario(fila));
});

router.put('/password', verificarToken, (req, res) => {
  const nueva = validarPassword(req.body.nueva);
  if (nueva !== String(req.body.confirmar || '')) {
    throw new ErrorValidacion('Las contraseñas no coinciden.');
  }
  const { cambios } = ejecutar('UPDATE usuarios SET password_hash = ? WHERE id = ?', [bcrypt.hashSync(nueva, 10), req.usuario.id]);
  if (cambios === 0) {
    return res.status(401).json({ mensaje: 'Tu cuenta ya no existe.' });
  }
  return res.json({ mensaje: 'Contraseña cambiada correctamente.' });
});

module.exports = { router };
