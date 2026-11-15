DROP DATABASE IF EXISTS citas_medicas;
CREATE DATABASE citas_medicas;
USE citas_medicas;

CREATE TABLE usuario (
    id_usuario  BIGINT AUTO_INCREMENT PRIMARY KEY,
    correo      VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    rol         VARCHAR(20)  NOT NULL,
    activo      BIT(1)       NOT NULL
);

CREATE TABLE especialidad (
    id_especialidad  BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL UNIQUE,
    descripcion      VARCHAR(255),
    precio           DECIMAL(10,2) NOT NULL DEFAULT 0,
    activo           BIT(1) NOT NULL
);

CREATE TABLE doctor (
    colegiatura      VARCHAR(10) NOT NULL PRIMARY KEY,
    nombres          VARCHAR(60) NOT NULL,
    apellidos        VARCHAR(60) NOT NULL,
    telefono         VARCHAR(15),
    id_especialidad  BIGINT,
    id_usuario       BIGINT UNIQUE,
    FOREIGN KEY (id_especialidad) REFERENCES especialidad(id_especialidad),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE paciente (
    dni               VARCHAR(8)  NOT NULL PRIMARY KEY,
    nombres           VARCHAR(60) NOT NULL,
    apellidos         VARCHAR(60) NOT NULL,
    fecha_nacimiento  DATE,
    telefono          VARCHAR(15),
    id_usuario        BIGINT UNIQUE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE horario_medico (
    id_horario          BIGINT AUTO_INCREMENT PRIMARY KEY,
    colegiatura_doctor  VARCHAR(10) NOT NULL,
    dia_semana          VARCHAR(10) NOT NULL,
    hora_inicio         TIME NOT NULL,
    hora_fin            TIME NOT NULL,
    activo              BIT(1) NOT NULL,
    FOREIGN KEY (colegiatura_doctor) REFERENCES doctor(colegiatura)
);

CREATE TABLE cita (
    codigo              VARCHAR(10)  NOT NULL PRIMARY KEY,
    colegiatura_doctor  VARCHAR(10)  NOT NULL,
    dni_paciente        VARCHAR(8)   NOT NULL,
    fecha               DATE         NOT NULL,
    hora                TIME         NOT NULL,
    duracion_minutos    INT          NOT NULL DEFAULT 30,
    motivo              VARCHAR(200) NOT NULL,
    estado              VARCHAR(15)  NOT NULL,
    observacion         VARCHAR(300),
    FOREIGN KEY (colegiatura_doctor) REFERENCES doctor(colegiatura),
    FOREIGN KEY (dni_paciente) REFERENCES paciente(dni)
);

CREATE TABLE pago (
    id_pago           BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo_cita       VARCHAR(10)   NOT NULL,
    monto             DECIMAL(10,2) NOT NULL,
    metodo            VARCHAR(15)   NOT NULL,
    estado            VARCHAR(12)   NOT NULL,
    fecha_pago        DATETIME(6)   NOT NULL,
    numero_operacion  VARCHAR(30),
    FOREIGN KEY (codigo_cita) REFERENCES cita(codigo)
);

INSERT INTO usuario (id_usuario, correo, password, rol, activo) VALUES
(1, 'admin@clinica.pe', '$2a$10$d8ftAWR2pez0MS.iUWT0X.NhmlfscgcRvRkjPvrbXwNA8.wUVcavS', 'ADMIN', 1),
(2, 'cramirez@clinica.pe', '$2a$10$gMh.Dh80x7iPi.nun5ukSeGJ7xin/Tp1LGUC3owUEmnL/Ju1xMicy', 'MEDICO', 1),
(3, 'lfernandez@clinica.pe', '$2a$10$kcUIDaZYKXIvio/.daEliegFZrz6D.MWEOz98h5IK283mjobiIVt.', 'MEDICO', 1),
(4, 'jmendoza@clinica.pe', '$2a$10$dMJ8ojjyrgIUtL39cotQVOPTY2RZS790GHZdza.XzeI7P.AJMmSzK', 'MEDICO', 1),
(8, 'rsalazar@clinica.pe', '$2a$10$Je34QnjtxNx8tnGl3FyJFeKWuUbBQ.AjeL9TZ5wfBydKAVCJW7.xS', 'MEDICO', 1),
(9, 'mrojas@clinica.pe', '$2a$10$OXi/LLSa33xMDLkCBIqfk.QmOseKg6/hEjzmQTJmU2p7fHWWbzwoC', 'MEDICO', 1);

INSERT INTO especialidad (id_especialidad, nombre, descripcion, precio, activo) VALUES
(1, 'Cardiologia', 'Corazon y presion arterial', 120.00, 1),
(2, 'Pediatria', 'Atencion de niños', 80.00, 1),
(3, 'Medicina General', 'Consulta general', 60.00, 1),
(4, 'Dermatologia', 'Piel, cabello y uñas', 100.00, 1),
(5, 'Traumatologia', 'Huesos y fracturas', 110.00, 1);

INSERT INTO doctor (colegiatura, nombres, apellidos, telefono, id_especialidad, id_usuario) VALUES
('045821', 'Carlos Alberto', 'Ramirez Torres', '987654321', 1, 2),
('052347', 'Lucia', 'Fernandez Quispe', '976543210', 2, 3),
('038914', 'Jorge Luis', 'Mendoza Rojas', '965432109', 3, 4),
('061234', 'Rosa Elena', 'Salazar Paredes', '954321098', 4, 8),
('067890', 'Miguel Angel', 'Rojas Vega', '945678123', 3, 9);

INSERT INTO paciente (dni, nombres, apellidos, fecha_nacimiento, telefono, id_usuario) VALUES
('71234567', 'Ana Maria', 'Gonzales Huaman', '1998-05-14', '999888777', NULL),
('72345678', 'Pedro', 'Castillo Vargas', '1985-11-02', '923456789', NULL),
('73456789', 'Luis', 'Perez Soto', '2000-03-10', '934567890', NULL);

INSERT INTO horario_medico (colegiatura_doctor, dia_semana, hora_inicio, hora_fin, activo) VALUES
('045821', 'LUNES', '08:00', '13:00', 1),
('045821', 'MARTES', '08:00', '13:00', 1),
('045821', 'MIERCOLES', '08:00', '13:00', 1),
('052347', 'MARTES', '14:00', '19:00', 1),
('052347', 'JUEVES', '14:00', '19:00', 1),
('038914', 'LUNES', '08:00', '12:00', 1),
('038914', 'MIERCOLES', '08:00', '12:00', 1),
('038914', 'VIERNES', '08:00', '12:00', 1),
('061234', 'VIERNES', '09:00', '13:00', 1),
('067890', 'SABADO', '08:00', '12:00', 1),
('067890', 'SABADO', '14:00', '17:00', 1);

INSERT INTO cita (codigo, colegiatura_doctor, dni_paciente, fecha, hora, duracion_minutos, motivo, estado, observacion) VALUES
('CIT-00001', '045821', '71234567', '2026-10-20', '09:00', 30, 'Control de presion arterial', 'PENDIENTE', NULL),
('CIT-00002', '038914', '72345678', '2026-10-21', '10:30', 30, 'Dolor de cabeza frecuente', 'PENDIENTE', NULL),
('CIT-00003', '045821', '71234567', '2026-10-20', '10:00', 30, 'Dolor de pecho', 'PENDIENTE', NULL),
('CIT-00004', '045821', '71234567', '2026-10-26', '11:00', 30, 'Control', 'COMPLETADA', 'Presion normal, volver en 3 meses'),
('CIT-00005', '045821', '71234567', '2026-10-26', '12:00', 30, 'Chequeo', 'CONFIRMADA', NULL);

INSERT INTO pago (codigo_cita, monto, metodo, estado, fecha_pago, numero_operacion) VALUES
('CIT-00004', 80.00, 'YAPE', 'COMPLETADO', '2026-10-12 00:45:26', 'OP-20261012004526'),
('CIT-00005', 50.00, 'EFECTIVO', 'COMPLETADO', '2026-10-12 00:56:44', 'OP-20261012005927');
