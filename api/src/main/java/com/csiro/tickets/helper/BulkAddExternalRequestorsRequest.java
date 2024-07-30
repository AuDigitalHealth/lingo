package com.csiro.tickets.helper;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkAddExternalRequestorsRequest {
  private String additionalFieldTypeName;

  private List<String> fieldValues;

  private List<String> externalRequestors;
}
