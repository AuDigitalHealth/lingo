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
package au.gov.digitalhealth.tickets.models.listeners;

import au.gov.digitalhealth.tickets.models.Attachment;
import au.gov.digitalhealth.tickets.models.Ticket;
import java.time.Instant;
import org.hibernate.event.spi.PostDeleteEvent;
import org.hibernate.event.spi.PostDeleteEventListener;
import org.hibernate.event.spi.PostInsertEvent;
import org.hibernate.event.spi.PostInsertEventListener;
import org.hibernate.event.spi.PostUpdateEvent;
import org.hibernate.event.spi.PostUpdateEventListener;
import org.hibernate.persister.entity.EntityPersister;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AttachmentEntityListener
    implements PostInsertEventListener, PostUpdateEventListener, PostDeleteEventListener {

  @Value("${spring.profiles.active}")
  private String activeProfile;

  @Override
  public void onPostInsert(PostInsertEvent event) {
    handleTicketUpdate(event);
  }

  @Override
  public void onPostUpdate(PostUpdateEvent event) {
    handleTicketUpdate(event);
  }

  @Override
  public void onPostDelete(PostDeleteEvent event) {
    handleTicketUpdate(event);
  }

  private void handleTicketUpdate(Object event) {
    Object entity = extractEntity(event);
    if (entity instanceof Attachment attachment) {
      Ticket ticket = attachment.getTicket();
      if (ticket != null) {
        String currentUser =
            activeProfile.equals("test")
                ? "cgillespie"
                : SecurityContextHolder.getContext().getAuthentication().getName();
        ticket.setModified(Instant.now());
        ticket.setModifiedBy(currentUser);
      }
    }
  }

  private Object extractEntity(Object event) {
    if (event instanceof PostInsertEvent postInsertEvent) {
      return postInsertEvent.getEntity();
    } else if (event instanceof PostUpdateEvent postUpdateEvent) {
      return postUpdateEvent.getEntity();
    } else if (event instanceof PostDeleteEvent postDeleteEvent) {
      return postDeleteEvent.getEntity();
    }
    return null;
  }

  @Override
  public boolean requiresPostCommitHandling(EntityPersister entityPersister) {
    return false;
  }
}
