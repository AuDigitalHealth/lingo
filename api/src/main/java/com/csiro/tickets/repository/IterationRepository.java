package com.csiro.tickets.repository;

import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.models.Label;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IterationRepository extends JpaRepository<Iteration, Long> {

  Optional<Iteration> findByName(String title);
}
