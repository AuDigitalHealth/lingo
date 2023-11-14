package com.csiro.tickets.repository;

import com.csiro.tickets.models.Product;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;

public interface ProductRepository extends JpaRepository<Product, Long> {
  Optional<Product> findByNameAndTicketId(@NonNull String name, @NonNull Object unknownAttr1);
}
