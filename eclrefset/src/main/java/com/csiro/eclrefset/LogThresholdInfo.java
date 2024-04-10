package com.csiro.eclrefset;

import lombok.extern.java.Log;

@Log
public final class LogThresholdInfo {
    
    public static void logAdd(Integer addCount, Integer totalCount, double percentChangeThreshold) {
        log("add", addCount, totalCount, percentChangeThreshold);
    }

    public static void logRemove(Integer removeCount, Integer totalCount, double percentChangeThreshold) {
        log("remove", removeCount, totalCount, percentChangeThreshold);
    }

    private static void log(String mode, Integer count, Integer totalCount, double percentChangeThreshold) {
        log.info("### To " + mode + " count: " + count);
        if (count > 0) {
            log.info("### Total count before " + mode + ": " + totalCount);
            double percentChange = count / totalCount;
            if (percentChange >= percentChangeThreshold) {
                //TODO: notify by email
                log.info("### WARNING: " + count + " exceeds the " + percentChangeThreshold  + " threshold of " + totalCount * percentChangeThreshold);
            }
            else {
                log.info("### INFO: " + count + " does not exceed the " + percentChangeThreshold  + " threshold of " + totalCount * percentChangeThreshold);
            }
        }
    }
}
