package com.csiro.eclrefset;

import com.csiro.tickets.JobResultDto.ResultDto;
import com.csiro.tickets.JobResultDto.ResultDto.ResultNotificationDto;
import com.csiro.tickets.JobResultDto.ResultDto.ResultNotificationDto.ResultNotificationType;
import lombok.extern.java.Log;

@Log
public final class LogThresholdInfo {

    private static final int THRESHOLD_EXCEEDED_ERROR_CODE = 1;
    
    public static final String ACTION_HAS_NOT_BEEN_CARRIED_OUT_MESSAGE = "This action HAS NOT been carried out.  You will need to investigate and fix the ECL, or override the count threshold check by setting the ignore-refset-count-change-threshold-error variable to true";

    public static final String ACTION_HAS_BEEN_CARRIED_OUT_MESSAGE = "As you have chosen to IGNORE this warning, this action HAS been carried out.";
    public static final String COUNT_THRESHOLD_MESSAGE = "ERROR: %d has exceeded the COUNT threshold of %d for refset %s while attempting to %s concepts";
    /** returns 1 if threshold exceeded, otherwise 1 */
    public static int logAdd(String refSetId, Integer addCount, Integer totalCount, double percentChangeThreshold, FileAppender fileAppender, ResultDto resultDto) {
        return log(refSetId, "add", addCount, totalCount, percentChangeThreshold, fileAppender, resultDto);
    }

    /** returns 1 if threshold exceeded, otherwise 1 */
    public static int logRemove(String refSetId, Integer removeCount, Integer totalCount, double percentChangeThreshold, FileAppender fileAppender, ResultDto resultDto) {
        return log(refSetId, "remove", removeCount, totalCount, percentChangeThreshold, fileAppender, resultDto);
    }

    /** returns 1 if threshold exceeded, otherwise 1 */
    private static int log(String refSetId, String mode, Integer count, Integer totalCount, double percentChangeThreshold, FileAppender fileAppender, ResultDto resultDto) {

        int return_code = 0;

        log.info("### To " + mode + " count: " + count);
        if (count > 0) {
            double countThreshold = totalCount * percentChangeThreshold;
            log.info("### Total count before " + mode + ": " + totalCount);
            if (totalCount.intValue() == 0) {
                log.info("### INFO: no pre-existing content for reference set, skipping threshold calculation");
            }
            else if (Double.compare(count, countThreshold) > 0) {
                String warningMessage = "WARNING: " + count + " exceeds the " + percentChangeThreshold  + " PERCENT threshold of " + countThreshold;
                log.info("###" + warningMessage);
                String carriedOutMessage = "This action has been carried out, this is just a notification";
                log.info("###" + carriedOutMessage);

                if(resultDto.getNotification() != null){
                    resultDto.getNotification().setDescription(resultDto.getNotification().getDescription() + ". " + warningMessage + ". " + carriedOutMessage);
                } else {
                    resultDto.setNotification(ResultNotificationDto.builder().type(
                        ResultNotificationType.WARNING).description(warningMessage + "\n\n " + carriedOutMessage).build());
                }

                // store all the details in a file that will get emailed to notify of the percent threshold been exceeded;
                fileAppender.appendToFile("### WARNING: Attempting to " + mode + " " + count +  " members for refset " + refSetId + " has exceeded the PERCENT threshold of " + percentChangeThreshold + ".");
                fileAppender.appendToFile("### This action has been carried out, this is just a notification.");
                return_code = THRESHOLD_EXCEEDED_ERROR_CODE;
            }
            else {
                log.info("### INFO: " + count + " does not exceed the " + percentChangeThreshold  + " threshold of " + countThreshold);
            }
        }

        return return_code;
    }
}
