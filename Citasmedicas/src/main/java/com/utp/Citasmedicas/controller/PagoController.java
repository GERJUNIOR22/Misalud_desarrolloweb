package com.utp.Citasmedicas.controller;

import com.utp.Citasmedicas.dto.PagoRequest;
import com.utp.Citasmedicas.entity.EstadoPago;
import com.utp.Citasmedicas.entity.Pago;
import com.utp.Citasmedicas.service.PagoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    // GET /api/pagos -> ADMIN ve todos
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Pago> listar() {
        return pagoService.listar();
    }

    // GET /api/pagos/resumen -> ADMIN: cuanto se cobro y cuanto falta
    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, ?> resumen() {
        return pagoService.resumen();
    }

    // GET /api/pagos/cita/CIT-00004 -> ADMIN
    @GetMapping("/cita/{codigo}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Pago> deCita(@PathVariable String codigo) {
        return pagoService.deCita(codigo);
    }

    // POST /api/pagos -> ADMIN registra un cobro en caja (los pacientes pagan al reservar en /api/publico)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> pagar(@Valid @RequestBody PagoRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.pagar(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }

    // PUT /api/pagos/1/estado?estado=COMPLETADO -> ADMIN en caja
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id, @RequestParam EstadoPago estado) {
        try {
            return ResponseEntity.ok(pagoService.cambiarEstado(id, estado));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }
}
