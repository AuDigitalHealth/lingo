package com.csiro.tickets.models.listeners;

import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.models.Ticket;
import java.time.Instant;
import org.hibernate.event.spi.PostDeleteEvent;
import org.hibernate.event.spi.PostDeleteEventListener;
import org.hibernate.event.spi.PostInsertEvent;
import org.hibernate.event.spi.PostInsertEventListener;
import org.hibernate.event.spi.PostUpdateEvent;
import org.hibernate.event.spi.PostUpdateEventListener;
import org.hibernate.persister.entity.EntityPersister;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AttachmentEntityListener
    implements PostInsertEventListener, PostUpdateEventListener, PostDeleteEventListener {

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
    if (entity instanceof Attachment) {
      Attachment attachment = (Attachment) entity;
      Ticket ticket = attachment.getTicket();
      if (ticket != null) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        ticket.setModified(Instant.now());
        ticket.setModifiedBy(currentUser);
      }
    }
  }

  private Object extractEntity(Object event) {
    if (event instanceof PostInsertEvent) {
      return ((PostInsertEvent) event).getEntity();
    } else if (event instanceof PostUpdateEvent) {
      return ((PostUpdateEvent) event).getEntity();
    } else if (event instanceof PostDeleteEvent) {
      return ((PostDeleteEvent) event).getEntity();
    }
    return null;
  }

  @Override
  public boolean requiresPostCommitHandling(EntityPersister entityPersister) {
    return false;
  }
}
