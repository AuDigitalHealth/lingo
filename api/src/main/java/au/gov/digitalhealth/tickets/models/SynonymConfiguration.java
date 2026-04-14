package au.gov.digitalhealth.tickets.models;

import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Setter
@ToString
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "synonym_configuration")
@Entity
@Audited
@EntityListeners(AuditingEntityListener.class)
public class SynonymConfiguration extends BaseAuditableEntity {

  private String searchString;

  private String replacementString;
}
