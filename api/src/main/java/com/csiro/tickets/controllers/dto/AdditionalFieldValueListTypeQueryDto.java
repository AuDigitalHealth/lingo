package com.csiro.tickets.controllers.dto;

import com.csiro.tickets.models.AdditionalFieldType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdditionalFieldValueListTypeQueryDto {

  private Long typeId;

  private String typeName;

  private AdditionalFieldType.Type type;

  private Long valueId;

  private String value;
}
