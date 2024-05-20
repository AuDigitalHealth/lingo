package com.csiro.tickets.models.mappers;

import com.csiro.tickets.ExternalRequesterDto;
import com.csiro.tickets.models.ExternalRequestor;
import java.util.List;

public class ExternalRequestorMapper {

  private ExternalRequestorMapper() {
    throw new AssertionError("This class cannot be instantiated");
  }

  public static List<ExternalRequesterDto> mapToDtoList(
      List<ExternalRequestor> externalRequestors) {
    if (externalRequestors == null) return null;
    return externalRequestors.stream().map(ExternalRequestorMapper::mapToDTO).toList();
  }

  public static ExternalRequesterDto mapToDTO(ExternalRequestor externalRequestor) {
    if (externalRequestor == null) {
      return null;
    }
    return ExternalRequesterDto.builder()
        .id(externalRequestor.getId())
        .name(externalRequestor.getName())
        .description(externalRequestor.getDescription())
        .displayColor(externalRequestor.getDisplayColor())
        .build();
  }

  public static List<ExternalRequestor> mapToEntityList(
      List<ExternalRequesterDto> externalRequesterDtos) {
    if (externalRequesterDtos == null) return null;
    return externalRequesterDtos.stream().map(ExternalRequestorMapper::mapToEntity).toList();
  }

  public static ExternalRequestor mapToEntity(ExternalRequesterDto externalRequesterDto) {
    if (externalRequesterDto == null) {
      return null;
    }
    return ExternalRequestor.builder()
        .id(externalRequesterDto.getId())
        .name(externalRequesterDto.getName())
        .description(externalRequesterDto.getDescription())
        .displayColor(externalRequesterDto.getDisplayColor())
        .build();
  }
}
