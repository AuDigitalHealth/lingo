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
import au.gov.digitalhealth.tickets.models.TaskAssociation;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.TaskAssociationRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class PriorityBucketControllerTest extends TicketTestBaseLocal {

  @Autowired private TicketRepository ticketRepository;

  @Autowired private TaskAssociationRepository taskAssociationRepository;

  @Test
  void deletePriorityBucketOnTicketWithTaskAssociationReturns204() {
    // Reproduces LINGO-NPC-9J: the delete endpoint previously returned the Ticket entity, and
    // Jackson failed serialising its lazy `taskAssociation` proxy, 500ing every delete on a ticket
    // that had an associated task. The endpoint now returns an empty 204, so nothing is serialised.
    Ticket ticket =
        ticketRepository.save(
            Ticket.builder()
                .title("LINGO-NPC-9J regression")
                .description("ticket with a task association")
                .build());

    TaskAssociation taskAssociation = new TaskAssociation();
    taskAssociation.setTicket(ticket);
    taskAssociation.setTaskId("AU-9J-regression");
    taskAssociationRepository.save(taskAssociation);

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .delete(this.getSnomioLocation() + "/api/tickets/" + ticket.getId() + "/priorityBuckets")
        .then()
        .statusCode(204);
  }

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
    Assertions.assertEquals(3, order.intValue());

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
    Assertions.assertEquals(2, order.intValue());

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
    Assertions.assertEquals("Will reorder list", middleBucketReturned.getDescription());
    PriorityBucket finalBucketReturned = allBuckets[4];
    Assertions.assertEquals("Won't reorder list", finalBucketReturned.getDescription());
  }
}
