package com.csiro.tickets;

import java.io.Serializable;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Data
@ToString(callSuper = true)
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
public class AttachmentDto extends BaseAuditableDto implements Serializable {

  private String description;
  private String filename;
  private String location;
  private String thumbnailLocation;
  private Long length;
  private String sha256;
  private Instant jiraCreated;
  private AttachmentTypeDto attachmentType;
}
