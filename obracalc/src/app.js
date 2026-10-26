const express = require('express');
const path = require('path');
const { router: authRouter } = require('./routes/auth.routes');
const calculosRouter = require('./routes/calculos.routes');

function crearApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/salud', (req, res) => res.json({ estado: 'ok' }));
  app.use('/api/auth', authRouter);
  app.use('/api/calculos', calculosRouter);

  app.use('/api', (req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));

  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ mensaje: 'El formato de los datos enviados no es válido.' });
    }
    if (error.status && error.status < 500) {
      return res.status(error.status).json({ mensaje: error.message });
    }
    console.error(error);
    return res.status(500).json({ mensaje: 'Ocurrió un error inesperado en el servidor.' });
  });

  return app;
}

module.exports = { crearApp };
