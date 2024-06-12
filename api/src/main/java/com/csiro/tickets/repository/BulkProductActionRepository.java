package com.csiro.tickets.repository;

import com.csiro.tickets.models.BulkProductAction;
import com.drew.lang.annotations.NotNull;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;

public interface BulkProductActionRepository extends JpaRepository<BulkProductAction, Long> {
  List<BulkProductAction> findByTicketId(@NotNull Long ticketId);

  Optional<BulkProductAction> findByNameAndTicketId(@NonNull String name, @NonNull Long ticketId);
}
