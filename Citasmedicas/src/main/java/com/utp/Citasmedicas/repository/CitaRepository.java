package com.utp.Citasmedicas.repository;

import com.utp.Citasmedicas.entity.Cita;
import com.utp.Citasmedicas.entity.EstadoCita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, String> {

    // Query methods: citas de un doctor / de un paciente (mas recientes primero)
    List<Cita> findByDoctorColegiaturaOrderByFechaDescHoraDesc(String colegiatura);

    List<Cita> findByPacienteDniOrderByFechaDescHoraDesc(String dni);

    // JPQL: citas que ocupan la agenda del doctor ese dia
    // (las CANCELADAS y RECHAZADAS no ocupan)
    @Query("SELECT c FROM Cita c WHERE c.doctor.colegiatura = :colegiatura " +
            "AND c.fecha = :fecha AND c.estado IN :estados")
    List<Cita> citasDelDia(@Param("colegiatura") String colegiatura,
                           @Param("fecha") LocalDate fecha,
                           @Param("estados") List<EstadoCita> estados);

    // JPQL: el ultimo codigo (CIT-00002) para crear el siguiente
    @Query("SELECT MAX(c.codigo) FROM Cita c")
    String ultimoCodigo();
}
