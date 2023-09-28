package com.csiro.tickets.controllers.dto;

import lombok.Data;

@Data
public class AdditionalFieldValueListTypeQueryDto {

  private Long typeId;

  private String typeName;

  private Long valueId;

  private String value;
}
