'use strict';

const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  test('responde 200 con el estado del servicio', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.servicio).toBe('notas-api');
  });
});

describe('GET /notas.js', () => {
  test('sirve el modulo de dominio para el modo estatico del front-end', async () => {
    const res = await request(app).get('/notas.js');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
    expect(res.text).toContain('globalThis.Notas');
    expect(res.text).toContain('function calcularPromedio');
  });
});

describe('POST /api/promedio', () => {
  test('devuelve promedio, letra y estado de aprobacion', async () => {
    const res = await request(app).post('/api/promedio').send({ notas: [90, 80, 100] });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ promedio: 90, letra: 'A', aprobado: true });
  });

  test('devuelve 400 cuando las notas son invalidas', async () => {
    const res = await request(app).post('/api/promedio').send({ notas: [90, 200] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Nota invalida/);
  });
});

describe('POST /api/promedio-ponderado', () => {
  test('calcula el ponderado de los rubros enviados', async () => {
    const res = await request(app)
      .post('/api/promedio-ponderado')
      .send({
        rubros: [
          { nota: 100, peso: 50 },
          { nota: 60, peso: 50 },
        ],
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.promedio).toBe(80);
    expect(res.body.letra).toBe('B');
  });

  test('devuelve 400 si los pesos no suman 100', async () => {
    const res = await request(app)
      .post('/api/promedio-ponderado')
      .send({ rubros: [{ nota: 100, peso: 30 }] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/deben sumar 100/);
  });
});

describe('POST /api/resumen', () => {
  test('devuelve el resumen estadistico del grupo', async () => {
    const res = await request(app).post('/api/resumen').send({ notas: [100, 70, 40] });
    expect(res.statusCode).toBe(200);
    expect(res.body.cantidad).toBe(3);
    expect(res.body.aprobados).toBe(2);
    expect(res.body.porcentajeAprobacion).toBe(66.67);
  });
});

describe('rutas inexistentes', () => {
  test('devuelve 404 con mensaje descriptivo', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Ruta no encontrada/);
  });
});
