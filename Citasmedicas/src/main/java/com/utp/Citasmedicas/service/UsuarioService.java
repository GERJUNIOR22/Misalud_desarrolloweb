package com.utp.Citasmedicas.service;

import com.utp.Citasmedicas.exception.*;
import com.utp.Citasmedicas.dto.UsuarioResponse;
import java.util.List;
import com.utp.Citasmedicas.entity.Usuario;
import com.utp.Citasmedicas.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    // Spring Security llama a este metodo cuando alguien intenta entrar
    // Ahora se busca por CORREO
    @Override
    public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        return User.builder()
                .username(usuario.getCorreo())
                .password(usuario.getPassword())
                .roles(usuario.getRol())
                .disabled(!usuario.isActivo())   // cuenta desactivada = no entra
                .build();
    }

    // Los usuarios son SOLO personal de la clinica (ADMIN y MEDICO). Los pacientes no tienen cuenta.
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream().map(UsuarioResponse::de).toList();
    }

    // El admin activa o desactiva una cuenta
    @Transactional
    public Usuario cambiarEstado(Long idUsuario, boolean activo) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario " + idUsuario));
        usuario.setActivo(activo);
        return usuarioRepository.save(usuario);
    }
}
