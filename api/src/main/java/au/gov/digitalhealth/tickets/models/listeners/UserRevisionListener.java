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

import au.gov.digitalhealth.lingo.auth.model.ImsUser;
import au.gov.digitalhealth.tickets.models.CustomRevInfo;
import org.hibernate.envers.RevisionListener;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

public class UserRevisionListener implements RevisionListener {
  @Override
  public void newRevision(Object revisionEntity) {
    CustomRevInfo revInfo = (CustomRevInfo) revisionEntity;

    try {
      // Safely get current user from Spring Security context
      SecurityContext securityContext = SecurityContextHolder.getContext();
      Authentication authentication =
          securityContext != null ? securityContext.getAuthentication() : null;

      if (authentication != null && authentication.getPrincipal() instanceof ImsUser) {
        ImsUser user = (ImsUser) authentication.getPrincipal();
        revInfo.setUsername(user.getLogin());
      } else {
        revInfo.setUsername("system");
      }
    } catch (Exception e) {
      // Fallback to system if any exception occurs
      revInfo.setUsername("system");
    }
  }
}
