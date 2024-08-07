package com.csiro.snomio.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.csiro.snomio.exception.SnomioProblem;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class BranchPatternMatcherTest {

  @Test
  void testIsTaskPattern() {
    // Valid task patterns
    assertTrue(BranchPatternMatcher.isTaskPattern("main|project|project|id"));
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
    SnomioProblem exception =
        assertThrows(
            SnomioProblem.class,
            () -> BranchPatternMatcher.getProjectFromTask("project|task|type"));
    assertEquals(
        "500 INTERNAL_SERVER_ERROR, ProblemDetail[type='http://snomio.csiro.au/problem/branch-pattern', title='Branch project|task|type is not a task pattern, cannot extract project', status=500, detail='null', instance='null', properties='null']",
        exception.getMessage());

    exception =
        assertThrows(
            SnomioProblem.class,
            () -> BranchPatternMatcher.getProjectFromTask("project|task|type|id|extra"));
    assertEquals(
        "500 INTERNAL_SERVER_ERROR, ProblemDetail[type='http://snomio.csiro.au/problem/branch-pattern', title='Branch project|task|type|id|extra is not a task pattern, cannot extract project', status=500, detail='null', instance='null', properties='null']",
        exception.getMessage());
    assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exception.getStatusCode());
  }
}
