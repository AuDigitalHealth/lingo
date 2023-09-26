package com.csiro.tickets.controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdditionalFieldValueListTypeQueryDto {

  private Long typeId;

  private String typeName;

  private Long valueId;

  private String value;
}
