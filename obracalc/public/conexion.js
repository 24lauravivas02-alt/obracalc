(function () {
  const API_URL = '/api';

  const PROTEGIDAS = ['menu', 'muro', 'viga', 'columna', 'contrapiso', 'techo', 'pisos', 'pintura', 'historial'];

  const Sesion = {
    guardar(token, usuario, recordar) {
      this.cerrar();
      const almacen = recordar ? localStorage : sessionStorage;
      almacen.setItem('token', token);
      almacen.setItem('usuario', JSON.stringify(usuario));
    },
    token() {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    },
    usuario() {
      try {
        return JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario')) || {};
      } catch (error) {
        return {};
      }
    },
    cerrar() {
      [localStorage, sessionStorage].forEach((almacen) => {
        almacen.removeItem('token');
        almacen.removeItem('usuario');
      });
    },
  };

  async function api(metodo, ruta, cuerpo) {
    const cabeceras = { 'Content-Type': 'application/json' };
    if (Sesion.token()) cabeceras.Authorization = `Bearer ${Sesion.token()}`;
    let respuesta;
    try {
      respuesta = await fetch(API_URL + ruta, {
        method: metodo,
        headers: cabeceras,
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      });
    } catch (error) {
      throw new Error('No hay conexión con el servidor. Enciéndelo con "npm start".');
    }
    const datos = await respuesta.json().catch(() => ({}));
    if (respuesta.status === 401 && Sesion.token() && !ruta.startsWith('/auth/login')) {
      Sesion.cerrar();
      mostrarPantalla('login');
    }
    if (!respuesta.ok) throw new Error(datos.mensaje || 'Ocurrió un error. Intenta de nuevo.');
    return datos;
  }

  const valor = (id) => document.getElementById(id).value;
  const poner = (id, v) => {
    document.getElementById(id).value = v ?? '';
  };
  const texto = (id, t) => {
    document.getElementById(id).textContent = t;
  };

  function escapar(t) {
    return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function formatear(cantidad, unidad) {
    if (unidad === 'unidades') return `${fmtInt(cantidad)} und`;
    if (unidad === 'm³') return `${fmt(cantidad, 3)} m³`;
    return `${fmt(cantidad)} ${unidad}`;
  }

  const PANTALLAS = {
    muro: {
      tipo: 'muro',
      icono: '🧱',
      leer: () => ({ espesor: espesorActual, largo: valor('muroLargo'), alto: valor('muroAlto') }),
      escribir: (d) => {
        selectEspesor(d.espesor);
        poner('muroLargo', d.largo);
        poner('muroAlto', d.alto);
      },
      resumen: (d) => `${d.espesor} cm · ${d.largo} × ${d.alto} m`,
      caja: 'muroResult',
      medidas: ['muroSup'],
      materiales: ['muroCem', 'muroAre', 'muroLad'],
      extra: (c) => texto('muroNote', `Cálculo para muro de ${c.datos.espesor} cm de espesor`),
    },
    viga: {
      tipo: 'viga',
      icono: '🔩',
      leer: () => ({ largo: valor('vigaLargo') }),
      escribir: (d) => poner('vigaLargo', d.largo),
      resumen: (d) => `${d.largo} m`,
      caja: 'vigaResult',
      medidas: [],
      materiales: ['vigaCem', 'vigaAre', 'vigaPie', 'vigaH8', 'vigaH4'],
    },
    columna: {
      tipo: 'columna',
      icono: '🏛️',
      leer: () => ({ largo: valor('colLargo') }),
      escribir: (d) => poner('colLargo', d.largo),
      resumen: (d) => `${d.largo} m`,
      caja: 'colResult',
      medidas: [],
      materiales: ['colCem', 'colAre', 'colPie', 'colH10', 'colH4'],
    },
    contrapiso: {
      tipo: 'contrapiso',
      icono: '🚧',
      leer: () => ({ espesor: valor('cpEspesor'), ancho: valor('cpAncho'), largo: valor('cpLargo') }),
      escribir: (d) => {
        poner('cpEspesor', d.espesor);
        poner('cpAncho', d.ancho);
        poner('cpLargo', d.largo);
      },
      resumen: (d) => `${d.espesor} cm · ${d.ancho} × ${d.largo} m`,
      caja: 'cpResult',
      medidas: [],
      materiales: ['cpCem', 'cpAre', 'cpPie'],
    },
    techo: {
      tipo: 'techo',
      icono: '🗼',
      leer: () => ({ espesor: valor('techoEspesor'), ancho: valor('techoAncho'), largo: valor('techoLargo') }),
      escribir: (d) => {
        poner('techoEspesor', d.espesor);
        poner('techoAncho', d.ancho);
        poner('techoLargo', d.largo);
      },
      resumen: (d) => `${d.espesor} cm · ${d.ancho} × ${d.largo} m`,
      caja: 'techoResult',
      medidas: [],
      materiales: ['techoCem', 'techoAre', 'techoPie', 'techoH8', 'techoH6'],
    },
    pisos: {
      tipo: 'piso',
      icono: '🟫',
      leer: () => ({ ancho: valor('pisoAncho'), largo: valor('pisoLargo') }),
      escribir: (d) => {
        poner('pisoAncho', d.ancho);
        poner('pisoLargo', d.largo);
      },
      resumen: (d) => `${d.ancho} × ${d.largo} m`,
      caja: 'pisoResult',
      medidas: ['pisoSup', 'pisoExtra'],
      materiales: [],
      extra: (c) => texto('pisoTotal', `Superficie total a cubrir ${fmt(c.resultado.materiales[0].cantidad)} m²`),
    },
    pintura: {
      tipo: 'pintura',
      icono: '🖌️',
      leer: () => ({ superficie: valor('pinturaSup') }),
      escribir: (d) => poner('pinturaSup', d.superficie),
      resumen: (d) => `${d.superficie} m²`,
      caja: 'pinturaResult',
      medidas: [],
      materiales: ['pinturaLitros'],
    },
  };

  function pantallaDeTipo(tipo) {
    return Object.keys(PANTALLAS).find((nombre) => PANTALLAS[nombre].tipo === tipo);
  }

  function mostrarResultado(nombre, calculo) {
    const p = PANTALLAS[nombre];
    p.medidas.forEach((id, i) => texto(id, formatear(calculo.resultado.medidas[i].valor, calculo.resultado.medidas[i].unidad)));
    p.materiales.forEach((id, i) => texto(id, formatear(calculo.resultado.materiales[i].cantidad, calculo.resultado.materiales[i].unidad)));
    if (p.extra) p.extra(calculo);
    document.getElementById(p.caja).style.display = 'block';
  }

  let edicion = null;

  function botonCalcular(nombre) {
    return document.querySelector(`#screen-${nombre} .calc-btn`);
  }

  function salirEdicion() {
    if (!edicion) return;
    botonCalcular(edicion.pantalla).innerHTML = edicion.textoOriginal;
    document.querySelectorAll(`#screen-${edicion.pantalla} input`).forEach((input) => {
      input.value = '';
    });
    document.getElementById(PANTALLAS[edicion.pantalla].caja).style.display = 'none';
    edicion = null;
  }

  const showScreenOriginal = window.showScreen;

  function mostrarPantalla(nombre) {
    if (!Sesion.token() && PROTEGIDAS.includes(nombre)) nombre = 'login';
    else if (Sesion.token() && ['welcome', 'login', 'register'].includes(nombre)) nombre = 'menu';
    if (edicion && nombre === 'menu') nombre = 'historial';
    if (edicion && nombre !== edicion.pantalla) salirEdicion();
    if (nombre === 'historial') cargarHistorial();
    showScreenOriginal(nombre);
  }

  window.showScreen = mostrarPantalla;

  async function calcular(nombre) {
    const p = PANTALLAS[nombre];
    const boton = botonCalcular(nombre);
    boton.disabled = true;
    try {
      const cuerpo = { tipo: p.tipo, datos: p.leer() };
      const editando = edicion && edicion.pantalla === nombre;
      const calculo = editando ? await api('PUT', `/calculos/${edicion.id}`, cuerpo) : await api('POST', '/calculos', cuerpo);
      mostrarResultado(nombre, calculo);
      if (editando) alert(`Cálculo #${calculo.id} actualizado.`);
    } catch (error) {
      alert(error.message);
    } finally {
      boton.disabled = false;
    }
  }

  window.calcMuro = () => calcular('muro');
  window.calcViga = () => calcular('viga');
  window.calcColumna = () => calcular('columna');
  window.calcContrapiso = () => calcular('contrapiso');
  window.calcTecho = () => calcular('techo');
  window.calcPisos = () => calcular('pisos');
  window.calcPintura = () => calcular('pintura');

  const pantallaRegistro = document.getElementById('screen-register');
  const regUsuario = pantallaRegistro.querySelector('input[type="text"]');
  const [regPassword, regConfirmar] = pantallaRegistro.querySelectorAll('input[type="password"]');
  pantallaRegistro.querySelector('.pill-btn').onclick = async (evento) => {
    const boton = evento.currentTarget;
    if (regPassword.value !== regConfirmar.value) return alert('Las contraseñas no coinciden.');
    boton.disabled = true;
    try {
      const r = await api('POST', '/auth/registro', { usuario: regUsuario.value, password: regPassword.value });
      Sesion.guardar(r.token, r.usuario, false);
      [regUsuario, regPassword, regConfirmar].forEach((input) => {
        input.value = '';
      });
      alert(`Cuenta creada. ¡Bienvenido, ${r.usuario.nombre}!`);
      mostrarPantalla('menu');
    } catch (error) {
      alert(error.message);
    } finally {
      boton.disabled = false;
    }
    return undefined;
  };

  const pantallaLogin = document.getElementById('screen-login');
  const loginUsuario = pantallaLogin.querySelector('input[type="text"]');
  const loginPassword = pantallaLogin.querySelector('input[type="password"]');
  const loginRecordar = pantallaLogin.querySelector('input[type="checkbox"]');
  pantallaLogin.querySelector('.pill-btn').onclick = async (evento) => {
    const boton = evento.currentTarget;
    boton.disabled = true;
    try {
      const r = await api('POST', '/auth/login', { usuario: loginUsuario.value, password: loginPassword.value });
      Sesion.guardar(r.token, r.usuario, loginRecordar.checked);
      loginPassword.value = '';
      mostrarPantalla('menu');
    } catch (error) {
      alert(error.message);
    } finally {
      boton.disabled = false;
    }
  };

  window.cambiarContrasena = async () => {
    if (!Sesion.token()) {
      alert('Por seguridad, primero inicia sesión. Luego toca 👤 en el menú para cambiar tu contraseña.');
      return mostrarPantalla('login');
    }
    const nueva = valor('nuevaContrasena');
    const confirmar = valor('confirmarContrasena');
    if (nueva === '' || confirmar === '') return alert('Por favor completa los dos campos.');
    if (nueva !== confirmar) return alert('Las contraseñas no coinciden.');
    try {
      const r = await api('PUT', '/auth/password', { nueva, confirmar });
      alert(r.mensaje);
      poner('nuevaContrasena', '');
      poner('confirmarContrasena', '');
      mostrarPantalla('menu');
    } catch (error) {
      alert(error.message);
    }
    return undefined;
  };

  const botonesMenu = document.querySelectorAll('#screen-menu .topbar .icon-btn');
  botonesMenu[0].onclick = () => mostrarPantalla('historial');
  botonesMenu[botonesMenu.length - 1].onclick = () => {
    const u = Sesion.usuario();
    const rol = u.rol === 'admin' ? 'Administrador' : 'Usuario';
    if (window.confirm(`Sesión iniciada como: ${u.nombre}\nPerfil: ${rol}\n\n¿Quieres cambiar tu contraseña?`)) {
      showScreenOriginal('recuperar');
    }
  };
  document.querySelector('#screen-menu .exit-pill').onclick = () => {
    Sesion.cerrar();
    mostrarPantalla('welcome');
  };

  const historial = document.createElement('div');
  historial.className = 'screen';
  historial.dataset.screen = 'historial';
  historial.id = 'screen-historial';
  historial.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" type="button" data-ir-menu aria-label="Volver">←</button>
      <h1>Mis cálculos</h1>
      <button class="icon-btn" type="button" data-ir-menu aria-label="Menú">🏠</button>
    </div>
    <div class="content">
      <div class="menu-heading">toca un cálculo para verlo o editarlo</div>
      <div id="listaCalculos" style="display:flex; flex-direction:column; gap:14px;"></div>
    </div>`;
  document.querySelector('.phone').appendChild(historial);
  historial.querySelectorAll('[data-ir-menu]').forEach((b) => {
    b.onclick = () => mostrarPantalla('menu');
  });

  async function cargarHistorial() {
    const lista = document.getElementById('listaCalculos');
    lista.innerHTML = '<div class="note-pill">Cargando...</div>';
    try {
      const calculos = await api('GET', '/calculos');
      const esAdmin = Sesion.usuario().rol === 'admin';
      if (calculos.length === 0) {
        lista.innerHTML = '<div class="note-pill">Aún no tienes cálculos guardados. Usa el menú para hacer el primero.</div>';
        return;
      }
      lista.innerHTML = calculos
        .map((c) => {
          const p = PANTALLAS[pantallaDeTipo(c.tipo)];
          return `
            <div class="menu-option" data-abrir="${c.id}">
              <span class="mo-icon">${p.icono}</span>
              <span class="mo-text">#${c.id} ${escapar(c.tipo)} · ${escapar(p.resumen(c.datos))}<br>
                <small style="font-weight:400;">${escapar(c.actualizado_en)}${esAdmin ? ` · ${escapar(c.usuario_nombre)}` : ''}</small>
              </span>
              <button class="icon-btn" type="button" data-borrar="${c.id}" aria-label="Eliminar cálculo ${c.id}">🗑️</button>
            </div>`;
        })
        .join('');
      lista.querySelectorAll('[data-abrir]').forEach((fila) => {
        fila.onclick = () => abrirCalculo(calculos.find((c) => c.id === Number(fila.dataset.abrir)));
      });
      lista.querySelectorAll('[data-borrar]').forEach((boton) => {
        boton.onclick = async (evento) => {
          evento.stopPropagation();
          if (!window.confirm(`¿Eliminar el cálculo #${boton.dataset.borrar}?`)) return;
          try {
            await api('DELETE', `/calculos/${boton.dataset.borrar}`);
            cargarHistorial();
          } catch (error) {
            alert(error.message);
          }
        };
      });
    } catch (error) {
      lista.innerHTML = `<div class="note-pill">${escapar(error.message)}</div>`;
    }
  }

  function abrirCalculo(calculo) {
    const nombre = pantallaDeTipo(calculo.tipo);
    mostrarPantalla(nombre);
    const boton = botonCalcular(nombre);
    edicion = { id: calculo.id, pantalla: nombre, textoOriginal: boton.innerHTML };
    PANTALLAS[nombre].escribir(calculo.datos);
    mostrarResultado(nombre, calculo);
    boton.textContent = `GUARDAR CAMBIOS #${calculo.id} 📋`;
  }

  if (Sesion.token()) mostrarPantalla('menu');
})();
