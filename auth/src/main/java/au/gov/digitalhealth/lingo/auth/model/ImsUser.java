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
package au.gov.digitalhealth.lingo.auth.model;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ImsUser {

  private String login;

  private String firstName;

  private String lastName;

  private String email;

  private String langKey;

  private List<String> roles;

  @SuppressWarnings("unchecked")
  public ImsUser(Map<String, Object> user) {
    this.login = (String) user.get("login");
    this.firstName = (String) user.get("firstName");
    this.lastName = (String) user.get("lastName");
    this.email = (String) user.get("email");
    this.langKey = (String) user.get("langKey");
    this.roles = (List<String>) user.get("roles");
  }
}
