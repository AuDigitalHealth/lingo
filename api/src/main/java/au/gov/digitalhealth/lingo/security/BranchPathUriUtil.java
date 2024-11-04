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
package au.gov.digitalhealth.lingo.security;

public class BranchPathUriUtil {

  public static final String SLASH = "/";
  public static final String ENCODED_PIPE = "%7C";
  public static final String ENCODED_SLASH = "%2F";

  private BranchPathUriUtil() {
    /* Prevent instantiation */
  }

  public static String encodePath(String path) {
    return path.replace(ENCODED_SLASH, ENCODED_PIPE).replace(SLASH, ENCODED_PIPE);
  }

  public static String decodePath(String branch) {
    return branch.replace("|", SLASH).replace(ENCODED_PIPE, SLASH);
  }
}
