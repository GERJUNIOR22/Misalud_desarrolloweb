package com.utp.Citasmedicas.entity;

public enum EstadoPago {
    PENDIENTE,    // efectivo: falta pagar en caja
    COMPLETADO,   // ya se pago
    RECHAZADO     // no se acepto el pago
}
