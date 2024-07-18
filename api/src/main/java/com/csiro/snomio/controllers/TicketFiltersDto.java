package com.csiro.snomio.controllers;

import com.csiro.tickets.helper.SearchConditionBody;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
public class TicketFiltersDto implements Serializable {

  private Long id;
  private Integer version;
  private Instant created;
  private String createdBy;
  private Instant modified;
  private String modifiedBy;
  @NotNull private String name;
  @NotNull private SearchConditionBody filter;
}
