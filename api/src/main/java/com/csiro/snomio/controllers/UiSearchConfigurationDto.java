package com.csiro.snomio.controllers;

import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

/** DTO for {@link UiSearchConfiguration} */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
public class UiSearchConfigurationDto implements Serializable {

  private Long id;
  private Integer version;
  private Instant created;
  private String createdBy;
  private Instant modified;
  private String modifiedBy;
  @NotNull private String username;
  private TicketFiltersDto filter;
  private int grouping;
}
