package com.utp.Citasmedicas.dto;

import com.utp.Citasmedicas.entity.EstadoCita;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CambioEstadoRequest {

    @NotNull(message = "El estado es obligatorio (CONFIRMADA, RECHAZADA, CANCELADA, COMPLETADA)")
    private EstadoCita estado;

    // Opcional: ej. "Paciente con presion alta, volver en 1 mes"
    @Size(max = 300, message = "La observacion no puede pasar de 300 letras")
    private String observacion;

    public CambioEstadoRequest() {
    }

    public EstadoCita getEstado() {
        return estado;
    }

    public void setEstado(EstadoCita estado) {
        this.estado = estado;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }
}
