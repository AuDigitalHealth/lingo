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
package au.gov.digitalhealth.lingo.service;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Objects;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Lookup;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.stereotype.Component;

@Component("branchAwareKeyGenerator")
public abstract class BranchAwareKeyGenerator implements KeyGenerator {

  @Lookup
  protected abstract RequestScopedBranchTimestampService getBranchTimestampService();

  @Override
  @NonNull
  public Object generate(@NonNull Object target, @NonNull Method method, Object... params) {
    if (params.length > 0 && params[0] instanceof String branch) {
      Long timestamp = getBranchTimestampService().getBranchTimestamp(branch);

      // Create a key that combines branch name, timestamp, and method parameters
      return new BranchTimestampKey(
          branch, timestamp, Arrays.copyOfRange(params, 1, params.length));
    }

    // Fallback if branch parameter isn't available
    return new SimpleKey(params);
  }

  /** A key class that includes branch and timestamp */
  static class BranchTimestampKey {
    private final String branch;
    private final Long timestamp;
    private final Object[] params;

    public BranchTimestampKey(String branch, Long timestamp, Object[] params) {
      this.branch = branch;
      this.timestamp = timestamp;
      this.params = params;
    }

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      BranchTimestampKey that = (BranchTimestampKey) o;
      return Objects.equals(branch, that.branch)
          && Objects.equals(timestamp, that.timestamp)
          && Arrays.equals(params, that.params);
    }

    @Override
    public int hashCode() {
      int result = Objects.hash(branch, timestamp);
      result = 31 * result + Arrays.hashCode(params);
      return result;
    }

    @Override
    public String toString() {
      return String.format(
          "Branch[%s]_Time[%d]_Params%s", branch, timestamp, Arrays.toString(params));
    }
  }
}
