package com.csiro.ticket.controllers.dto;


import com.csiro.ticket.controllers.dto.models.AdditionalFieldType;
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
