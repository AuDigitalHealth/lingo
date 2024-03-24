package com.csiro.tickets.models.listeners;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.hibernate.internal.SessionFactoryImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class HibernateListener {

  private final EntityManagerFactory entityManagerFactory;

  @Autowired private final AttachmentEntityListener attachmentEntityListener;

  @PostConstruct
  private void init() {
    SessionFactoryImpl sessionFactory = entityManagerFactory.unwrap(SessionFactoryImpl.class);
    EventListenerRegistry registry =
        sessionFactory.getServiceRegistry().getService(EventListenerRegistry.class);
    registry.getEventListenerGroup(EventType.POST_DELETE).appendListener(attachmentEntityListener);
    registry.getEventListenerGroup(EventType.POST_INSERT).appendListener(attachmentEntityListener);
    registry.getEventListenerGroup(EventType.POST_UPDATE).appendListener(attachmentEntityListener);
  }
}
