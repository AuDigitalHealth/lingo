///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

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
