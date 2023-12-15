package com.csiro.tickets.models.mappers;

import com.csiro.tickets.LabelDto;
import com.csiro.tickets.models.Label;
import java.util.List;

public class LabelMapper {

  public static List<LabelDto> mapToDtoList(List<Label> labels) {
    return labels.stream().map(LabelMapper::mapToDTO).toList();
  }

  public static LabelDto mapToDTO(Label label) {
    if (label == null) {
      return null;
    }
    return LabelDto.builder()
        .id(label.getId())
        .name(label.getName())
        .description(label.getDescription())
        .displayColor(label.getDisplayColor())
        .build();
  }

  public static List<Label> mapToEntityList(List<LabelDto> labels) {
    return labels.stream().map(LabelMapper::mapToEntity).toList();
  }

  public static Label mapToEntity(LabelDto labelDto) {
    if (labelDto == null) {
      return null;
    }
    return Label.builder()
        .id(labelDto.getId())
        .name(labelDto.getName())
        .description(labelDto.getDescription())
        .displayColor(labelDto.getDisplayColor())
        .build();
  }
}
