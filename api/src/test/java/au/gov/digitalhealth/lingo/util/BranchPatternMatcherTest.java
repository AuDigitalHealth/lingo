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
package au.gov.digitalhealth.lingo.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class BranchPatternMatcherTest {

  @Test
  void testIsTaskPattern() {
    // Valid task patterns
    Assertions.assertTrue(BranchPatternMatcher.isTaskPattern("main|project|project|id"));
    assertTrue(BranchPatternMatcher.isTaskPattern("a|b|c|d"));
    assertTrue(BranchPatternMatcher.isTaskPattern("1|2|3|4"));

    // Invalid task patterns
    assertFalse(BranchPatternMatcher.isTaskPattern("project|task|type"));
    assertFalse(BranchPatternMatcher.isTaskPattern("project|task|type|id|extra"));
    assertFalse(BranchPatternMatcher.isTaskPattern("project|task|type|"));
    assertFalse(BranchPatternMatcher.isTaskPattern("|task|type|id"));
    assertFalse(BranchPatternMatcher.isTaskPattern("project|task||id"));
    assertFalse(BranchPatternMatcher.isTaskPattern("project|task|type|id|"));
  }

  @Test
  void testGetProjectFromTask() {
    // Valid task pattern
    assertEquals(
        "project|task|type", BranchPatternMatcher.getProjectFromTask("project|task|type|id"));

    // Invalid task patterns
    LingoProblem exception =
        assertThrows(
            LingoProblem.class, () -> BranchPatternMatcher.getProjectFromTask("project|task|type"));
    assertEquals(
        "500 INTERNAL_SERVER_ERROR, ProblemDetail[type='http://lingo.csiro.au/problem/branch-pattern', title='Branch project|task|type is not a task pattern, cannot extract project', status=500, detail='null', instance='null', properties='null']",
        exception.getMessage());

    exception =
        assertThrows(
            LingoProblem.class,
            () -> BranchPatternMatcher.getProjectFromTask("project|task|type|id|extra"));
    assertEquals(
        "500 INTERNAL_SERVER_ERROR, ProblemDetail[type='http://lingo.csiro.au/problem/branch-pattern', title='Branch project|task|type|id|extra is not a task pattern, cannot extract project', status=500, detail='null', instance='null', properties='null']",
        exception.getMessage());
    assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exception.getStatusCode());
  }
}
