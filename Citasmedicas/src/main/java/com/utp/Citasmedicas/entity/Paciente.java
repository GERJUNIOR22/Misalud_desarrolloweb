package com.utp.Citasmedicas.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "paciente")
public class Paciente {

    // El DNI es la clave (no usamos id)
    @Id
    @Column(length = 8)
    private String dni;

    @Column(nullable = false, length = 60)
    private String nombres;

    @Column(nullable = false, length = 60)
    private String apellidos;

    private LocalDate fechaNacimiento;

    @Column(length = 15)
    private String telefono;

    // Cada paciente tiene su cuenta (ahi esta su correo y clave)
    // @JsonIgnore: para que al mostrar el paciente no salga su clave
    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "id_usuario", unique = true)
    private Usuario usuario;

    public Paciente() {
    }

    public Paciente(String dni, String nombres, String apellidos,
                    LocalDate fechaNacimiento, String telefono, Usuario usuario) {
        this.dni = dni;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.fechaNacimiento = fechaNacimiento;
        this.telefono = telefono;
        this.usuario = usuario;
    }

    // El correo se saca de su cuenta (asi no se guarda dos veces)
    public String getCorreo() {
        return usuario != null ? usuario.getCorreo() : null;
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

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
}
