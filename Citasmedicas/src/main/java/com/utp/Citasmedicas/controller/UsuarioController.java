package com.utp.Citasmedicas.controller;

import com.utp.Citasmedicas.dto.UsuarioResponse;
import com.utp.Citasmedicas.entity.Usuario;
import java.util.List;
import com.utp.Citasmedicas.service.UsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // GET /api/usuarios -> el ADMIN ve todas las cuentas (sin claves)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UsuarioResponse> listar() {
        return usuarioService.listar();
    }

    // PUT /api/usuarios/5/estado?activo=false -> solo el ADMIN
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id, @RequestParam boolean activo) {
        try {
            Usuario usuario = usuarioService.cambiarEstado(id, activo);
            return ResponseEntity.ok(Map.of(
                    "correo", usuario.getCorreo(),
                    "activo", usuario.isActivo()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("mensaje", e.getMessage()));
        }
    }
}
