package com.utp.Citasmedicas.entity;

import java.time.DayOfWeek;

public enum DiaSemana {
    LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO;

    // Convierte el dia de Java (MONDAY...) a nuestro dia (LUNES...)
    public static DiaSemana de(DayOfWeek dia) {
        return values()[dia.getValue() - 1];
    }
}
