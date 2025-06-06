package au.gov.digitalhealth.lingo.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;

@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
@Log
public class RequestScopedBranchTimestampService {
  private final Map<String, Long> branchTimestamps = new ConcurrentHashMap<>();
  private final SnowstormClient snowstormClient;

  @Autowired
  public RequestScopedBranchTimestampService(SnowstormClient snowstormClient) {
    this.snowstormClient = snowstormClient;
  }

  /** Get the current timestamp for a branch, calculating it only once per request. */
  public Long getBranchTimestamp(String branch) {
    return branchTimestamps.computeIfAbsent(branch, this::fetchBranchTimestamp);
  }

  private Long fetchBranchTimestamp(String branch) {
    Long timestamp = snowstormClient.getBranchHeadTimestamp(branch);
    log.fine("Fetched timestamp for branch " + branch + ": " + timestamp);
    return timestamp;
  }
}
