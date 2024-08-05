package com.csiro.eclrefset;

import org.springframework.web.client.RestTemplate;

import com.csiro.eclrefset.model.addorremovequeryresponse.AddOrRemoveQueryResponse;

import lombok.extern.java.Log;

@Log
public class AddRemoveQueryThread extends Thread {

    RestTemplate restTemplate;
    String baseQuery;
    AddOrRemoveQueryResponse allQueryResponse;
    int threadCount;
    int offset;
    int limit;

    public AddRemoveQueryThread(RestTemplate restTemplate, String baseQuery, AddOrRemoveQueryResponse allQueryResponse,
            int threadCount, int offset, int limit) {
        this.restTemplate = restTemplate;
        this.baseQuery = baseQuery;
        this.allQueryResponse = allQueryResponse;
        this.threadCount = threadCount;
        this.offset = offset;
        this.limit = limit;
    }

    public void run() {

        log.fine("Thread:" + threadCount + " started");

        String query = baseQuery + "&offset=" + (offset + limit);

        log.fine("Thread:" + threadCount + " processing from offset=" + (offset + limit));

        long startTime = System.nanoTime();

        AddOrRemoveQueryResponse nextQueryResponse = restTemplate.getForObject(query,
                AddOrRemoveQueryResponse.class);

        long endTime = System.nanoTime();
        long elapsedTime = endTime - startTime;
        double elapsedTimeInSeconds = (double) elapsedTime / 1_000_000_000.0;

        log.fine("Thread:" + threadCount + " query took " + elapsedTimeInSeconds + " seconds.");

        allQueryResponse.getItems().addAll(nextQueryResponse.getItems());

        log.fine("Thread:" + threadCount + " finished");
    }

}