package com.utp.Citasmedicas.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "cita")
public class Cita {

    // Codigo de la cita, ej: CIT-00001
    @Id
    @Column(length = 10)
    private String codigo;

    // Muchas citas -> un doctor. La FK es la colegiatura
    @ManyToOne
    @JoinColumn(name = "colegiatura_doctor", nullable = false)
    private Doctor doctor;

    // Muchas citas -> un paciente. La FK es el DNI
    @ManyToOne
    @JoinColumn(name = "dni_paciente", nullable = false)
    private Paciente paciente;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private LocalTime hora;

    // Cuanto dura la cita (por defecto 30 min)
    @Column(nullable = false)
    private int duracionMinutos = 30;

    @Column(nullable = false, length = 200)
    private String motivo;

    // PENDIENTE, CONFIRMADA, RECHAZADA, CANCELADA o COMPLETADA
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private EstadoCita estado;

    @Column(length = 300)
    private String observacion;

    public Cita() {
    }

    public Cita(String codigo, Doctor doctor, Paciente paciente,
                LocalDate fecha, LocalTime hora, int duracionMinutos, String motivo) {
        this.codigo = codigo;
        this.doctor = doctor;
        this.paciente = paciente;
        this.fecha = fecha;
        this.hora = hora;
        this.duracionMinutos = duracionMinutos;
        this.motivo = motivo;
        this.estado = EstadoCita.PENDIENTE;
    }

    // Hora en que termina (ej: 09:00 + 30 min = 09:30)
    public LocalTime getHoraFin() {
        return hora.plusMinutes(duracionMinutos);
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public Doctor getDoctor() {
        return doctor;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public void setPaciente(Paciente paciente) {
        this.paciente = paciente;
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

    public int getDuracionMinutos() {
        return duracionMinutos;
    }

    public void setDuracionMinutos(int duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
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
