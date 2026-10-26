const { ErrorValidacion } = require('./services/calculadora');

const PATRON_USUARIO = /^[\p{L}0-9_. ]{3,30}$/u;

function validarNombre(nombre) {
  const limpio = String(nombre || '').trim();
  if (limpio.length < 2 || limpio.length > 60) {
    throw new ErrorValidacion('El nombre debe tener entre 2 y 60 caracteres.');
  }
  return limpio;
}

function validarUsuario(usuario) {
  const limpio = String(usuario || '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (!PATRON_USUARIO.test(limpio)) {
    throw new ErrorValidacion('El nombre de usuario debe tener de 3 a 30 caracteres: letras, números, espacios, punto o guion bajo.');
  }
  return limpio;
}

function validarPassword(password) {
  const texto = String(password || '');
  if (texto.length < 6 || texto.length > 72) {
    throw new ErrorValidacion('La contraseña debe tener entre 6 y 72 caracteres.');
  }
  return texto;
}

function validarId(id) {
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErrorValidacion('Identificador no válido.');
  }
  return numero;
}

module.exports = { validarNombre, validarUsuario, validarPassword, validarId };
