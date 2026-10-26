const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const fs = require('fs');

process.env.DB_PATH = path.join(os.tmpdir(), `calculadora-test-${Date.now()}.sqlite`);

const { iniciarBaseDeDatos } = require('../src/db');
const { crearApp } = require('../src/app');

let servidor;
let base;

before(async () => {
  await iniciarBaseDeDatos();
  servidor = crearApp().listen(0);
  await new Promise((resolver) => servidor.once('listening', resolver));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
});

after(() => {
  servidor.close();
  fs.rmSync(process.env.DB_PATH, { force: true });
});

async function pedir(metodo, ruta, cuerpo, token) {
  const cabeceras = { 'Content-Type': 'application/json' };
  if (token) cabeceras.Authorization = `Bearer ${token}`;
  const respuesta = await fetch(base + ruta, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { status: respuesta.status, json: await respuesta.json() };
}

test('login del administrador por defecto', async () => {
  const r = await pedir('POST', '/auth/login', { usuario: 'admin', password: 'admin123' });
  assert.equal(r.status, 200);
  assert.equal(r.json.usuario.rol, 'admin');
});

test('login con contrasena incorrecta devuelve 401', async () => {
  const r = await pedir('POST', '/auth/login', { usuario: 'admin', password: 'mala123' });
  assert.equal(r.status, 401);
});

test('registro y CRUD de calculos con las formulas del enunciado', async () => {
  const reg = await pedir('POST', '/auth/registro', { usuario: 'Juan Diego', password: 'clave123' });
  assert.equal(reg.status, 201);
  assert.equal(reg.json.usuario.rol, 'usuario');
  const token = reg.json.token;

  const repetido = await pedir('POST', '/auth/registro', { usuario: 'juan diego', password: 'clave123' });
  assert.equal(repetido.status, 409);

  const muro = await pedir('POST', '/calculos', { tipo: 'muro', descripcion: 'Muro patio', datos: { espesor: 30, largo: 5, alto: 2 } }, token);
  assert.equal(muro.status, 201);
  assert.equal(muro.json.resultado.medidas[0].valor, 10);
  assert.equal(muro.json.resultado.materiales[0].cantidad, 152);
  assert.equal(muro.json.resultado.materiales[1].cantidad, 1.15);
  assert.equal(muro.json.resultado.materiales[2].cantidad, 1200);

  const piso = await pedir('POST', '/calculos', { tipo: 'piso', datos: { ancho: 4, largo: 5 } }, token);
  assert.equal(piso.json.resultado.materiales[0].cantidad, 22);

  const pintura = await pedir('POST', '/calculos', { tipo: 'pintura', datos: { superficie: 6 } }, token);
  assert.equal(pintura.json.resultado.materiales[0].cantidad, 1);

  const contrapiso = await pedir('POST', '/calculos', { tipo: 'contrapiso', datos: { espesor: 10, ancho: 4, largo: 5 } }, token);
  assert.equal(contrapiso.json.resultado.materiales[0].cantidad, 210);

  const malo = await pedir('POST', '/calculos', { tipo: 'muro', datos: { espesor: 25, largo: 5, alto: 2 } }, token);
  assert.equal(malo.status, 400);

  const lista = await pedir('GET', '/calculos', null, token);
  assert.equal(lista.json.length, 4);

  const editado = await pedir('PUT', `/calculos/${muro.json.id}`, { descripcion: 'Muro patio (20 cm)', datos: { espesor: 20, largo: 5, alto: 2 } }, token);
  assert.equal(editado.status, 200);
  assert.equal(editado.json.resultado.materiales[0].cantidad, 109);
  assert.equal(editado.json.descripcion, 'Muro patio (20 cm)');

  const busqueda = await pedir('GET', '/calculos?buscar=patio', null, token);
  assert.equal(busqueda.json.length, 1);

  const borrado = await pedir('DELETE', `/calculos/${pintura.json.id}`, null, token);
  assert.equal(borrado.status, 200);
  const yaNoEsta = await pedir('GET', `/calculos/${pintura.json.id}`, null, token);
  assert.equal(yaNoEsta.status, 404);
});

test('cada perfil ve solo lo que le corresponde (usuario: lo suyo, admin: todo)', async () => {
  const a = await pedir('POST', '/auth/registro', { nombre: 'Ana', usuario: 'ana', password: 'clave123' });
  const b = await pedir('POST', '/auth/registro', { nombre: 'Beto', usuario: 'beto', password: 'clave123' });
  const calc = await pedir('POST', '/calculos', { tipo: 'viga', datos: { largo: 2 } }, a.json.token);
  const ajeno = await pedir('GET', `/calculos/${calc.json.id}`, null, b.json.token);
  assert.equal(ajeno.status, 403);
  const listaBeto = await pedir('GET', '/calculos', null, b.json.token);
  assert.equal(listaBeto.json.length, 0);
  const admin = await pedir('POST', '/auth/login', { usuario: 'admin', password: 'admin123' });
  const comoAdmin = await pedir('GET', `/calculos/${calc.json.id}`, null, admin.json.token);
  assert.equal(comoAdmin.status, 200);
  const sinToken = await pedir('GET', '/calculos');
  assert.equal(sinToken.status, 401);
});

test('cambiar la contrasena exige sesion y luego permite entrar con la nueva', async () => {
  const sinSesion = await pedir('PUT', '/auth/password', { nueva: 'nueva123', confirmar: 'nueva123' });
  assert.equal(sinSesion.status, 401);
  const reg = await pedir('POST', '/auth/registro', { usuario: 'carlos', password: 'clave123' });
  const distintas = await pedir('PUT', '/auth/password', { nueva: 'nueva123', confirmar: 'otra123' }, reg.json.token);
  assert.equal(distintas.status, 400);
  const ok = await pedir('PUT', '/auth/password', { nueva: 'nueva123', confirmar: 'nueva123' }, reg.json.token);
  assert.equal(ok.status, 200);
  const login = await pedir('POST', '/auth/login', { usuario: 'Carlos', password: 'nueva123' });
  assert.equal(login.status, 200);
});
