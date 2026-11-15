package com.utp.Citasmedicas.dto;

import java.time.LocalDate;

// Respuesta de GET /api/pacientes/consulta-dni/{dni}
// origen = "FICHA"  -> el paciente ya existe en la base de datos
// origen = "RENIEC" -> no tiene ficha; los datos vienen de RENIEC (se crea la ficha al reservar)
public record DatosDni(
        String dni,
        String nombres,
        String apellidos,
        LocalDate fechaNacimiento,
        String telefono,
        String origen
) {
}
