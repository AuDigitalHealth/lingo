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
package au.gov.digitalhealth.eclrefset;

import au.gov.digitalhealth.eclrefset.model.addorremovequeryresponse.AddOrRemoveQueryResponse;
import lombok.extern.java.Log;
import org.springframework.web.client.RestTemplate;

@Log
public class AddRemoveQueryThread extends Thread {

  RestTemplate restTemplate;
  String baseQuery;
  AddOrRemoveQueryResponse allQueryResponse;
  int threadCount;
  int offset;
  int limit;

  public AddRemoveQueryThread(
      RestTemplate restTemplate,
      String baseQuery,
      AddOrRemoveQueryResponse allQueryResponse,
      int threadCount,
      int offset,
      int limit) {
    this.restTemplate = restTemplate;
    this.baseQuery = baseQuery;
    this.allQueryResponse = allQueryResponse;
    this.threadCount = threadCount;
    this.offset = offset;
    this.limit = limit;
  }

  @Override
  @SuppressWarnings("java:S1192")
  public void run() {

    log.fine("Thread:" + threadCount + " started");

    String query = baseQuery + "&offset=" + (offset + limit);

    log.fine("Thread:" + threadCount + " processing from offset=" + (offset + limit));

    long startTime = System.nanoTime();

    AddOrRemoveQueryResponse nextQueryResponse =
        restTemplate.getForObject(query, AddOrRemoveQueryResponse.class);

    long endTime = System.nanoTime();
    long elapsedTime = endTime - startTime;
    double elapsedTimeInSeconds = elapsedTime / 1_000_000_000.0;

    log.fine("Thread:" + threadCount + " query took " + elapsedTimeInSeconds + " seconds.");

    allQueryResponse.getItems().addAll(nextQueryResponse.getItems());

    log.fine("Thread:" + threadCount + " finished");
  }
}
