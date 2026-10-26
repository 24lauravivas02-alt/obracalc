const { iniciarBaseDeDatos } = require('./src/db');
const { crearApp } = require('./src/app');

const PUERTO = process.env.PORT || 3000;

async function arrancar() {
  await iniciarBaseDeDatos();
  const app = crearApp();
  app.listen(PUERTO, () => {
    console.log(`Servidor listo en http://localhost:${PUERTO}`);
    console.log('Usuario administrador por defecto: admin / admin123');
  });
}

arrancar().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exit(1);
});
