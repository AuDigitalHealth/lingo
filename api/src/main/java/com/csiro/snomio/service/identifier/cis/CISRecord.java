package com.csiro.snomio.service.identifier.cis;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.io.Serializable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@JsonIgnoreProperties(ignoreUnknown = true)
@Getter
@Setter
@NoArgsConstructor
public class CISRecord implements Serializable {

  private static final long serialVersionUID = -2727499661155145447L;

  private String sctid;
  private String status;

  public CISRecord(Long sctid) {
    this.sctid = sctid.toString();
  }

  public Long getSctidAsLong() {
    return Long.parseLong(sctid);
  }
}
