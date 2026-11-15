package com.utp.Citasmedicas.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalTime;

public class CitaRequest {

    @NotBlank(message = "La colegiatura del doctor es obligatoria")
    private String colegiaturaDoctor;

    // Lo manda el personal (ADMIN o MEDICO) al reservar para un paciente
    private String dniPaciente;

    // Datos del paciente: solo se usan si el DNI todavia NO tiene ficha (se crea al reservar)
    @Size(max = 60, message = "Los nombres no pueden pasar de 60 letras")
    private String nombresPaciente;

    @Size(max = 60, message = "Los apellidos no pueden pasar de 60 letras")
    private String apellidosPaciente;

    @Past(message = "La fecha de nacimiento debe ser anterior a hoy")
    private LocalDate fechaNacimientoPaciente;

    public String getNombresPaciente() {
        return nombresPaciente;
    }

    public void setNombresPaciente(String nombresPaciente) {
        this.nombresPaciente = nombresPaciente;
    }

    public String getApellidosPaciente() {
        return apellidosPaciente;
    }

    public void setApellidosPaciente(String apellidosPaciente) {
        this.apellidosPaciente = apellidosPaciente;
    }

    public LocalDate getFechaNacimientoPaciente() {
        return fechaNacimientoPaciente;
    }

    public void setFechaNacimientoPaciente(LocalDate fechaNacimientoPaciente) {
        this.fechaNacimientoPaciente = fechaNacimientoPaciente;
    }

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @NotNull(message = "La hora es obligatoria")
    private LocalTime hora;

    // Opcional: si no se manda, dura 30 minutos
    @Min(value = 15, message = "La cita dura minimo 15 minutos")
    @Max(value = 120, message = "La cita dura maximo 120 minutos")
    private Integer duracionMinutos;

    @NotBlank(message = "El motivo es obligatorio")
    @Size(max = 200, message = "El motivo no puede pasar de 200 letras")
    private String motivo;

    public CitaRequest() {
    }

    public String getColegiaturaDoctor() {
        return colegiaturaDoctor;
    }

    public void setColegiaturaDoctor(String colegiaturaDoctor) {
        this.colegiaturaDoctor = colegiaturaDoctor;
    }

    public String getDniPaciente() {
        return dniPaciente;
    }

    public void setDniPaciente(String dniPaciente) {
        this.dniPaciente = dniPaciente;
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

    public Integer getDuracionMinutos() {
        return duracionMinutos;
    }

    public void setDuracionMinutos(Integer duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}
