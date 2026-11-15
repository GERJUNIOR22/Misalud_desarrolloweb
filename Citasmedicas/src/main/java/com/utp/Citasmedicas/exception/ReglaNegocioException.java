package com.utp.Citasmedicas.exception;

// Se rompió una regla del negocio (horario ocupado, correo repetido, etc.) -> 400
public class ReglaNegocioException extends RuntimeException {
    public ReglaNegocioException(String mensaje) {
        super(mensaje);
    }
}
