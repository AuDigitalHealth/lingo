package com.csiro.tickets;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
public class AttachmentTypeDto implements Serializable {

  private Long id;
  private String name;
  private String mimeType;
}
