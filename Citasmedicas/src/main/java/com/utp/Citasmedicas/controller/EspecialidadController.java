package com.utp.Citasmedicas.controller;

import com.utp.Citasmedicas.dto.EspecialidadRequest;
import com.utp.Citasmedicas.entity.Especialidad;
import com.utp.Citasmedicas.service.EspecialidadService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/especialidades")
public class EspecialidadController {

    private final EspecialidadService especialidadService;

    public EspecialidadController(EspecialidadService especialidadService) {
        this.especialidadService = especialidadService;
    }

    // GET /api/especialidades -> todas (cualquiera con token)
    @GetMapping
    public List<Especialidad> listar() {
        return especialidadService.listar();
    }

    // GET /api/especialidades/activas -> solo las activas
    @GetMapping("/activas")
    public List<Especialidad> listarActivas() {
        return especialidadService.listarActivas();
    }

    // GET /api/especialidades/1
    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(especialidadService.buscar(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", e.getMessage()));
        }
    }

    // POST /api/especialidades -> solo ADMIN
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> registrar(@Valid @RequestBody EspecialidadRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(especialidadService.registrar(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }

    // PUT /api/especialidades/1 -> solo ADMIN
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @Valid @RequestBody EspecialidadRequest request) {
        try {
            return ResponseEntity.ok(especialidadService.actualizar(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }

    // PUT /api/especialidades/1/estado?activo=false -> solo ADMIN
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id, @RequestParam boolean activo) {
        try {
            return ResponseEntity.ok(especialidadService.cambiarEstado(id, activo));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", e.getMessage()));
        }
    }
}
