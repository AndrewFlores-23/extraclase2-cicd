'use strict';

/**
 * Logica de dominio para el calculo de notas academicas.
 * Se mantiene libre de dependencias de Express para poder probarse
 * de forma unitaria y aislada dentro del pipeline de CI.
 */

const NOTA_MINIMA = 0;
const NOTA_MAXIMA = 100;
const NOTA_APROBACION = 70;

/**
 * Verifica que un valor sea una nota valida (numero finito entre 0 y 100).
 * @param {unknown} valor
 * @returns {boolean}
 */
function esNotaValida(valor) {
  return (
    typeof valor === 'number' &&
    Number.isFinite(valor) &&
    valor >= NOTA_MINIMA &&
    valor <= NOTA_MAXIMA
  );
}

/**
 * Redondea a dos decimales evitando errores de punto flotante.
 * @param {number} valor
 * @returns {number}
 */
function redondear(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula el promedio simple de un arreglo de notas.
 * @param {number[]} notas
 * @returns {number} promedio redondeado a dos decimales
 * @throws {Error} si el arreglo es invalido o contiene notas fuera de rango
 */
function calcularPromedio(notas) {
  if (!Array.isArray(notas) || notas.length === 0) {
    throw new Error('Se requiere un arreglo con al menos una nota');
  }

  const invalida = notas.find((nota) => !esNotaValida(nota));
  if (invalida !== undefined) {
    throw new Error(`Nota invalida: ${invalida}. El rango permitido es 0-100`);
  }

  const suma = notas.reduce((acc, nota) => acc + nota, 0);
  return redondear(suma / notas.length);
}

/**
 * Calcula el promedio ponderado a partir de rubros { nota, peso }.
 * La suma de los pesos debe ser exactamente 100.
 * @param {{nota:number, peso:number}[]} rubros
 * @returns {number}
 * @throws {Error} si los pesos no suman 100 o alguna nota es invalida
 */
function calcularPromedioPonderado(rubros) {
  if (!Array.isArray(rubros) || rubros.length === 0) {
    throw new Error('Se requiere un arreglo con al menos un rubro');
  }

  let sumaPesos = 0;
  let acumulado = 0;

  for (const rubro of rubros) {
    if (!rubro || !esNotaValida(rubro.nota)) {
      throw new Error('Cada rubro debe incluir una nota valida entre 0 y 100');
    }
    if (typeof rubro.peso !== 'number' || rubro.peso <= 0) {
      throw new Error('Cada rubro debe incluir un peso mayor que cero');
    }
    sumaPesos += rubro.peso;
    acumulado += rubro.nota * rubro.peso;
  }

  if (redondear(sumaPesos) !== 100) {
    throw new Error(`Los pesos deben sumar 100, se recibio ${redondear(sumaPesos)}`);
  }

  return redondear(acumulado / 100);
}

/**
 * Traduce una nota numerica a su escala literal institucional.
 * @param {number} nota
 * @returns {'A'|'B'|'C'|'D'|'F'}
 * @throws {Error} si la nota es invalida
 */
function convertirALetra(nota) {
  if (!esNotaValida(nota)) {
    throw new Error(`Nota invalida: ${nota}. El rango permitido es 0-100`);
  }
  if (nota >= 90) return 'A';
  if (nota >= 80) return 'B';
  if (nota >= 70) return 'C';
  if (nota >= 60) return 'D';
  return 'F';
}

/**
 * Indica si una nota alcanza la nota minima de aprobacion (70).
 * @param {number} nota
 * @returns {boolean}
 */
function estaAprobado(nota) {
  if (!esNotaValida(nota)) {
    throw new Error(`Nota invalida: ${nota}. El rango permitido es 0-100`);
  }
  return nota >= NOTA_APROBACION;
}

/**
 * Genera un resumen estadistico de un grupo de notas.
 * @param {number[]} notas
 * @returns {{cantidad:number, promedio:number, maxima:number, minima:number,
 *            aprobados:number, reprobados:number, porcentajeAprobacion:number}}
 */
function resumirGrupo(notas) {
  const promedio = calcularPromedio(notas);
  const aprobados = notas.filter((nota) => nota >= NOTA_APROBACION).length;

  return {
    cantidad: notas.length,
    promedio,
    maxima: Math.max(...notas),
    minima: Math.min(...notas),
    aprobados,
    reprobados: notas.length - aprobados,
    porcentajeAprobacion: redondear((aprobados / notas.length) * 100),
  };
}

module.exports = {
  NOTA_MINIMA,
  NOTA_MAXIMA,
  NOTA_APROBACION,
  esNotaValida,
  redondear,
  calcularPromedio,
  calcularPromedioPonderado,
  convertirALetra,
  estaAprobado,
  resumirGrupo,
};
