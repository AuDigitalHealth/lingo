package com.csiro.tickets.models.mappers;

import com.csiro.tickets.AdditionalFieldTypeDto;
import com.csiro.tickets.AdditionalFieldValueDto;
import com.csiro.tickets.AdditionalFieldValueListTypeQueryDto;
import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.models.AdditionalFieldValue;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class AdditionalFieldValueMapper {

  public static AdditionalFieldValueDto mapToDTO(AdditionalFieldValue additionalFieldValue) {
    AdditionalFieldValueDto dto = new AdditionalFieldValueDto();
    dto.setAdditionalFieldType(
        AdditionalFieldTypeDto.builder()
            .name(additionalFieldValue.getAdditionalFieldType().getName())
            .description(additionalFieldValue.getAdditionalFieldType().getDescription())
            .type(fromEntityEnum(additionalFieldValue.getAdditionalFieldType().getType()))
            .build());
    dto.setValueOf(additionalFieldValue.getValueOf());
    return dto;
  }

  public static Set<AdditionalFieldValueDto> mapToDto(
      Set<AdditionalFieldValue> additionalFieldValues) {
    if (additionalFieldValues == null) {
      return new HashSet<>();
    }
    return additionalFieldValues.stream()
        .map((AdditionalFieldValueMapper::mapToDTO))
        .collect(Collectors.toSet());
  }

  public static List<AdditionalFieldValueListTypeQueryDto> mapToListTypeQueryDto(
      List<AdditionalFieldValue> afvs) {

    return afvs.stream()
        .map(
            additionalFieldValue -> {
              return AdditionalFieldValueListTypeQueryDto.builder()
                  .valueId(additionalFieldValue.getId())
                  .value(additionalFieldValue.getValueOf())
                  .typeId(additionalFieldValue.getAdditionalFieldType().getId())
                  .typeName(additionalFieldValue.getAdditionalFieldType().getName())
                  .build();
            })
        .toList();
  }

  public static AdditionalFieldValue mapToEntity(AdditionalFieldValueDto additionalFieldValueDto) {
    AdditionalFieldValue afv = new AdditionalFieldValue();
    afv.setAdditionalFieldType(
        AdditionalFieldType.builder()
            .name(additionalFieldValueDto.getAdditionalFieldType().getName())
            .description(additionalFieldValueDto.getAdditionalFieldType().getDescription())
            .type(toEntityEnum(additionalFieldValueDto.getAdditionalFieldType().getType()))
            .build());
    afv.setValueOf(additionalFieldValueDto.getValueOf());
    return afv;
  }

  public static AdditionalFieldTypeDto.Type fromEntityEnum(AdditionalFieldType.Type entityType) {
    return switch (entityType) {
      case DATE -> AdditionalFieldTypeDto.Type.DATE;
      case NUMBER -> AdditionalFieldTypeDto.Type.NUMBER;
      case STRING -> AdditionalFieldTypeDto.Type.STRING;
      case LIST -> AdditionalFieldTypeDto.Type.LIST;
      default -> throw new IllegalArgumentException("Unsupported entity enum type: " + entityType);
    };
  }

  public static AdditionalFieldType.Type toEntityEnum(AdditionalFieldTypeDto.Type dtoType) {
    return switch (dtoType) {
      case DATE -> AdditionalFieldType.Type.DATE;
      case NUMBER -> AdditionalFieldType.Type.NUMBER;
      case STRING -> AdditionalFieldType.Type.STRING;
      case LIST -> AdditionalFieldType.Type.LIST;
      default -> throw new IllegalArgumentException("Unsupported DTO enum type: " + dtoType);
    };
  }
}
