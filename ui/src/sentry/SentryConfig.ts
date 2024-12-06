import * as Sentry from '@sentry/react';
import { SecureAppConfig } from '../types/applicationConfig.ts';

let sentryInitialized = false;

export const configureSentry = (
  applicationConfig: SecureAppConfig,
  releaseVersion: string | undefined,
) => {
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
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: parseFloat(applicationConfig.sentryTracesSampleRate),
      replaysOnErrorSampleRate: 1.0,
      environment: applicationConfig.sentryEnvironment,
      release: releaseVersion,
    });
    sentryInitialized = true;
  }
};
