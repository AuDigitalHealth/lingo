// SentryConfig.ts
import * as Sentry from '@sentry/react';
import { SecureAppConfig } from '../types/applicationConfig.ts';

// Track initialization state
let sentryInitialized = false;
let currentConfig: SecureAppConfig | null = null;

/**
 * Configure Sentry with the provided application config
 */
export const configureSentry = (
  applicationConfig: SecureAppConfig,
  releaseVersion: string | undefined,
) => {
  // Store the current configuration for later reference
  currentConfig = applicationConfig;

  if (!sentryInitialized && applicationConfig.sentryDsn) {
    Sentry.init({
      dsn: applicationConfig.sentryDsn,
      integrations: [
        Sentry.feedbackIntegration({
          showBranding: false,
          colorScheme: 'system',
          triggerLabel: '',
          formTitle: 'Help & Support',
          submitButtonLabel: 'Send Feedback',
          isEmailRequired: true,
          isNameRequired: true,
          messagePlaceholder:
            'Please enter details of your issue, or feedback on improving the solution.',
          isRequiredLabel: '*',
        }),
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: parseFloat(applicationConfig.sentryTracesSampleRate),
      replaysOnErrorSampleRate: 1.0,
      environment: applicationConfig.sentryEnvironment,
      release: releaseVersion,
    });
    sentryInitialized = true;
  }
};

/**
 * Check if Sentry is available and enabled
 */
export const isSentryAvailable = (): boolean => {
  return (
    !!currentConfig?.sentryEnabled &&
    sentryInitialized &&
    Sentry.isInitialized()
  );
};

/**
 * Show Sentry feedback dialog for reporting issues
 */
export const showSentryFeedbackDialog = (
  error: any,
  timestamp?: string,
): string => {
  if (!isSentryAvailable()) {
    throw new Error('Sentry is not available. Check configuration.');
  }

  const eventId = Sentry.captureException(error);

  let subtitle2 = 'Your feedback helps us improve.';
  if (timestamp) {
    subtitle2 = `Please include what led to this error and the timestamp: ${timestamp}`;
  }

  Sentry.showReportDialog({
    eventId: eventId,
    title: 'Something went wrong',
    subtitle: 'Our team has been notified',
    subtitle2: subtitle2,
  });

  return eventId;
};

// Export Sentry for direct use if needed
export { Sentry };
