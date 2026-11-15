package com.utp.Citasmedicas.exception;

// Algo que se buscó y no existe -> 404
public class RecursoNoEncontradoException extends RuntimeException {
    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}
