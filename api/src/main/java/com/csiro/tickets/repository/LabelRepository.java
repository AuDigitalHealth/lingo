package com.csiro.tickets.repository;

import com.csiro.tickets.models.Label;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabelRepository extends JpaRepository<Label, Long> {}
