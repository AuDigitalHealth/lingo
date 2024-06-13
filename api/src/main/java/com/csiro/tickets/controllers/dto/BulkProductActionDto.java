package com.csiro.tickets.controllers.dto;

import com.csiro.snomio.product.bulk.BulkProductActionDetails;
import java.time.Instant;
import java.util.Set;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BulkProductActionDto {

  private Long id;

  private Long ticketId;

  private Integer version;

  private Instant created;

  private Instant modified;

  private String createdBy;

  private String modifiedBy;

  private String name;

  private Set<String> conceptIds;

  private BulkProductActionDetails details;
}
