package com.csiro.tickets.models.mappers;

import com.csiro.tickets.CommentDto;
import com.csiro.tickets.models.Comment;
import java.util.List;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface CommentMapper {

  Comment toEntity(CommentDto commentDto);

  CommentDto toDto(Comment comment);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  Comment partialUpdate(CommentDto commentDto, @MappingTarget Comment comment);

  List<CommentDto> toDtoList(List<Comment> comments);
}
