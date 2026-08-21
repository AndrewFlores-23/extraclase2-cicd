'use strict';

const express = require('express');
const {
  calcularPromedio,
  calcularPromedioPonderado,
  convertirALetra,
  estaAprobado,
  resumirGrupo,
} = require('../lib/notas');

const router = express.Router();

/**
 * Envuelve un handler para traducir los errores de dominio en respuestas 400.
 * @param {(req: express.Request, res: express.Response) => void} handler
 */
function manejar(handler) {
  return (req, res) => {
    try {
      handler(req, res);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
}

router.post(
  '/promedio',
  manejar((req, res) => {
    const { notas } = req.body || {};
    const promedio = calcularPromedio(notas);
    res.json({
      promedio,
      letra: convertirALetra(promedio),
      aprobado: estaAprobado(promedio),
    });
  })
);

router.post(
  '/promedio-ponderado',
  manejar((req, res) => {
    const { rubros } = req.body || {};
    const promedio = calcularPromedioPonderado(rubros);
    res.json({
      promedio,
      letra: convertirALetra(promedio),
      aprobado: estaAprobado(promedio),
    });
  })
);

router.post(
  '/resumen',
  manejar((req, res) => {
    const { notas } = req.body || {};
    res.json(resumirGrupo(notas));
  })
);

module.exports = router;
