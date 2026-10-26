# ObraCalc – Calculadora de materiales de construcción (Backend + conexión con el Frontend)

Proyecto práctico de **Interfaces I** (Ingeniería de Software – Escuela Tecnológica de Neiva).
Calculadora de materiales con **perfiles (roles) e inicio de sesión** y **CRUD** de cálculos.

## Tecnologías
- **Backend:** Node.js + Express
- **Base de datos:** SQLite (librería `sql.js`, no requiere instalar nada más)
- **Seguridad:** contraseñas con `bcryptjs`, sesión con tokens JWT (`jsonwebtoken`)
- **Frontend:** el mockup ObraCalc del equipo (`public/index.html`, `style.css`, `script.js` y el logo, sin cambios de diseño) + `public/conexion.js`, que lo conecta con la API. En `index.html` solo se agregó la línea `<script src="conexion.js"></script>`.

## Cómo ejecutarlo
1. Instala Node.js 18 o superior.
2. En la carpeta del proyecto:
   ```bash
   npm install
   npm start
   ```
3. Abre **http://localhost:3000**
4. Regístrate o entra con el administrador por defecto: **admin / admin123**

Pruebas automáticas: `npm test`

## Perfiles (roles)
| Rol | Qué puede hacer |
|---|---|
| `usuario` | Se registra, inicia sesión y hace el CRUD de **sus** cálculos |
| `admin` | Ve, edita y elimina los cálculos de **todos** los usuarios |

## Menú (según el enunciado)
1 Muro de ladrillo · 2 Viga de hormigón · 3 Columnas · 4 Contrapisos · 5 Techo · 6 Pisos · 7 Pintura · 8 Salir

Los subprogramas `calcularSuperficie` y `calcularVolumen` son internos (`src/services/calculadora.js`): no tienen ruta en la API, así el usuario no puede acceder a ellos.

## Cómo se usa el CRUD en el mockup
| Acción | Dónde |
|---|---|
| **Create** | Menú → opción 1 a 7 → **CALCULAR**: el backend calcula y guarda |
| **Read** | Botón **☰** del menú → pantalla **Mis cálculos** |
| **Update** | En *Mis cálculos* toca un cálculo → cambia las medidas → **GUARDAR CAMBIOS** |
| **Delete** | En *Mis cálculos* toca **🗑️** |
| Perfil / cambiar contraseña | Botón **👤** del menú (exige sesión iniciada) |
| Salir (opción 8) | **salir** cierra la sesión |

## API (endpoints)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/registro` | Crear cuenta (rol usuario) |
| POST | `/api/auth/login` | Iniciar sesión, devuelve token |
| GET | `/api/auth/perfil` | Datos del usuario de la sesión |
| PUT | `/api/auth/password` | Cambiar la contraseña (con sesión) |
| GET | `/api/calculos/tipos` | Catálogo de los 7 cálculos |
| GET | `/api/calculos/resumen` | Totales por tipo |
| GET | `/api/calculos` | **Read** – lista (`?tipo=` y `?buscar=` opcionales) |
| GET | `/api/calculos/:id` | **Read** – un cálculo |
| POST | `/api/calculos` | **Create** – calcula y guarda |
| PUT | `/api/calculos/:id` | **Update** – modifica y recalcula |
| DELETE | `/api/calculos/:id` | **Delete** – elimina |

## Estructura
```
server.js                    Punto de entrada (npm start)
src/app.js                   Configuración de Express y rutas
src/db.js                    Base de datos SQLite (tablas usuarios y calculos)
src/middleware/auth.js       Token JWT y permisos por rol
src/validaciones.js          Reglas de nombre, usuario, contraseña e id
src/services/calculadora.js  Fórmulas del enunciado (subprogramas)
src/routes/auth.routes.js    Registro, login y perfil
src/routes/calculos.routes.js CRUD de cálculos
public/                      Frontend: mockup ObraCalc + conexion.js
tests/api.test.js            Pruebas automáticas
```

## Subir a GitHub (entrega en Q10)
```bash
git init
git add .
git commit -m "Backend y CRUD de la calculadora de materiales"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/obracalc.git
git push -u origin main
```
El repositorio debe ser **público**. `node_modules/` y la base de datos no se suben (están en `.gitignore`).
