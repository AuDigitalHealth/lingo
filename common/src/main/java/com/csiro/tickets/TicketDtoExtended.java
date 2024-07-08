package com.csiro.tickets;

import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Data
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class TicketDtoExtended extends TicketDto{
  private List<CommentDto> comments;
  private List<AttachmentDto> attachments;
}
