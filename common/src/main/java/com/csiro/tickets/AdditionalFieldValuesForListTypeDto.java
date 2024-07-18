package com.csiro.tickets;

import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdditionalFieldValuesForListTypeDto {

  private Long typeId;

  private String typeName;

  private Set<AdditionalFieldValueDto> values;
}
