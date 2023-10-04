package com.csiro.tickets.controllers.dto;

import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.models.AdditionalFieldValue;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdditionalFieldValueDto {

  private AdditionalFieldType additionalFieldType;

  private String valueOf;

  public static Set<AdditionalFieldValueDto> of(Set<AdditionalFieldValue> additionalFieldValues) {
    if (additionalFieldValues == null) {
      return new HashSet<AdditionalFieldValueDto>();
    }
    return additionalFieldValues.stream()
        .map(AdditionalFieldValueDto::of)
        .collect(Collectors.toSet());
  }

  public static AdditionalFieldValueDto of(AdditionalFieldValue additionalFieldValue) {
    AdditionalFieldValueDto dto = new AdditionalFieldValueDto();
    dto.setAdditionalFieldType(
        AdditionalFieldType.builder()
            .name(additionalFieldValue.getAdditionalFieldType().getName())
            .description(additionalFieldValue.getAdditionalFieldType().getDescription())
            .listType(additionalFieldValue.getAdditionalFieldType().isListType())
            .build());
    dto.setValueOf(additionalFieldValue.getValueOf());
    return dto;
  }
}
