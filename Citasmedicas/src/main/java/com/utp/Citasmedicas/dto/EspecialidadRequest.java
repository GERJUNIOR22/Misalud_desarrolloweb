package com.utp.Citasmedicas.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public class EspecialidadRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede pasar de 100 letras")
    private String nombre;

    @Size(max = 255, message = "La descripcion no puede pasar de 255 letras")
    private String descripcion;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "1.00", message = "El precio minimo es S/ 1.00")
    @DecimalMax(value = "5000.00", message = "El precio maximo es S/ 5000.00")
    private BigDecimal precio;

    public EspecialidadRequest() {
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
}
