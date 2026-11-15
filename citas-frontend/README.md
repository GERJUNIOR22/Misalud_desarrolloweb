# Citas Medicas — Frontend (Angular 21)

Cliente web del sistema de citas medicas. Consume la API REST de Spring Boot (`../Citasmedicas`).

## Ejecutar

```bash
npm install     # solo la primera vez
npm start       # abre http://localhost:4200  (necesita el backend en http://localhost:8080)
```

## Otros comandos

```bash
npm test        # pruebas automaticas (Vitest)
npm run build   # compilacion de produccion en dist/
```

La direccion del backend se cambia en `src/app/config/api.ts`.
Las instrucciones completas (base de datos, backend y usuarios de ejemplo) estan en el `README.md` de la carpeta superior.

## Estructura de `src/app`

| Carpeta | Contenido |
|---|---|
| `layout/` | `layout-publico` (portada y reserva), `layout-personal` (menu del sistema), encabezado y pie |
| `pages/portada`, `reserva-en-linea`, `mi-cita` | **Publico**: pacientes sin cuenta reservan, pagan y consultan su cita |
| `pages/login` | Acceso del personal (administrador y medicos) |
| `pages/inicio`, `pagos`, `horarios`, `admin/` | **Personal**: inicio, caja, horarios, usuarios, especialidades, doctores y pacientes |
| `citas/` | Lista, tarjeta, detalle y reserva de citas (hecha por el personal) |
| `services/` | Llamadas HTTP al backend (`HttpClient`) y la sesion (`AuthService`) |
| `interceptors/` | `authInterceptor`: agrega el token JWT y cierra la sesion ante un 401 |
| `guards/` | `authGuard` (hay sesion) y `rolGuard` (rol permitido) |
| `models/` | Interfaces de los datos de la API |
| `utils/` | Validadores propios y conversion de errores HTTP en mensajes |
| `styles/` | Variables y mixins SCSS |

Rutas: `/` (portada), `/reservar`, `/mi-cita` y `/login` son publicas; el resto exige sesion.
