package com.csiro.eclrefset;

import lombok.extern.java.Log;

@Log
public final class LogThresholdInfo {

    private static final int THRESHOLD_EXCEEDED_ERROR_CODE = 1; 
    
    /** returns 1 if threshold exceeded, otherwise 1 */
    public static int logAdd(String refSetId, Integer addCount, Integer totalCount, double percentChangeThreshold, FileAppender fileAppender) {
        return log(refSetId, "add", addCount, totalCount, percentChangeThreshold, fileAppender);
    }

    /** returns 1 if threshold exceeded, otherwise 1 */
    public static int logRemove(String refSetId, Integer removeCount, Integer totalCount, double percentChangeThreshold, FileAppender fileAppender) {
        return log(refSetId, "remove", removeCount, totalCount, percentChangeThreshold, fileAppender);
    }

    /** returns 1 if threshold exceeded, otherwise 1 */
    private static int log(String refSetId, String mode, Integer count, Integer totalCount, double percentChangeThreshold, FileAppender fileAppender) {

        int return_code = 0;

        log.info("### To " + mode + " count: " + count);
        if (count > 0) {
            double countThreshold = totalCount * percentChangeThreshold;
            log.info("### Total count before " + mode + ": " + totalCount);
            if (totalCount.intValue() == 0) {
                log.info("### INFO: no pre-existing content for reference set, skipping threshold calculation");
            }
            else if (Double.compare(count, countThreshold) > 0) {
                log.info("### WARNING: " + count + " exceeds the " + percentChangeThreshold  + " PERCENT threshold of " + countThreshold);
                log.info("### This action has been carried out, this is just a notification");
                // store all the details in a file that will get emailed to notify of the percent threshold been exceeded
                fileAppender.appendToFile("### WARNING: " + count + " has exceeded the " + percentChangeThreshold  + " PERCENT threshold of " + countThreshold + " for refset " + refSetId);
                fileAppender.appendToFile("### Performing a " + mode + " with a count of: " + count);
                fileAppender.appendToFile("### Total count before " + mode + "was : " + totalCount);
                fileAppender.appendToFile("### This action has been carried out, this is just a notification");
                return_code = THRESHOLD_EXCEEDED_ERROR_CODE;
            }
            else {
                log.info("### INFO: " + count + " does not exceed the " + percentChangeThreshold  + " threshold of " + countThreshold);
            }
        }

        return return_code;
    }
}
