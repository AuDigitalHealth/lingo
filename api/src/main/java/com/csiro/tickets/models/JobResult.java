package com.csiro.tickets.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.envers.Audited;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Setter
@ToString
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "job_results")
@Entity
@Audited
@EntityListeners(AuditingEntityListener.class)
public class JobResult extends BaseAuditableEntity {

  private String jobName;

  private String jobId;

  private Instant finishedTime;

  private boolean acknowledged;

  //  @NotNull
  //  @JdbcTypeCode(SqlTypes.JSON)
  //  @Column(columnDefinition = "jsonb")
  //  private JsonNode results;

  @NotNull
  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb")
  private List<Result> results;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Result {

    private String name;

    private int count;

    private List<ResultItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResultItem {

      private String id;

      private String title;

      private String link;
    }
  }
}
