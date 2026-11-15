# Mi salud: sistema de citas medicas

Proyecto del curso **Desarrollo Web Integrado** (UTP).

- **Backend:** `Citasmedicas/` — Spring Boot 4, Spring Security con JWT, JPA y MySQL (XAMPP).
- **Frontend:** `citas-frontend/` — Angular 21, formularios reactivos, SCSS.

## Requisitos

| Herramienta | Version | Comprobar con |
|---|---|---|
| Java (JDK) | 21 | `java -version` |
| Node.js | 20 o superior | `node -v` |
| Angular CLI | 21 | `ng version` |
| XAMPP (MySQL/MariaDB) | cualquiera reciente | panel de XAMPP |

Si falta Angular CLI: `npm install -g @angular/cli`.

## Como ejecutarlo (3 terminales/pasos)

### 1. Base de datos
1. Abre el panel de **XAMPP** y pulsa **Start** en **MySQL**.
2. Entra a `http://localhost/phpmyadmin` → pestana **Importar** → elige `Citasmedicas/citas_medicas.sql` → **Importar**.
   (El script borra y crea la base `citas_medicas` con datos de ejemplo.)
3. **Si ya tenias la base de antes** (con cuentas de pacientes), en vez de reimportar ejecuta una vez
   `Citasmedicas/migracion_pacientes_sin_cuenta.sql` en la pestana **SQL**: los pacientes pasan a ser solo fichas
   y se conservan sus citas y pagos.

### 2. Backend (puerto 8080)
Desde la carpeta del proyecto:

```bash
cd Citasmedicas
./mvnw spring-boot:run
```

En PowerShell o CMD usa `.\mvnw.cmd spring-boot:run`. Tambien puedes ejecutar `CitasmedicasApplication` desde IntelliJ.
Cuando veas `Started CitasmedicasApplication`, el backend esta listo en `http://localhost:8080`.

### 3. Frontend (puerto 4200)
En **otra** terminal:

```bash
cd citas-frontend
npm install
npm start
```

`npm install` solo hace falta la primera vez (o si falta la carpeta `node_modules`).
Abre `http://localhost:4200`. El navegador se recarga solo cada vez que guardas un archivo.

## Como se usa

**Pacientes (sin cuenta, sin login):** entran a `http://localhost:4200`, eligen **Reservar cita**, escogen
especialidad, doctor y horario, dejan sus datos (DNI, nombres, telefono) y **pagan** el precio de la especialidad
(pago simulado). La cita solo queda reservada si el pago se aprueba. Reciben un codigo (`CIT-00007`) y pueden
consultarla despues con ese codigo y su DNI. Sus datos quedan solo en la ficha del paciente: **no se crea ningun usuario**.

**Personal:** el boton **Soy trabajador** lleva al login. No hay registro publico: las cuentas las crea el administrador
(al registrar un doctor se crea tambien su cuenta de medico).

| Rol | Correo de ejemplo |
|---|---|
| ADMIN | `admin@clinica.pe` |
| MEDICO | `cramirez@clinica.pe` (tambien `lfernandez`, `jmendoza`, `rsalazar`, `mrojas`) |

Las contrasenas de ejemplo estan cifradas en `citas_medicas.sql`; usa las que definiste para desarrollo.

## Que puede hacer cada rol

| Rol | Funciones |
|---|---|
| **Paciente** (sin cuenta) | Reservar y pagar en linea, consultar su cita con codigo + DNI |
| **MEDICO** | Ver su agenda, confirmar / rechazar / completar citas (con observacion), reservar controles en su propia agenda, gestionar sus horarios |
| **ADMIN** | Todas las citas, caja (cobrar citas atendidas, confirmar/rechazar pagos), usuarios del personal, especialidades con precio, doctores, horarios de cualquier doctor, fichas de pacientes |

## Pruebas automaticas

```bash
# Backend (necesita MySQL de XAMPP encendido; usa la base aparte citas_medicas_test)
cd Citasmedicas
./mvnw test

# Frontend
cd citas-frontend
npm test
```

## Variables de entorno del backend (opcionales)

| Variable | Para que sirve | Valor por defecto |
|---|---|---|
| `DB_USER` / `DB_PASSWORD` | Usuario y clave de MySQL | `root` / vacia |
| `JWT_SECRET` | Clave para firmar los tokens (32+ caracteres; **obligatoria en produccion**) | clave de desarrollo |
| `CORS_ORIGINS` | Origenes del frontend permitidos | `http://localhost:4200` |
| `DB_DIALECT` | Dialecto de Hibernate (usa `org.hibernate.dialect.MySQLDialect` si tienes MySQL 8 en vez de XAMPP) | `MariaDBDialect` |

La documentacion de los endpoints esta en `Citasmedicas/API.md`.

## Problemas frecuentes

- **"No hay conexion con el servidor"** en el login: el backend no esta encendido o MySQL esta apagado.
- **Puerto 8080 u 4200 ocupado:** cierra el proceso anterior (`Ctrl + C` en su terminal) o cambia el puerto.
- **`ng` no se reconoce:** instala Angular CLI (`npm install -g @angular/cli`) y reabre la terminal.
- **Error de CORS en el navegador:** el frontend debe correr en `http://localhost:4200` (o ajusta `CORS_ORIGINS`).
