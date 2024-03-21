package com.csiro.tickets.repository;

import com.csiro.tickets.models.UiSearchConfiguration;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UiSearchConfigurationRepository
    extends JpaRepository<UiSearchConfiguration, Long> {

  List<UiSearchConfiguration> findByUsername(String username);
}
