package com.csiro.tickets;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExternalRequesterDto {

  private Long id;

  private String name;

  private String description;

  // Can be success, error, warning, info, secondary, primary or some hex value
  private String displayColor;
}
