package com.csiro.tickets.models;

import com.csiro.tickets.helper.MimeTypeUtils;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.NaturalId;
import org.hibernate.envers.Audited;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@Setter
@ToString
@Audited
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "attachment_type")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class AttachmentType {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column private String name;

  @Column(unique = true)
  @NaturalId
  private String mimeType;

  public static AttachmentType of(AttachmentType attachmentType) {
    return AttachmentType.builder()
        .name(attachmentType.getName())
        .mimeType(attachmentType.getMimeType())
        .build();
  }

  public static AttachmentType of(AttachmentType attachmentType, boolean fixname) {
    return AttachmentType.builder()
        .name(
            fixname
                ? MimeTypeUtils.toHumanReadable(attachmentType.getMimeType())
                : attachmentType.getName())
        .mimeType(attachmentType.getMimeType())
        .build();
  }

  public static AttachmentType of(String attachmentType) {
    return AttachmentType.builder()
        .name(MimeTypeUtils.toHumanReadable(attachmentType))
        .mimeType(attachmentType)
        .build();
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
    AttachmentType that = (AttachmentType) o;
    return getMimeType() != null && Objects.equals(getMimeType(), that.getMimeType());
  }

  @Override
  @SuppressWarnings("java:S6201") // Suppressed because code is direct from JPABuddy advice
  public final int hashCode() {
    return this instanceof HibernateProxy
        ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass().hashCode()
        : getClass().hashCode();
  }
}
