package com.utp.Citasmedicas.dto;

import com.utp.Citasmedicas.entity.MetodoPago;
import jakarta.validation.constraints.*;

public class PagoRequest {

    @NotBlank(message = "El codigo de la cita es obligatorio")
    private String codigoCita;

    @NotNull(message = "El metodo es obligatorio (EFECTIVO, TARJETA, YAPE, PLIN, TRANSFERENCIA)")
    private MetodoPago metodo;

    public PagoRequest() {
    }

    public String getCodigoCita() {
        return codigoCita;
    }

    public void setCodigoCita(String codigoCita) {
        this.codigoCita = codigoCita;
    }

    public MetodoPago getMetodo() {
        return metodo;
    }

    public void setMetodo(MetodoPago metodo) {
        this.metodo = metodo;
    }
}
