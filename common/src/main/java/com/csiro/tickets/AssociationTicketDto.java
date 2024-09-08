package com.csiro.tickets;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class AssociationTicketDto extends BaseAuditableDto implements Serializable {
  private String title;
  private String ticketNumber;
  private String description;
  private StateDto state;
}
