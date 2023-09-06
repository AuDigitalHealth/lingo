package com.csiro.tickets.repository;

import com.csiro.tickets.models.PriorityBucket;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PriorityBucketRepository extends JpaRepository<PriorityBucket, Long> {

  List<PriorityBucket> findAllByOrderByOrderIndexAsc();

  Optional<PriorityBucket> findByName(String name);

  Optional<List<PriorityBucket>> findByOrderIndexGreaterThan(Integer orderIndex);
}
