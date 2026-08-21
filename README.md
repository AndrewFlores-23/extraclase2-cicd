# Notas API - Extraclase 2: CI/CD con GitHub Actions

[![CI Pipeline](https://github.com/AndrewFlores-23/extraclase2-cicd/actions/workflows/ci.yml/badge.svg)](https://github.com/AndrewFlores-23/extraclase2-cicd/actions/workflows/ci.yml)
[![Matrix Tests](https://github.com/AndrewFlores-23/extraclase2-cicd/actions/workflows/matrix.yml/badge.svg)](https://github.com/AndrewFlores-23/extraclase2-cicd/actions/workflows/matrix.yml)
[![CD Pipeline](https://github.com/AndrewFlores-23/extraclase2-cicd/actions/workflows/cd.yml/badge.svg)](https://github.com/AndrewFlores-23/extraclase2-cicd/actions/workflows/cd.yml)

Universidad Nacional de Costa Rica &middot; Escuela de Informatica &middot; Programacion IV
Trabajo extraclase (5%) &middot; II Ciclo 2026
**Estudiante:** Andrew Manuel Corea Flores

API REST en Node.js + Express para el calculo de notas academicas, usada como
caso de estudio para implementar un pipeline completo de integracion y
despliegue continuo con GitHub Actions.

---

## 1. Descripcion de la aplicacion

`notas-api` expone endpoints para calcular promedios simples y ponderados,
convertir una nota a la escala literal (A-F) y generar un resumen estadistico
de un grupo. La logica de dominio vive en `src/lib/notas.js`, separada de la
capa HTTP, lo que permite probarla de forma unitaria y aislada.

### Endpoints

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `GET` | `/api/health` | Estado del servicio, version y commit desplegado. |
| `POST` | `/api/promedio` | Promedio simple. Body: `{ "notas": [90, 80, 100] }` |
| `POST` | `/api/promedio-ponderado` | Promedio ponderado. Body: `{ "rubros": [{ "nota": 90, "peso": 40 }, ...] }` (los pesos deben sumar 100) |
| `POST` | `/api/resumen` | Resumen estadistico del grupo. Body: `{ "notas": [...] }` |

Ademas se sirve una interfaz web estatica en `/` desde el directorio `public/`.

### Ejemplo

```bash
curl -X POST http://localhost:3000/api/resumen \
  -H "Content-Type: application/json" \
  -d '{"notas":[95,82,71,64,48]}'
```

```json
{
  "cantidad": 5,
  "promedio": 72,
  "maxima": 95,
  "minima": 48,
  "aprobados": 3,
  "reprobados": 2,
  "porcentajeAprobacion": 60
}
```

---

## 2. Ejecucion local

```bash
npm ci
npm run lint
npm test
npm start          # http://localhost:3000
```

Con Docker:

```bash
docker build -t notas-api .
docker run -p 3000:3000 notas-api
```

---

## 3. Estructura del repositorio

```
.github/
  workflows/
    ci.yml              # Ejercicio 1: integracion continua
    cd.yml              # Ejercicio 2: entrega/despliegue continuo
    matrix.yml          # Ejercicio 3: matriz de pruebas
src/
  lib/notas.js          # Logica de dominio (funciones puras)
  routes/notas.routes.js
  app.js                # Configuracion de Express
  server.js             # Punto de entrada
tests/
  notas.test.js         # 14 pruebas unitarias de la logica de dominio
  app.test.js           # 8 pruebas de integracion sobre la API
public/index.html       # Interfaz web
docs/                   # Evidencias y analisis comparativo
Dockerfile              # Build multietapa, usuario sin privilegios
eslint.config.js        # Configuracion flat de ESLint 9
package.json
```

---

## 4. Ejercicio 1 - Pipeline de CI (`ci.yml`)

| Requisito | Implementacion |
| --- | --- |
| Disparadores | `push` a `main` y `develop`, `pull_request` hacia `main`, y `workflow_dispatch` manual. |
| Linting | Job `lint` que ejecuta `npm run lint` (ESLint 9, flat config). |
| Pruebas unitarias | Job `test` con **22 pruebas** (minimo requerido: 5) sobre `jest`. |
| Cobertura como artifact | `actions/upload-artifact@v4` publica el directorio `coverage/` con retencion de 14 dias. |
| Notificaciones | Job `notify` con `if: always()` que escribe el resultado en el *job summary*, envia un embed a Discord si existe el secret `DISCORD_WEBHOOK` y falla el workflow si algun job previo fallo (status check rojo en el PR). |

El pipeline añade un job `build` que construye la imagen Docker y verifica que
el contenedor responda `200` en `/api/health` antes de considerar el commit
integrable.

Cobertura obtenida localmente:

```
Statements   : 100%   (78/78)
Branches     : 89.58% (43/48)
Functions    : 100%   (17/17)
Lines        : 100%   (71/71)
```

---

## 5. Ejercicio 2 - Pipeline de CD (`cd.yml`)

| Requisito | Implementacion |
| --- | --- |
| Disparador | `workflow_run` sobre el workflow `CI Pipeline`, tipo `completed`, rama `main`, con la guarda `github.event.workflow_run.conclusion == 'success'`. |
| Artefacto desplegable | Imagen Docker multietapa publicada en `ghcr.io` con las etiquetas `:<sha-corto>` y `:latest`, mas un bundle estatico subido como artifact. |
| Despliegue automatico | Job `deploy` que dispara el *deploy hook* de Render y ejecuta un smoke test contra `/api/health`. |
| Environment protegido | `environment: production` con regla de proteccion (revisor requerido) configurada en *Settings > Environments*. |
| Secrets | `RENDER_DEPLOY_HOOK` (secret) y `PRODUCTION_URL` (variable de entorno del environment). `GITHUB_TOKEN` se usa para autenticarse contra GHCR con `packages: write`. |

Un tercer job, `ci-fallido`, deja constancia en el resumen cuando el CI no
concluyo exitosamente y el despliegue se omite.

> **URL de produccion:** _(completar tras el despliegue)_

### Secrets y variables a configurar

| Nombre | Tipo | Ambito | Uso |
| --- | --- | --- | --- |
| `RENDER_DEPLOY_HOOK` | Secret | Environment `production` | URL del deploy hook de Render. |
| `PRODUCTION_URL` | Variable | Environment `production` | URL publica del servicio, usada en el smoke test. |
| `DISCORD_WEBHOOK` | Secret | Repositorio | Notificaciones de CI (opcional). |

---

## 6. Ejercicio 3 - Matriz de pruebas (`matrix.yml`)

```yaml
strategy:
  fail-fast: false
  max-parallel: 6
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, windows-latest]
    exclude:
      - node-version: 18
        os: windows-latest
    include:
      - node-version: 20
        os: ubuntu-latest
        principal: true
```

Resultado: **5 combinaciones** paralelas (3 versiones x 2 sistemas operativos,
menos una exclusion). `fail-fast: false` garantiza que todas se ejecuten aunque
alguna falle; `include` marca la combinacion Node 20 / Ubuntu como configuracion
de referencia para publicar la cobertura.

---

## 7. Seguridad del pipeline

- `permissions` declarado explicitamente por workflow siguiendo el principio de
  minimo privilegio (`contents: read`, y `packages: write` solo en el CD).
- Credenciales unicamente en GitHub Secrets, nunca en el codigo.
- Versiones de acciones fijadas por tag mayor (`@v4`, `@v5`); para un entorno de
  produccion real conviene fijarlas por SHA de commit.
- `concurrency` evita despliegues simultaneos a produccion.
- Imagen Docker ejecutada con un usuario sin privilegios (`USER app`).

---

## 8. Licencia

MIT.
