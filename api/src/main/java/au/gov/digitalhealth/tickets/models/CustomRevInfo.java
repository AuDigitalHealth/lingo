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
package au.gov.digitalhealth.tickets.models;

import au.gov.digitalhealth.tickets.models.listeners.UserRevisionListener;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import org.hibernate.envers.RevisionEntity;
import org.hibernate.envers.RevisionNumber;
import org.hibernate.envers.RevisionTimestamp;

@Entity
@Table(name = "revinfo")
@RevisionEntity(UserRevisionListener.class)
public class CustomRevInfo {

  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "revinfo_seq_gen")
  @SequenceGenerator(name = "revinfo_seq_gen", sequenceName = "revinfo_seq")
  @RevisionNumber
  private int rev;

  @RevisionTimestamp private long revtstmp;

  @Column(name = "username")
  private String username;

  // Constructors, getters, setters
  public CustomRevInfo() {}

  public int getRev() {
    return rev;
  }

  public void setRev(int rev) {
    this.rev = rev;
  }

  public long getRevtstmp() {
    return revtstmp;
  }

  public void setRevtstmp(long revtstmp) {
    this.revtstmp = revtstmp;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }
}
