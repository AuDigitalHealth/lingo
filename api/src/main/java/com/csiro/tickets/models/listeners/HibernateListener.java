package com.csiro.tickets.models.listeners;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.hibernate.internal.SessionFactoryImpl;
import org.springframework.stereotype.Service;

@Service
public class HibernateListener {

  private final EntityManagerFactory entityManagerFactory;

  private final AttachmentEntityListener attachmentEntityListener;

  public HibernateListener(
      EntityManagerFactory entityManagerFactory,
      AttachmentEntityListener attachmentEntityListener) {
    this.entityManagerFactory = entityManagerFactory;
    this.attachmentEntityListener = attachmentEntityListener;
  }

  @PostConstruct
  private void init() {
    SessionFactoryImpl sessionFactory = entityManagerFactory.unwrap(SessionFactoryImpl.class);
    EventListenerRegistry registry =
        sessionFactory.getServiceRegistry().getService(EventListenerRegistry.class);
    assert registry != null;
    registry.getEventListenerGroup(EventType.POST_DELETE).appendListener(attachmentEntityListener);
    registry.getEventListenerGroup(EventType.POST_INSERT).appendListener(attachmentEntityListener);
    registry.getEventListenerGroup(EventType.POST_UPDATE).appendListener(attachmentEntityListener);
  }
}
