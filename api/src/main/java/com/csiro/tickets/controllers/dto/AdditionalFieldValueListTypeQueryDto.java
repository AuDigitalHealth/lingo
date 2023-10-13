package com.csiro.tickets.controllers.dto;

import lombok.Data;
import com.csiro.tickets.models.AdditionalFieldType;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class AdditionalFieldValueListTypeQueryDto {

  private Long typeId;

  private String typeName;

  private AdditionalFieldType.Type type;

  private Long valueId;

  private String value;
}
