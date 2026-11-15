package com.utp.Citasmedicas.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Pago SIMULADO (no se conecta a ningun banco real)
@Entity
@Table(name = "pago")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPago;

    // Muchos pagos -> una cita (si uno se rechaza, se puede intentar otra vez)
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "codigo_cita", nullable = false)
    private Cita cita;

    // BigDecimal para dinero (double tiene errores de redondeo)
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private MetodoPago metodo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private EstadoPago estado;

    @Column(nullable = false)
    private LocalDateTime fechaPago;

    // Numero de operacion simulado (ej: OP-20261012001530)
    @Column(length = 30)
    private String numeroOperacion;

    public Pago() {
    }

    public Pago(Cita cita, BigDecimal monto, MetodoPago metodo) {
        this.cita = cita;
        this.monto = monto;
        this.metodo = metodo;
        this.fechaPago = LocalDateTime.now();
    }

    // Para el JSON: datos clave de la cita sin traer todo
    public String getCodigoCita() {
        return cita.getCodigo();
    }

    public String getDniPaciente() {
        return cita.getPaciente().getDni();
    }

    public String getPaciente() {
        return cita.getPaciente().getNombres() + " " + cita.getPaciente().getApellidos();
    }

    public Long getIdPago() {
        return idPago;
    }

    public void setIdPago(Long idPago) {
        this.idPago = idPago;
    }

    public Cita getCita() {
        return cita;
    }

    public void setCita(Cita cita) {
        this.cita = cita;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public MetodoPago getMetodo() {
        return metodo;
    }

    public void setMetodo(MetodoPago metodo) {
        this.metodo = metodo;
    }

    public EstadoPago getEstado() {
        return estado;
    }

    public void setEstado(EstadoPago estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(LocalDateTime fechaPago) {
        this.fechaPago = fechaPago;
    }

    public String getNumeroOperacion() {
        return numeroOperacion;
    }

    public void setNumeroOperacion(String numeroOperacion) {
        this.numeroOperacion = numeroOperacion;
    }
}
