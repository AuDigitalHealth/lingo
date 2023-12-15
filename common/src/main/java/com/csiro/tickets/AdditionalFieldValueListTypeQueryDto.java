package com.csiro.tickets;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdditionalFieldValueListTypeQueryDto {

  private Long typeId;

  private String typeName;

  private AdditionalFieldTypeDto.Type type;

  private Long valueId;

  private String value;
}
