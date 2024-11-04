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
