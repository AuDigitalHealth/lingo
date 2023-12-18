package com.csiro.tickets;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class AdditionalFieldValueListTypeQueryDto {

  private Long typeId;

  private String typeName;

  private AdditionalFieldTypeDto.Type type;

  private Long valueId;

  private String value;
}
