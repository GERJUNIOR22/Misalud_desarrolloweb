package com.utp.Citasmedicas.repository;

import com.utp.Citasmedicas.entity.Doctor;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// <Doctor, String> = la entidad y el tipo de su clave (colegiatura)
public interface DoctorRepository extends JpaRepository<Doctor, String> {

    // Query method: busca por el NOMBRE de su especialidad (doctor.especialidad.nombre)
    List<Doctor> findByEspecialidadNombreIgnoreCase(String nombre);

    // Bloquea la fila del doctor mientras se reserva: dos reservas a la vez para el mismo
    // doctor se hacen una despues de la otra (evita citas cruzadas)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Doctor d WHERE d.colegiatura = :colegiatura")
    Optional<Doctor> buscarParaReservar(@Param("colegiatura") String colegiatura);

    // El doctor que tiene esta cuenta (para "mi perfil")
    Optional<Doctor> findByUsuarioCorreo(String correo);
}
