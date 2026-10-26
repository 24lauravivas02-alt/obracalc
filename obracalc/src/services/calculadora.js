class ErrorValidacion extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorValidacion';
    this.status = 400;
  }
}

function calcularSuperficie(lado1, lado2) {
  return lado1 * lado2;
}

function calcularVolumen(lado1, lado2, lado3) {
  return calcularSuperficie(lado1, lado2) * lado3;
}

function redondear(numero, decimales = 2) {
  const factor = 10 ** decimales;
  return Math.round((numero + Number.EPSILON) * factor) / factor;
}

function leerNumero(datos, campo, etiqueta) {
  const valor = datos ? datos[campo] : undefined;
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    throw new ErrorValidacion(`El campo "${etiqueta}" es obligatorio.`);
  }
  const numero = Number(String(valor).replace(',', '.'));
  if (!Number.isFinite(numero) || numero <= 0) {
    throw new ErrorValidacion(`El campo "${etiqueta}" debe ser un número mayor que 0.`);
  }
  if (numero > 100000) {
    throw new ErrorValidacion(`El campo "${etiqueta}" es demasiado grande.`);
  }
  return numero;
}

function material(nombre, cantidad, unidad, decimales = 2) {
  return { material: nombre, cantidad: redondear(cantidad, decimales), unidad };
}

function medida(etiqueta, valor, unidad) {
  return { etiqueta, valor: redondear(valor), unidad };
}

function calcularMuro(datos) {
  const espesor = Number(datos && datos.espesor);
  if (espesor !== 20 && espesor !== 30) {
    throw new ErrorValidacion('El espesor del muro debe ser 20 o 30 cm.');
  }
  const largo = leerNumero(datos, 'largo', 'Largo (m)');
  const alto = leerNumero(datos, 'alto', 'Alto (m)');
  const superficie = calcularSuperficie(largo, alto);
  const porMetro = espesor === 30
    ? { cemento: 15.2, arena: 0.115, ladrillos: 120 }
    : { cemento: 10.9, arena: 0.09, ladrillos: 90 };
  return {
    datos: { espesor, largo, alto },
    resultado: {
      medidas: [medida('Superficie del muro', superficie, 'm²')],
      materiales: [
        material('Cemento', superficie * porMetro.cemento, 'kg'),
        material('Arena', superficie * porMetro.arena, 'm³', 3),
        material('Ladrillos', Math.ceil(superficie * porMetro.ladrillos), 'unidades', 0),
      ],
    },
  };
}

function calcularViga(datos) {
  const largo = leerNumero(datos, 'largo', 'Largo (m)');
  return {
    datos: { largo },
    resultado: {
      medidas: [medida('Longitud de la viga', largo, 'm')],
      materiales: [
        material('Cemento', largo * 9, 'kg'),
        material('Arena', largo * 0.02, 'm³', 3),
        material('Piedra', largo * 0.02, 'm³', 3),
        material('Hierro del 8', largo * 4, 'm'),
        material('Hierro del 4', largo * 3, 'm'),
      ],
    },
  };
}

function calcularColumna(datos) {
  const largo = leerNumero(datos, 'largo', 'Largo (m)');
  return {
    datos: { largo },
    resultado: {
      medidas: [medida('Longitud de la columna', largo, 'm')],
      materiales: [
        material('Cemento', largo * 7.5, 'kg'),
        material('Arena', largo * 0.016, 'm³', 3),
        material('Piedra', largo * 0.016, 'm³', 3),
        material('Hierro del 10', largo * 6, 'm'),
        material('Hierro del 4', largo * 3, 'm'),
      ],
    },
  };
}

function calcularContrapiso(datos) {
  const espesor = leerNumero(datos, 'espesor', 'Espesor (cm)');
  const ancho = leerNumero(datos, 'ancho', 'Ancho (m)');
  const largo = leerNumero(datos, 'largo', 'Largo (m)');
  const volumen = calcularVolumen(ancho, largo, espesor / 100);
  return {
    datos: { espesor, ancho, largo },
    resultado: {
      medidas: [
        medida('Superficie', calcularSuperficie(ancho, largo), 'm²'),
        medida('Volumen del contrapiso', volumen, 'm³'),
      ],
      materiales: [
        material('Cemento', volumen * 105, 'kg'),
        material('Arena', volumen * 0.45, 'm³', 3),
        material('Piedra', volumen * 0.9, 'm³', 3),
      ],
    },
  };
}

