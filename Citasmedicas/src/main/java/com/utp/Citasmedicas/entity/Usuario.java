package com.utp.Citasmedicas.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUsuario;

    // Se inicia sesion con el correo (no se puede repetir)
    @Column(nullable = false, unique = true, length = 100)
    private String correo;

    @Column(nullable = false)
    private String password;   // cifrada con BCrypt

    @Column(nullable = false, length = 20)
    private String rol;        // ADMIN o MEDICO

    // false = cuenta desactivada, no puede entrar
    @Column(nullable = false)
    private boolean activo = true;

    public Usuario() {
    }

    public Usuario(String correo, String password, String rol) {
        this.correo = correo;
        this.password = password;
        this.rol = rol;
        this.activo = true;
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}
