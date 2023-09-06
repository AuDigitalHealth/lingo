package com.csiro.tickets.service;

import com.csiro.tickets.models.PriorityBucket;
import com.csiro.tickets.repository.PriorityBucketRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PriorityBucketService {

  @Autowired PriorityBucketRepository priorityBucketRepository;

  public PriorityBucket createAndReorder(PriorityBucket newPriorityBucket) {
    Optional<List<PriorityBucket>> optional =
        priorityBucketRepository.findByOrderIndexGreaterThan(newPriorityBucket.getOrderIndex() - 1);

    if (optional.isPresent()) {
      reorder(optional.get(), newPriorityBucket.getOrderIndex());
    }
    return priorityBucketRepository.save(newPriorityBucket);
  }

  public List<PriorityBucket> reorder(List<PriorityBucket> priorityBuckets, Integer index) {
    for (PriorityBucket priorityBucket : priorityBuckets) {
      if (priorityBucket.getOrderIndex() >= index) {
        Integer orderIndex = priorityBucket.getOrderIndex();
        priorityBucket.setOrderIndex(orderIndex + 1);
        priorityBucketRepository.save(priorityBucket);
      }
    }
    return priorityBuckets;
  }
}
