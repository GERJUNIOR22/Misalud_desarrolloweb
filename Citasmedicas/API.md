# API Mi salud (contrato para el frontend)

Base: `http://localhost:8080` · Auth del personal: `Authorization: Bearer <token>` (dura 1 hora)
Roles con cuenta: `ADMIN` y `MEDICO`. **Los pacientes no tienen cuenta**: son solo fichas en la tabla `paciente`
y reservan por los endpoints públicos. CORS permitido para `http://localhost:4200` (cambia con `CORS_ORIGINS`).

## Variables de entorno (opcionales en desarrollo)
`DB_USER` (root) · `DB_PASSWORD` (vacía) · `JWT_SECRET` (obligatoria en producción, 32+ caracteres) · `CORS_ORIGINS` · `DDL_AUTO` (update) · `DB_DIALECT` (MariaDBDialect)

## Errores (siempre JSON)
```json
{ "mensaje": "texto para mostrar" }
{ "mensaje": "primer error", "errores": { "campo": "detalle" } }   // validaciones (400)
```
Códigos: 400 regla/validación · 401 sin token o vencido · 403 sin permiso · 404 no existe · 409 conflicto simultáneo.

## Público (sin login): reserva en línea
| Método y ruta | Notas |
|---|---|
| `GET /api/publico/especialidades` | Solo las activas, con `precio` |
| `GET /api/publico/doctores?idEspecialidad=1` | Sin correo ni datos de la cuenta del doctor |
| `GET /api/publico/disponibilidad?colegiatura=&fecha=AAAA-MM-DD` | `[{hora, horaFin, disponible}]` |
| `POST /api/publico/reservas` | **Reserva + pago en una sola transacción.** Si algo falla no queda nada guardado |
| `GET /api/publico/citas/{codigo}?dni=` | Consulta con código **y** DNI (deben coincidir). No devuelve el motivo ni datos de salud |

`POST /api/publico/reservas`:
```json
{ "dni": "70112233", "nombres": "Maria", "apellidos": "Lopez", "telefono": "912345678",
  "colegiaturaDoctor": "045821", "fecha": "2026-11-20", "hora": "08:30:00",
  "motivo": "Control", "metodo": "YAPE" }
```
- **No se envía el monto**: lo calcula el servidor con el precio de la especialidad.
- `metodo`: `TARJETA`, `YAPE`, `PLIN` o `TRANSFERENCIA` (no se acepta `EFECTIVO`: se paga antes de reservar). El pago es **simulado**.
- Si el DNI ya existe se reutiliza su ficha (sin sobrescribir sus datos); si no, se crea **sin usuario**.
- Respuesta 201: `{codigoCita, estadoCita, fecha, hora, horaFin, doctor, especialidad, paciente, dniPaciente, monto, metodoPago, estadoPago, numeroOperacion}`.

## Personal
| Método y ruta | Quién | Notas |
|---|---|---|
| `POST /auth/login` `{correo,password}` | público | → `{token, correo, rol}`. Una cuenta con rol `PACIENTE` (antigua) recibe **403** |
| `GET /auth/perfil` | personal | |
| `GET /api/especialidades`, `/activas`, `/{id}` | personal | incluyen `precio` |
| `POST/PUT /api/especialidades` `{nombre,descripcion,precio}` | ADMIN | |
| `PUT /api/especialidades/{id}/estado?activo=` | ADMIN | |
| `GET /api/doctores`, `/{col}`, `/especialidad/{nombre}` | personal | |
| `GET /api/doctores/mi-perfil` | MEDICO | |
| `POST/PUT /api/doctores` | ADMIN | crea el doctor y su cuenta de MEDICO |
| `GET /api/horarios/doctor/{col}` | personal | solo activos |
| `GET /api/horarios` | ADMIN | todos |
| `GET/POST /api/horarios/mis-horarios` | MEDICO | |
| `POST /api/horarios` | ADMIN | |
| `PUT /api/horarios/{id}/estado?activo=` | ADMIN, MEDICO dueño | |
| `GET /api/citas/disponibilidad?colegiatura=&fecha=` | personal | |
| `GET /api/citas?colegiatura=&dni=&fecha=&estado=` | ADMIN | filtros opcionales |
| `GET /api/citas/{codigo}` | ADMIN, o el MEDICO dueño | |
| `GET /api/citas/mis-citas` | MEDICO | su agenda |
| `POST /api/citas` `{dniPaciente, colegiaturaDoctor, fecha, hora, motivo}` | ADMIN, MEDICO | el paciente debe tener ficha; el MEDICO solo en su propia agenda |
| `PUT /api/citas/{codigo}/estado` `{estado, observacion?}` | ADMIN, MEDICO | el MEDICO confirma, rechaza o completa (no cancela) |
| `POST /api/pagos` `{codigoCita, metodo}` | ADMIN | cobro en caja; el monto lo calcula el servidor |
| `GET /api/pagos`, `/resumen`, `/cita/{codigo}` | ADMIN | |
| `PUT /api/pagos/{id}/estado?estado=` | ADMIN | confirma o rechaza un pago pendiente |
| `GET /api/usuarios` | ADMIN | solo personal, sin contraseñas |
| `PUT /api/usuarios/{id}/estado?activo=` | ADMIN | |
| `GET /api/pacientes`, `/{dni}`, `PUT /{dni}` | ADMIN | fichas de pacientes |

Fechas `"2026-11-20"` · horas `"09:30"` o `"09:30:00"`. No existe registro público: las cuentas del personal las crea el ADMIN.

## Migración de datos antiguos
Si tu base ya tenía cuentas de pacientes, ejecuta una vez `migracion_pacientes_sin_cuenta.sql` en phpMyAdmin:
los pacientes pasan a ser solo fichas (se conservan sus citas y pagos) y se borran las cuentas con rol `PACIENTE`.
