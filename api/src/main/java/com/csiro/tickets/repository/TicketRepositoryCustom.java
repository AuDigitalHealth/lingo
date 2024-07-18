package com.csiro.tickets.repository;

import com.querydsl.core.types.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public interface TicketRepositoryCustom {
  Page<Long> findAllIds(Predicate predicate, Pageable pageable, Sort sort);
}
