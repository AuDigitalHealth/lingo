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
package au.gov.digitalhealth.tickets.controllers;

import au.gov.digitalhealth.tickets.TicketTestBaseLocal;
import au.gov.digitalhealth.tickets.models.PriorityBucket;
import io.restassured.http.ContentType;
import org.junit.Assert;
import org.junit.jupiter.api.Test;

class PriorityBucketControllerTest extends TicketTestBaseLocal {

  @Test
  void getAllBuckets() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/tickets/priorityBuckets")
        .then()
        .statusCode(200)
        .extract()
        .as(PriorityBucket[].class);
  }

  @Test
  void createPriorityBucket() {
    PriorityBucket newPriorityBucket =
        PriorityBucket.builder()
            .name("Add to end")
            .description("Won't reorder list")
            .orderIndex(3)
            .build();

    PriorityBucket newBucket =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(newPriorityBucket)
            .post(this.getSnomioLocation() + "/api/tickets/priorityBuckets")
            .then()
            .statusCode(200)
            .extract()
            .as(PriorityBucket.class);
    Integer order = newBucket.getOrderIndex();
    Assert.assertEquals(3, order.intValue());

    PriorityBucket newPriorityBucketMiddle =
        PriorityBucket.builder()
            .name("Add to middle")
            .description("Will reorder list")
            .orderIndex(2)
            .build();

    PriorityBucket newBucketMiddle =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(newPriorityBucketMiddle)
            .post(this.getSnomioLocation() + "/api/tickets/priorityBuckets")
            .then()
            .statusCode(200)
            .extract()
            .as(PriorityBucket.class);
    order = newBucketMiddle.getOrderIndex();
    Assert.assertEquals(2, order.intValue());

    PriorityBucket[] allBuckets =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/priorityBuckets")
            .then()
            .statusCode(200)
            .extract()
            .as(PriorityBucket[].class);

    PriorityBucket middleBucketReturned = allBuckets[2];
    Assert.assertEquals("Will reorder list", middleBucketReturned.getDescription());
    PriorityBucket finalBucketReturned = allBuckets[4];
    Assert.assertEquals("Won't reorder list", finalBucketReturned.getDescription());
  }
}
