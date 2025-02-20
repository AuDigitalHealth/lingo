package au.gov.digitalhealth.tickets.models.mappers;

import au.gov.digitalhealth.tickets.CommentDto;
import au.gov.digitalhealth.tickets.ExternalProcessDto;
import au.gov.digitalhealth.tickets.models.Comment;
import au.gov.digitalhealth.tickets.models.ExternalProcess;
import java.util.List;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface ExternalProcessMapper {

  ExternalProcess toEntity(ExternalProcessDto externalProcessDto);

  ExternalProcessDto toDto(ExternalProcess externalProcess);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  Comment partialUpdate(CommentDto commentDto, @MappingTarget Comment comment);

  List<ExternalProcessDto> toDtoList(List<ExternalProcess> externalProcesses);
}
