package com.csiro.tickets;

import java.io.Serializable;
import java.time.Instant;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
public abstract class BaseAuditableDto implements Serializable {
  Long id;
  Integer version;
  Instant created;
  String createdBy;
  Instant modified;
  String modifiedBy;
}
