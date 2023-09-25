package com.csiro.tickets.controllers.dto;

import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AddtitionalFieldValuesForListTypeDto {

  private Long typeId;

  private String typeName;

  private Set<AdditionalFieldValueDto> values;

}
