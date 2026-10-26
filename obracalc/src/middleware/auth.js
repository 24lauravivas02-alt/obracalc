const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave-secreta-proyecto-interfaces-1';
const JWT_EXPIRA = '8h';

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, usuario: usuario.usuario, nombre: usuario.nombre, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRA }
  );
}

function verificarToken(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const [esquema, token] = cabecera.split(' ');
  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión.' });
  }
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.' });
  }
}

function soloAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Solo el administrador puede realizar esta acción.' });
  }
  return next();
}

module.exports = { generarToken, verificarToken, soloAdmin };
