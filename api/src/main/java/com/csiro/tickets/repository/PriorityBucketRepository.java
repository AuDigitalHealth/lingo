package com.csiro.tickets.repository;

import com.csiro.tickets.models.PriorityBucket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PriorityBucketRepository extends JpaRepository<PriorityBucket, Long> {}
