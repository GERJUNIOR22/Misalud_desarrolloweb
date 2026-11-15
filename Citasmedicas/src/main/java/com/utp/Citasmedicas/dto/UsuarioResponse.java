package com.utp.Citasmedicas.dto;

import com.utp.Citasmedicas.entity.Usuario;

// Usuario SIN la clave (para el listado del administrador)
public record UsuarioResponse(Long idUsuario, String correo, String rol, boolean activo) {

    public static UsuarioResponse de(Usuario u) {
        return new UsuarioResponse(u.getIdUsuario(), u.getCorreo(), u.getRol(), u.isActivo());
    }
}
