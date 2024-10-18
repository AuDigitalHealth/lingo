/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.tickets.service;

import au.gov.digitalhealth.tickets.models.PriorityBucket;
import au.gov.digitalhealth.tickets.repository.PriorityBucketRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PriorityBucketService {

  final PriorityBucketRepository priorityBucketRepository;

  @Autowired
  public PriorityBucketService(PriorityBucketRepository priorityBucketRepository) {
    this.priorityBucketRepository = priorityBucketRepository;
  }

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
