const express = require('express');
const { consultarTodos, consultarUno, ejecutar } = require('../db');
const { verificarToken } = require('../middleware/auth');
const { calcular, listarTipos, existeTipo, ErrorValidacion } = require('../services/calculadora');
const { validarId } = require('../validaciones');

const router = express.Router();

router.use(verificarToken);

function formatear(fila) {
  return {
    id: fila.id,
    usuario_id: fila.usuario_id,
    usuario_nombre: fila.usuario_nombre,
    tipo: fila.tipo,
    descripcion: fila.descripcion,
    datos: JSON.parse(fila.datos),
    resultado: JSON.parse(fila.resultado),
    creado_en: fila.creado_en,
    actualizado_en: fila.actualizado_en,
  };
}

function validarDescripcion(texto) {
  const limpio = String(texto || '').trim();
  if (limpio.length > 120) {
    throw new ErrorValidacion('La descripción no puede pasar de 120 caracteres.');
  }
  return limpio;
}

function buscarPermitido(req, res) {
  const id = validarId(req.params.id);
  const fila = consultarUno(
    `SELECT c.*, u.nombre AS usuario_nombre
       FROM calculos c JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.id = ?`,
    [id]
  );
  if (!fila) {
    res.status(404).json({ mensaje: 'El cálculo no existe.' });
    return null;
  }
  if (req.usuario.rol !== 'admin' && fila.usuario_id !== req.usuario.id) {
    res.status(403).json({ mensaje: 'No tienes permiso sobre este cálculo.' });
    return null;
  }
  return fila;
}

router.get('/tipos', (req, res) => {
  res.json(listarTipos());
});

router.get('/resumen', (req, res) => {
  const esAdmin = req.usuario.rol === 'admin';
  const porTipo = esAdmin
    ? consultarTodos('SELECT tipo, COUNT(*) AS total FROM calculos GROUP BY tipo')
    : consultarTodos('SELECT tipo, COUNT(*) AS total FROM calculos WHERE usuario_id = ? GROUP BY tipo', [req.usuario.id]);
  const total = porTipo.reduce((suma, fila) => suma + fila.total, 0);
  const usuarios = esAdmin ? consultarUno('SELECT COUNT(*) AS total FROM usuarios').total : null;
  res.json({ total, porTipo, usuarios });
});

router.get('/', (req, res) => {
  const condiciones = [];
  const valores = [];
  if (req.usuario.rol !== 'admin') {
    condiciones.push('c.usuario_id = ?');
    valores.push(req.usuario.id);
  }
  if (req.query.tipo && existeTipo(req.query.tipo)) {
    condiciones.push('c.tipo = ?');
    valores.push(req.query.tipo);
  }
  if (req.query.buscar) {
    condiciones.push('(c.descripcion LIKE ? OR u.nombre LIKE ?)');
    const patron = `%${String(req.query.buscar).trim()}%`;
    valores.push(patron, patron);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const filas = consultarTodos(
    `SELECT c.*, u.nombre AS usuario_nombre
       FROM calculos c JOIN usuarios u ON u.id = c.usuario_id
       ${where}
      ORDER BY c.id DESC`,
    valores
  );
  res.json(filas.map(formatear));
});

router.get('/:id', (req, res) => {
  const fila = buscarPermitido(req, res);
  if (!fila) return;
  res.json(formatear(fila));
});

router.post('/', (req, res) => {
  const tipo = String(req.body.tipo || '');
  const descripcion = validarDescripcion(req.body.descripcion);
  const { datos, resultado } = calcular(tipo, req.body.datos);
  const { id } = ejecutar(
    'INSERT INTO calculos (usuario_id, tipo, descripcion, datos, resultado) VALUES (?, ?, ?, ?, ?)',
    [req.usuario.id, tipo, descripcion, JSON.stringify(datos), JSON.stringify(resultado)]
  );
  const fila = consultarUno(
    `SELECT c.*, u.nombre AS usuario_nombre
       FROM calculos c JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.id = ?`,
    [id]
  );
  res.status(201).json(formatear(fila));
});

router.put('/:id', (req, res) => {
  const fila = buscarPermitido(req, res);
  if (!fila) return;
  const descripcion = req.body.descripcion === undefined ? fila.descripcion : validarDescripcion(req.body.descripcion);
  const datosEntrada = req.body.datos || JSON.parse(fila.datos);
  const { datos, resultado } = calcular(fila.tipo, datosEntrada);
  ejecutar(
    `UPDATE calculos
        SET descripcion = ?, datos = ?, resultado = ?, actualizado_en = datetime('now', 'localtime')
      WHERE id = ?`,
    [descripcion, JSON.stringify(datos), JSON.stringify(resultado), fila.id]
  );
  const actualizado = consultarUno(
    `SELECT c.*, u.nombre AS usuario_nombre
       FROM calculos c JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.id = ?`,
    [fila.id]
  );
  res.json(formatear(actualizado));
});

router.delete('/:id', (req, res) => {
  const fila = buscarPermitido(req, res);
  if (!fila) return;
  ejecutar('DELETE FROM calculos WHERE id = ?', [fila.id]);
  res.json({ mensaje: 'Cálculo eliminado.' });
});

module.exports = router;
