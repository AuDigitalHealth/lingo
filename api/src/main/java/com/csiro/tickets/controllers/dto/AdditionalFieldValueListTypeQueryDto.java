package com.csiro.tickets.controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdditionalFieldValueListTypeQueryDto {

  private Long typeId;

  private String typeName;

  private Long valueId;

  private String value;
}
