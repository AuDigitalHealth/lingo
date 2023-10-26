package com.csiro.tickets.models;

import com.csiro.tickets.controllers.dto.PriorityBucketDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.NaturalId;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "priority_bucket")
@Audited
@EntityListeners(AuditingEntityListener.class)
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class PriorityBucket extends BaseAuditableEntity {

  @Column(unique = true)
  @NaturalId
  private String name;

  private Integer orderIndex;

  private String description;

  public static PriorityBucket of(PriorityBucketDto priorityBucketDto) {
    if (priorityBucketDto == null) return null;

    return PriorityBucket.builder()
        .name(priorityBucketDto.getName())
        .orderIndex(priorityBucketDto.getOrderIndex())
        .description(priorityBucketDto.getDescription())
        .build();
  }
}
