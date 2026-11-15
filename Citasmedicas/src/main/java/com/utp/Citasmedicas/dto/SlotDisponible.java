package com.utp.Citasmedicas.dto;

import java.time.LocalTime;

// Un espacio de la agenda de un doctor en una fecha (para pintar el calendario en el frontend)
public record SlotDisponible(LocalTime hora, LocalTime horaFin, boolean disponible) {
}
