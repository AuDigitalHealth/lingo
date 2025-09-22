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
package au.gov.digitalhealth.tickets.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class TicketAuditRepository {

  @PersistenceContext private EntityManager entityManager;

  public List<Object[]> findAllTicketRevisions(Long ticketId, List<Integer> revisions) {
    String sql =
        """
        SELECT rev, title, description, assignee, state_id,
               priority_bucket_id, iteration_id, ticket_type_id
        FROM ticket_aud
        WHERE id = :ticketId AND rev IN (:revisions)
        ORDER BY rev
        """;

    Query query = entityManager.createNativeQuery(sql);
    query.setParameter("ticketId", ticketId);
    query.setParameter("revisions", revisions);

    return query.getResultList();
  }

  public List<Object[]> findLabelChanges(Long ticketId) {
    String sql =
        """
            SELECT tla.label_id, tla.rev, tla.revtype, r.revtstmp, r.username
            FROM ticket_labels_aud tla
            JOIN revinfo r ON tla.rev = r.rev
            WHERE tla.ticket_id = :ticketId
            ORDER BY r.revtstmp
            """;

    Query query = entityManager.createNativeQuery(sql);
    query.setParameter("ticketId", ticketId);
    return query.getResultList();
  }

  public List<Object[]> findCommentChanges(Long ticketId) {
    String sql =
        """
            SELECT ca.id, ca.text, ca.rev, r.revtstmp, r.username
            FROM comment_aud ca
            JOIN revinfo r ON ca.rev = r.rev
            WHERE ca.ticket_id = :ticketId
            ORDER BY r.revtstmp
            """;

    Query query = entityManager.createNativeQuery(sql);
    query.setParameter("ticketId", ticketId);
    return query.getResultList();
  }

  public List<Object[]> findExternalRequestorChanges(Long ticketId) {
    String sql =
        """
            SELECT tera.external_requestor_id, tera.rev, tera.revtype, r.revtstmp, r.username
            FROM ticket_external_requestors_aud tera
            JOIN revinfo r ON tera.rev = r.rev
            WHERE tera.ticket_id = :ticketId
            ORDER BY r.revtstmp
            """;

    Query query = entityManager.createNativeQuery(sql);
    query.setParameter("ticketId", ticketId);
    return query.getResultList();
  }

  public List<Object[]> findAdditionalFieldValueChanges(Long ticketId) {
    String sql =
        """
            SELECT tafva.additional_field_value_id, tafva.ticket_id, tafva.rev, tafva.revtype,
                   r.revtstmp, r.username, afv.value_of, aft.name as field_name
            FROM ticket_additional_field_values_aud tafva
            JOIN revinfo r ON tafva.rev = r.rev
            LEFT JOIN additional_field_value afv ON tafva.additional_field_value_id = afv.id
            LEFT JOIN additional_field_type aft ON afv.additional_field_type_id = aft.id
            WHERE tafva.ticket_id = :ticketId
            ORDER BY r.revtstmp
            """;

    Query query = entityManager.createNativeQuery(sql);
    query.setParameter("ticketId", ticketId);
    return query.getResultList();
  }

  public List<Object[]> findTicketAssociationChanges(Long ticketId) {
    String sql =
        """
        SELECT ta.id, ta.ticket_source_id, ta.ticket_target_id, ta.rev, ta.revtype,
               r.revtstmp, r.username
        FROM ticket_association_aud ta
        JOIN revinfo r ON ta.rev = r.rev
        ORDER BY ta.id, r.revtstmp
        """;

    Query query = entityManager.createNativeQuery(sql);
    return query.getResultList();
  }

  public List<Object[]> findTaskAssociationChanges(Long ticketId) {
    String sql =
        """
            SELECT ta.task_association_id, ta.rev, r.revtstmp, r.username
            FROM ticket_aud ta
            JOIN revinfo r ON ta.rev = r.rev
            WHERE ta.id = :ticketId AND ta.task_association_id IS NOT NULL
            ORDER BY r.revtstmp
            """;

    Query query = entityManager.createNativeQuery(sql);
    query.setParameter("ticketId", ticketId);
    return query.getResultList();
  }

  public String findTaskIdFromAssociation(Long taskAssociationId) {
    if (taskAssociationId == null) return null;

    String sql = "SELECT task_id FROM task_association WHERE id = :taskAssociationId";
    Query query = entityManager.createNativeQuery(sql);
    query.setParameter("taskAssociationId", taskAssociationId);

    try {
      return (String) query.getSingleResult();
    } catch (Exception e) {
      return "Unknown Task";
    }
  }
}
