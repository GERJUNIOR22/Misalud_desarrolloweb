package com.utp.Citasmedicas.dto;

import java.math.BigDecimal;

// Especialidad que ve cualquier persona en la reserva en linea
public record EspecialidadPublica(Long idEspecialidad, String nombre, String descripcion, BigDecimal precio) {
}
