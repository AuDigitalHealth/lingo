package com.csiro.tickets.models.mappers;

import com.csiro.tickets.controllers.dto.BulkProductActionDto;
import com.csiro.tickets.controllers.dto.BulkProductActionDto.BulkProductActionDtoBuilder;
import com.csiro.tickets.models.BulkProductAction;
import com.csiro.tickets.models.Ticket;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class BulkProductActionMapper {

  private BulkProductActionMapper() {
    throw new AssertionError("This class cannot be instantiated");
  }

  public static Set<BulkProductActionDto> mapToDto(Set<BulkProductAction> products) {
    if (products == null) {
      return new HashSet<>();
    }
    return products.stream().map(BulkProductActionMapper::mapToDto).collect(Collectors.toSet());
  }

  public static BulkProductActionDto mapToDto(BulkProductAction bulkProductAction) {
    BulkProductActionDtoBuilder dto = BulkProductActionDto.builder();

    dto.id(bulkProductAction.getId())
        .ticketId(bulkProductAction.getTicket().getId())
        .name(bulkProductAction.getName())
        .version(bulkProductAction.getVersion())
        .created(bulkProductAction.getCreated())
        .modified(bulkProductAction.getModified())
        .createdBy(bulkProductAction.getCreatedBy())
        .modifiedBy(bulkProductAction.getModifiedBy())
        .conceptIds(
            bulkProductAction.getConceptIds() != null
                ? bulkProductAction.getConceptIds().stream()
                    .map(Object::toString)
                    .collect(Collectors.toSet())
                : null)
        .details(bulkProductAction.getDetails());

    return dto.build();
  }

  public static BulkProductAction mapToEntity(BulkProductActionDto dto, Ticket ticket) {
    if (dto == null) return null;

    BulkProductAction bulkProductAction = new BulkProductAction();

    bulkProductAction.setTicket(ticket);
    bulkProductAction.setName(dto.getName());
    bulkProductAction.setVersion(dto.getVersion());
    bulkProductAction.setCreated(dto.getCreated());
    bulkProductAction.setModified(dto.getModified());
    bulkProductAction.setCreatedBy(dto.getCreatedBy());
    bulkProductAction.setModifiedBy(dto.getModifiedBy());
    if (dto.getConceptIds() != null) {
      bulkProductAction.setConceptIds(
          dto.getConceptIds().stream().map(Long::valueOf).collect(Collectors.toSet()));
    }
    bulkProductAction.setDetails(dto.getDetails());

    return bulkProductAction;
  }
}
