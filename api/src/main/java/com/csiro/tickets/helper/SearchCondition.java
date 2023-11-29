package com.csiro.tickets.helper;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SearchCondition {
  private String key;
  private String operation;
  private String value;
  private String condition;
}
