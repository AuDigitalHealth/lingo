package com.csiro.snomio.service.cis;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CISBulkRequestResponse {
  private String id;
}
