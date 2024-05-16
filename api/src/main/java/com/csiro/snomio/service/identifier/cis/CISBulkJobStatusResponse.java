package com.csiro.snomio.service.identifier.cis;

import lombok.Data;

@Data
public class CISBulkJobStatusResponse {
  private String status;
  private String log;
}
