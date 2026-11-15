-- MIGRACION: los pacientes pasan a ser solo FICHAS, sin cuenta de usuario.
-- Ejecutar UNA vez en phpMyAdmin (pestana SQL) con la base citas_medicas seleccionada.
-- Se conservan los pacientes, sus citas y sus pagos. Solo se borran las cuentas con rol PACIENTE.
-- El personal (ADMIN y MEDICO) no se toca.

USE citas_medicas;

-- 1) Los pacientes dejan de apuntar a un usuario
UPDATE paciente
SET id_usuario = NULL
WHERE id_usuario IN (SELECT id_usuario FROM usuario WHERE rol = 'PACIENTE');

-- 2) Se eliminan las cuentas de pacientes
DELETE FROM usuario WHERE rol = 'PACIENTE';

-- Comprobacion: deben quedar solo ADMIN y MEDICO, y los pacientes con id_usuario NULL
SELECT rol, COUNT(*) AS cuentas FROM usuario GROUP BY rol;
SELECT dni, nombres, apellidos, id_usuario FROM paciente;
