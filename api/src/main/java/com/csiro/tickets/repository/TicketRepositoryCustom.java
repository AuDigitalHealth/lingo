package com.csiro.tickets.repository;

import com.csiro.tickets.helper.SearchCondition;
import com.querydsl.core.types.Predicate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public interface TicketRepositoryCustom {
  Page<Long> findAllIds(
      Predicate predicate, Pageable pageable, Sort sort, List<SearchCondition> searchConditions);
}
