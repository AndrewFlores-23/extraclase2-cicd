'use strict';

const {
  esNotaValida,
  redondear,
  calcularPromedio,
  calcularPromedioPonderado,
  convertirALetra,
  estaAprobado,
  resumirGrupo,
} = require('../src/lib/notas');

describe('esNotaValida', () => {
  test('acepta los limites del rango 0-100', () => {
    expect(esNotaValida(0)).toBe(true);
    expect(esNotaValida(100)).toBe(true);
    expect(esNotaValida(72.5)).toBe(true);
  });

  test('rechaza valores fuera de rango y tipos incorrectos', () => {
    expect(esNotaValida(-1)).toBe(false);
    expect(esNotaValida(101)).toBe(false);
    expect(esNotaValida('90')).toBe(false);
    expect(esNotaValida(NaN)).toBe(false);
    expect(esNotaValida(null)).toBe(false);
  });
});

describe('redondear', () => {
  test('redondea a dos decimales sin arrastrar error de punto flotante', () => {
    expect(redondear(1.005)).toBe(1.01);
    expect(redondear(83.333333)).toBe(83.33);
    expect(redondear(70)).toBe(70);
  });
});

describe('calcularPromedio', () => {
  test('calcula el promedio simple redondeado a dos decimales', () => {
    expect(calcularPromedio([80, 90, 100])).toBe(90);
    expect(calcularPromedio([70, 75, 81])).toBe(75.33);
  });

  test('lanza error cuando el arreglo esta vacio o no es arreglo', () => {
    expect(() => calcularPromedio([])).toThrow('al menos una nota');
    expect(() => calcularPromedio(null)).toThrow('al menos una nota');
  });

  test('lanza error cuando alguna nota esta fuera del rango permitido', () => {
    expect(() => calcularPromedio([80, 120])).toThrow('Nota invalida: 120');
    expect(() => calcularPromedio([80, -5])).toThrow('Nota invalida: -5');
  });
});

describe('calcularPromedioPonderado', () => {
  test('pondera correctamente los rubros cuando los pesos suman 100', () => {
    const rubros = [
      { nota: 90, peso: 40 },
      { nota: 80, peso: 35 },
      { nota: 70, peso: 25 },
    ];
    expect(calcularPromedioPonderado(rubros)).toBe(81.5);
  });

  test('rechaza rubros cuyos pesos no suman 100', () => {
    const rubros = [
      { nota: 90, peso: 40 },
      { nota: 80, peso: 40 },
    ];
    expect(() => calcularPromedioPonderado(rubros)).toThrow('deben sumar 100');
  });

  test('rechaza rubros con nota o peso invalidos', () => {
    expect(() => calcularPromedioPonderado([{ nota: 150, peso: 100 }])).toThrow('nota valida');
    expect(() => calcularPromedioPonderado([{ nota: 90, peso: 0 }])).toThrow('peso mayor que cero');
    expect(() => calcularPromedioPonderado([])).toThrow('al menos un rubro');
  });
});

describe('convertirALetra', () => {
  test('asigna la letra correcta en cada frontera de la escala', () => {
    expect(convertirALetra(95)).toBe('A');
    expect(convertirALetra(90)).toBe('A');
    expect(convertirALetra(89.99)).toBe('B');
    expect(convertirALetra(80)).toBe('B');
    expect(convertirALetra(70)).toBe('C');
    expect(convertirALetra(60)).toBe('D');
    expect(convertirALetra(59.99)).toBe('F');
  });

  test('lanza error ante una nota invalida', () => {
    expect(() => convertirALetra(-10)).toThrow('Nota invalida');
  });
});

describe('estaAprobado', () => {
  test('aprueba a partir de 70 y reprueba por debajo', () => {
    expect(estaAprobado(70)).toBe(true);
    expect(estaAprobado(69.99)).toBe(false);
    expect(estaAprobado(100)).toBe(true);
  });

  test('lanza error ante una nota invalida', () => {
    expect(() => estaAprobado('70')).toThrow('Nota invalida');
  });
});

describe('resumirGrupo', () => {
  test('genera el resumen estadistico completo del grupo', () => {
    expect(resumirGrupo([100, 85, 70, 65, 40])).toEqual({
      cantidad: 5,
      promedio: 72,
      maxima: 100,
      minima: 40,
      aprobados: 3,
      reprobados: 2,
      porcentajeAprobacion: 60,
    });
  });

  test('propaga el error de validacion de calcularPromedio', () => {
    expect(() => resumirGrupo([])).toThrow('al menos una nota');
  });
});
