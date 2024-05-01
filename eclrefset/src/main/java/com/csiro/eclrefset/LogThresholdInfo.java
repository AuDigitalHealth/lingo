package com.csiro.eclrefset;

import lombok.extern.java.Log;

@Log
public final class LogThresholdInfo {

    private static final int THRESHOLD_EXCEEDED_ERROR_CODE = 1; 
    
    /** returns 1 if threshold exceeded, otherwise 1 */
    public static int logAdd(Integer addCount, Integer totalCount, double percentChangeThreshold) {
        return log("add", addCount, totalCount, percentChangeThreshold);
    }

    /** returns 1 if threshold exceeded, otherwise 1 */
    public static int logRemove(Integer removeCount, Integer totalCount, double percentChangeThreshold) {
        return log("remove", removeCount, totalCount, percentChangeThreshold);
    }

    /** returns 1 if threshold exceeded, otherwise 1 */
    private static int log(String mode, Integer count, Integer totalCount, double percentChangeThreshold) {

        int return_code = 0;

        log.info("### To " + mode + " count: " + count);
        if (count > 0) {
            double countThreshold = totalCount * percentChangeThreshold;
            log.info("### Total count before " + mode + ": " + totalCount);
            if (totalCount.intValue() == 0) {
                log.info("### INFO: no pre-existing content for reference set, skipping threshold calculation");
            }
            else if (Double.compare(count, countThreshold) > 0) {
                //TODO: notify by email
                log.info("### WARNING: " + count + " exceeds the " + percentChangeThreshold  + " threshold of " + countThreshold);
                return_code = THRESHOLD_EXCEEDED_ERROR_CODE;
            }
            else {
                log.info("### INFO: " + count + " does not exceed the " + percentChangeThreshold  + " threshold of " + countThreshold);
            }
        }

        return return_code;
    }
}
