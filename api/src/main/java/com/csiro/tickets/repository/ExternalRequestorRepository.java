package com.csiro.tickets.repository;

import com.csiro.tickets.models.ExternalRequestor;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExternalRequestorRepository extends JpaRepository<ExternalRequestor, Long> {

  List<ExternalRequestor> findAllByName(String title);

  Optional<ExternalRequestor> findByName(String title);
}
