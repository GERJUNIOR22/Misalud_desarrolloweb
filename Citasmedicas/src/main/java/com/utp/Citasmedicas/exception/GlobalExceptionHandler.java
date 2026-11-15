package com.utp.Citasmedicas.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

// Un solo formato de error para todo el API:
//   { "mensaje": "...", "errores": { "campo": "detalle" } }   (errores solo en validaciones)
@RestControllerAdvice
public class GlobalExceptionHandler {

    // @Valid fallo: devuelve un mensaje + el detalle por campo (para pintarlo en el formulario)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validacion(MethodArgumentNotValidException e) {
        Map<String, String> errores = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(f -> errores.putIfAbsent(f.getField(), f.getDefaultMessage()));
        String primero = errores.values().stream().findFirst().orElse("Datos invalidos");

        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("mensaje", primero);
        cuerpo.put("errores", errores);
        return ResponseEntity.badRequest().body(cuerpo);
    }

    // JSON mal formado, fecha con formato raro, enum que no existe...
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, String>> formatoInvalido(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("mensaje",
                "Formato de datos invalido (revisa fechas AAAA-MM-DD, horas HH:mm y los valores permitidos)"));
    }

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<Map<String, String>> noEncontrado(RecursoNoEncontradoException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", e.getMessage()));
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<Map<String, String>> regla(ReglaNegocioException e) {
        return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> prohibido(SecurityException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("mensaje", e.getMessage()));
    }

    // Dos personas reservaron a la vez (clave duplicada)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> conflicto(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("mensaje",
                "Conflicto al guardar: otra operacion ocurrio al mismo tiempo, intenta de nuevo"));
    }
}
