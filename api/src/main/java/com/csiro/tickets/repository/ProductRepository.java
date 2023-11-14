package com.csiro.tickets.repository;

import com.csiro.tickets.models.Product;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;

public interface ProductRepository extends JpaRepository<Product, Long> {

  List<Product> findByTicketId(@NotNull Long ticketId);

  Optional<Product> findByNameAndTicketId(@NonNull String name, @NonNull Object unknownAttr1);
}
