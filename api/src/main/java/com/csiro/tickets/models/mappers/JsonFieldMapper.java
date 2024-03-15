package com.csiro.tickets.models.mappers;

import com.csiro.tickets.JsonFieldDto;
import com.csiro.tickets.models.JsonField;
import java.util.List;

public class JsonFieldMapper {

  private JsonFieldMapper() {
    throw new AssertionError("This class cannot be instantiated");
  }

  public static List<JsonFieldDto> mapToDtoList(List<JsonField> jsonField) {
    if (jsonField == null) return null;
    return jsonField.stream().map(JsonFieldMapper::mapToDto).toList();
  }

  public static JsonFieldDto mapToDto(JsonField jsonField) {
    if (jsonField == null) {
      return null;
    }
    return JsonFieldDto.builder()
        .id(jsonField.getId())
        .name(jsonField.getName())
        .value(jsonField.getValue())
        .build();
  }

  public static List<JsonField> mapToEntityList(List<JsonFieldDto> jsonFieldDto) {
    if (jsonFieldDto == null) return null;
    return jsonFieldDto.stream().map(JsonFieldMapper::mapToEntity).toList();
  }

  public static JsonField mapToEntity(JsonFieldDto jsonFieldDto) {
    if (jsonFieldDto == null) {
      return null;
    }
    JsonField jsonField = new JsonField();
    jsonField.setId(jsonFieldDto.getId());
    jsonField.setName(jsonFieldDto.getName());
    jsonField.setValue(jsonFieldDto.getValue());
    return jsonField;
  }
}
