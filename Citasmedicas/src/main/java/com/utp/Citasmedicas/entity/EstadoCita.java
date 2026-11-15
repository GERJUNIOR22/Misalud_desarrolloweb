package com.utp.Citasmedicas.entity;

// PENDIENTE -> CONFIRMADA -> COMPLETADA
//     |            |
//     +-> RECHAZADA +-> CANCELADA
public enum EstadoCita {
    PENDIENTE,
    CONFIRMADA,
    RECHAZADA,
    CANCELADA,
    COMPLETADA
}
