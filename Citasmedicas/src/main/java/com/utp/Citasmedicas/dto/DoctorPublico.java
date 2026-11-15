package com.utp.Citasmedicas.dto;

// Doctor que ve cualquier persona en la reserva en linea: SIN correo ni datos de su cuenta
public record DoctorPublico(String colegiatura, String nombres, String apellidos,
                            Long idEspecialidad, String especialidad) {
}
