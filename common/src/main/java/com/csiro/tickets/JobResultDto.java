package com.csiro.tickets;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
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
@AllArgsConstructor
public class JobResultDto extends BaseAuditableDto implements Serializable {

  private String jobName;

  private String jobId;

  private Instant finishedTime;

  private List<ResultDto> results;

  private boolean acknowledged;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ResultDto {

    private String name;

    private int count;

    private List<ResultItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResultItemDto {

      private String id;

      private String title;

      private String link;
    }
  }

}
