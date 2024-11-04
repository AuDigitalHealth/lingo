/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.tickets.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Setter
@ToString
@Table(name = "comment")
@Entity
@Audited
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Comment extends BaseAuditableEntity {

  @ManyToOne(cascade = CascadeType.DETACH)
  @JoinColumn(name = "ticket_id")
  @JsonBackReference(value = "ticket-comment")
  private Ticket ticket;

  @Column(length = 1000000)
  private String text;

  @Column private Instant jiraCreated;

  public static Comment of(Comment comment) {
    return Comment.builder().text(comment.getText()).jiraCreated(comment.getJiraCreated()).build();
  }

  @PrePersist
  public void prePersist() {
    if (jiraCreated != null) {
      setCreated(jiraCreated);
    }
  }

  @Override
  @SuppressWarnings("java:S6201") // Suppressed because code is direct from JPABuddy advice
  public final boolean equals(Object o) {
    if (this == o) return true;
    if (o == null) return false;
    Class<?> oEffectiveClass =
        o instanceof HibernateProxy
            ? ((HibernateProxy) o).getHibernateLazyInitializer().getPersistentClass()
            : o.getClass();
    Class<?> thisEffectiveClass =
        this instanceof HibernateProxy
            ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass()
            : this.getClass();
    if (thisEffectiveClass != oEffectiveClass) return false;
    Comment comment = (Comment) o;
    return getId() != null && Objects.equals(getId(), comment.getId());
  }

  @Override
  @SuppressWarnings("java:S6201") // Suppressed because code is direct from JPABuddy advice
  public final int hashCode() {
    return this instanceof HibernateProxy
        ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass().hashCode()
        : getClass().hashCode();
  }
}
