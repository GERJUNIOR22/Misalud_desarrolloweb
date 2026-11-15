package com.utp.Citasmedicas.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "doctor")
public class Doctor {

    // La colegiatura es la clave (no usamos id)
    @Id
    @Column(length = 10)
    private String colegiatura;

    @Column(nullable = false, length = 60)
    private String nombres;

    @Column(nullable = false, length = 60)
    private String apellidos;

    @Column(length = 15)
    private String telefono;

    // Muchos doctores -> una especialidad (antes era solo texto)
    @ManyToOne
    @JoinColumn(name = "id_especialidad")
    private Especialidad especialidad;

    // Su cuenta para iniciar sesion (rol MEDICO)
    // @JsonIgnore: para que no se vea su clave
    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "id_usuario", unique = true)
    private Usuario usuario;

    public Doctor() {
    }

    public Doctor(String colegiatura, String nombres, String apellidos, String telefono,
                  Especialidad especialidad, Usuario usuario) {
        this.colegiatura = colegiatura;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.telefono = telefono;
        this.especialidad = especialidad;
        this.usuario = usuario;
    }

    // El correo se saca de su cuenta (asi no se guarda dos veces)
    public String getCorreo() {
        return usuario != null ? usuario.getCorreo() : null;
    }

    public String getColegiatura() {
        return colegiatura;
    }

    public void setColegiatura(String colegiatura) {
        this.colegiatura = colegiatura;
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

    public Especialidad getEspecialidad() {
        return especialidad;
    }

    public void setEspecialidad(Especialidad especialidad) {
        this.especialidad = especialidad;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
}
