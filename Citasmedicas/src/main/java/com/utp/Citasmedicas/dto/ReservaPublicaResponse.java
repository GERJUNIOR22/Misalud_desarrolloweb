package com.utp.Citasmedicas.dto;

import com.utp.Citasmedicas.entity.Cita;
import com.utp.Citasmedicas.entity.Pago;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

// Resumen de una cita para el paciente SIN cuenta (reserva publica y consulta por codigo + DNI).
// Solo trae lo necesario: NO incluye el motivo ni la observacion del medico (datos de salud),
// ni correos o datos internos del doctor.
public record ReservaPublicaResponse(
        String codigoCita,
        String estadoCita,
        LocalDate fecha,
        LocalTime hora,
        LocalTime horaFin,
        String doctor,
        String especialidad,
        String paciente,
        String dniPaciente,
        BigDecimal monto,
        String metodoPago,
        String estadoPago,
        String numeroOperacion) {

    // "pago" puede ser null si la cita no tiene un pago vigente
    public static ReservaPublicaResponse de(Cita cita, Pago pago) {
        return new ReservaPublicaResponse(
                cita.getCodigo(),
                cita.getEstado().name(),
                cita.getFecha(),
                cita.getHora(),
                cita.getHoraFin(),
                "Dr. " + cita.getDoctor().getNombres() + " " + cita.getDoctor().getApellidos(),
                cita.getDoctor().getEspecialidad() != null ? cita.getDoctor().getEspecialidad().getNombre() : null,
                cita.getPaciente().getNombres() + " " + cita.getPaciente().getApellidos(),
                cita.getPaciente().getDni(),
                pago != null ? pago.getMonto() : null,
                pago != null ? pago.getMetodo().name() : null,
                pago != null ? pago.getEstado().name() : null,
                pago != null ? pago.getNumeroOperacion() : null);
    }
}
