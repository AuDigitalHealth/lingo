package com.csiro.tickets;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LabelDto {

  private Long id;

  private String name;

  private String description;

  // Can be success, error, warning, info, secondary, primary or some hex value
  private String displayColor;
}
