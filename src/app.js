'use strict';

const path = require('path');
const express = require('express');
const notasRoutes = require('./routes/notas.routes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// La interfaz web carga el modulo de dominio directamente desde src/lib para
// no mantener una copia paralela del mismo codigo en public/.
app.get('/notas.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'lib', 'notas.js'));
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    servicio: 'notas-api',
    version: process.env.npm_package_version || '1.0.0',
    entorno: process.env.NODE_ENV || 'development',
    commit: process.env.GIT_SHA || 'local',
  });
});

app.use('/api', notasRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

module.exports = app;
