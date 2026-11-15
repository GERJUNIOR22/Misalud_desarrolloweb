package com.utp.Citasmedicas.dto;

import com.utp.Citasmedicas.entity.MetodoPago;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalTime;

// Reserva PUBLICA (sin login): datos del paciente + la cita + el pago, todo en una sola peticion
public class ReservaPublicaRequest {

    // --- Paciente ---
    @NotBlank(message = "El DNI es obligatorio")
    @Pattern(regexp = "\\d{8}", message = "El DNI debe tener 8 digitos")
    private String dni;

    @NotBlank(message = "Los nombres son obligatorios")
    @Size(max = 60, message = "Los nombres no pueden pasar de 60 letras")
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(max = 60, message = "Los apellidos no pueden pasar de 60 letras")
    private String apellidos;

    @NotBlank(message = "El telefono es obligatorio")
    @Pattern(regexp = "\\d{9}", message = "El telefono debe tener 9 digitos")
    private String telefono;

    // --- Cita ---
    @NotBlank(message = "La colegiatura del doctor es obligatoria")
    private String colegiaturaDoctor;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @NotNull(message = "La hora es obligatoria")
    private LocalTime hora;

    @NotBlank(message = "El motivo es obligatorio")
    @Size(max = 200, message = "El motivo no puede pasar de 200 letras")
    private String motivo;

    // --- Pago (se paga ANTES de reservar; el monto lo calcula el servidor) ---
    @NotNull(message = "El metodo de pago es obligatorio (TARJETA, YAPE, PLIN o TRANSFERENCIA)")
    private MetodoPago metodo;

    public ReservaPublicaRequest() {
    }

    public String getDni() {
        return dni;
    }

    public void setDni(String dni) {
        this.dni = dni;
    }

    public String getNombres() {
        return nombres;
    }

    public void setNombres(String nombres) {
        this.nombres = nombres;
    }

    public String getApellidos() {
        return apellidos;
    }

    public void setApellidos(String apellidos) {
        this.apellidos = apellidos;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getColegiaturaDoctor() {
        return colegiaturaDoctor;
    }

    public void setColegiaturaDoctor(String colegiaturaDoctor) {
        this.colegiaturaDoctor = colegiaturaDoctor;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public LocalTime getHora() {
        return hora;
    }

    public void setHora(LocalTime hora) {
        this.hora = hora;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public MetodoPago getMetodo() {
        return metodo;
    }

    public void setMetodo(MetodoPago metodo) {
        this.metodo = metodo;
    }
}