function calcularTecho(datos) {
  const espesor = leerNumero(datos, 'espesor', 'Espesor (cm)');
  const ancho = leerNumero(datos, 'ancho', 'Ancho (m)');
  const largo = leerNumero(datos, 'largo', 'Largo (m)');
  const superficie = calcularSuperficie(ancho, largo);
  return {
    datos: { espesor, ancho, largo },
    resultado: {
      medidas: [
        medida('Superficie del techo', superficie, 'm²'),
        medida('Volumen de la losa', calcularVolumen(ancho, largo, espesor / 100), 'm³'),
      ],
      materiales: [
        material('Cemento', superficie * 33, 'kg'),
        material('Arena', superficie * 0.072, 'm³', 3),
        material('Piedra', superficie * 0.072, 'm³', 3),
        material('Hierro del 8', superficie * 7, 'm'),
        material('Hierro del 6', superficie * 4, 'm'),
      ],
    },
  };
}

function calcularPiso(datos) {
  const ancho = leerNumero(datos, 'ancho', 'Ancho (m)');
  const largo = leerNumero(datos, 'largo', 'Largo (m)');
  const superficie = calcularSuperficie(ancho, largo);
  const conRecortes = superficie * 1.1;
  return {
    datos: { ancho, largo },
    resultado: {
      medidas: [
        medida('Superficie del piso', superficie, 'm²'),
        medida('Extra por recortes (10%)', conRecortes - superficie, 'm²'),
      ],
      materiales: [material('Piso a comprar (incluye 10%)', conRecortes, 'm²')],
    },
  };
}

function calcularPintura(datos) {
  const superficie = leerNumero(datos, 'superficie', 'Superficie (m²)');
  const litros = superficie / 6;
  return {
    datos: { superficie },
    resultado: {
      medidas: [medida('Superficie a pintar', superficie, 'm²')],
      materiales: [material('Pintura', litros, 'litros')],
    },
  };
}

const TIPOS = {
  muro: {
    numero: 1,
    nombre: 'Muro de ladrillo',
    campos: [
      { nombre: 'espesor', etiqueta: 'Espesor (cm)', opciones: [20, 30] },
      { nombre: 'largo', etiqueta: 'Largo (m)' },
      { nombre: 'alto', etiqueta: 'Alto (m)' },
    ],
    calcular: calcularMuro,
  },
  viga: {
    numero: 2,
    nombre: 'Viga de hormigón',
    campos: [{ nombre: 'largo', etiqueta: 'Largo (m)' }],
    calcular: calcularViga,
  },
  columna: {
    numero: 3,
    nombre: 'Columnas de hormigón',
    campos: [{ nombre: 'largo', etiqueta: 'Largo (m)' }],
    calcular: calcularColumna,
  },
  contrapiso: {
    numero: 4,
    nombre: 'Contrapisos',
    campos: [
      { nombre: 'espesor', etiqueta: 'Espesor (cm)' },
      { nombre: 'ancho', etiqueta: 'Ancho (m)' },
      { nombre: 'largo', etiqueta: 'Largo (m)' },
    ],
    calcular: calcularContrapiso,
  },
  techo: {
    numero: 5,
    nombre: 'Techo',
    campos: [
      { nombre: 'espesor', etiqueta: 'Espesor (cm)' },
      { nombre: 'ancho', etiqueta: 'Ancho (m)' },
      { nombre: 'largo', etiqueta: 'Largo (m)' },
    ],
    calcular: calcularTecho,
  },
  piso: {
    numero: 6,
    nombre: 'Pisos',
    campos: [
      { nombre: 'ancho', etiqueta: 'Ancho (m)' },
      { nombre: 'largo', etiqueta: 'Largo (m)' },
    ],
    calcular: calcularPiso,
  },
  pintura: {
    numero: 7,
    nombre: 'Pintura',
    campos: [{ nombre: 'superficie', etiqueta: 'Superficie (m²)' }],
    calcular: calcularPintura,
  },
};

function calcular(tipo, datos) {
  const calculadora = Object.prototype.hasOwnProperty.call(TIPOS, tipo) ? TIPOS[tipo] : null;
  if (!calculadora) {
    throw new ErrorValidacion('Tipo de cálculo no válido.');
  }
  return calculadora.calcular(datos || {});
}

function listarTipos() {
  return Object.entries(TIPOS).map(([clave, info]) => ({
    tipo: clave,
    numero: info.numero,
    nombre: info.nombre,
    campos: info.campos,
  }));
}

function existeTipo(tipo) {
  return Object.prototype.hasOwnProperty.call(TIPOS, tipo);
}

module.exports = { calcular, listarTipos, existeTipo, ErrorValidacion };
