package com.utp.Citasmedicas.repository;

import com.utp.Citasmedicas.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// <Paciente, String> = la entidad y el tipo de su clave (DNI)
public interface PacienteRepository extends JpaRepository<Paciente, String> {

    // El paciente que tiene esta cuenta (para "mi perfil")
    Optional<Paciente> findByUsuarioCorreo(String correo);
}
