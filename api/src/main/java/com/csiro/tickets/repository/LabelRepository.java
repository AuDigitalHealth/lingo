package com.csiro.tickets.repository;

import com.csiro.tickets.models.Label;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabelRepository extends JpaRepository<Label, Long> {

  Optional<Label> findByName(String title);
}
