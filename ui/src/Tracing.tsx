import { registerInstrumentations } from '@opentelemetry/instrumentation';
import {
  BatchSpanProcessor,
  WebTracerConfig,
  WebTracerProvider,
} from '@opentelemetry/sdk-trace-web';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { B3Propagator, B3InjectEncoding } from '@opentelemetry/propagator-b3';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';

let initialized = false;

export function initializeOpenTelemetry(): void {
  // Both main.tsx and MainBody.tsx call this at module scope; registering the
  // provider and instrumentations twice double-wraps every event listener,
  // timer and fetch (two spans + two zone hops per interaction) (#1932).
  if (initialized) {
    return;
  }
  initialized = true;

  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'snomio-ui',
  });

  const providerConfig: WebTracerConfig = {
    resource: resource,
  };
  const provider = new WebTracerProvider(providerConfig);
  const exporter = new ZipkinExporter({
    url: '/api/telemetry',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));

  provider.register({
    contextManager: new ZoneContextManager(),
    propagator: new B3Propagator({
      injectEncoding: B3InjectEncoding.MULTI_HEADER,
    }),
  });

  const ignoreUrls = [/\/authoring-services\/authoring-services-websocket\//];
  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation({
        ignoreUrls: ignoreUrls,
      }),
      new UserInteractionInstrumentation(),
      new XMLHttpRequestInstrumentation({
        ignoreUrls: ignoreUrls,
      }),
    ],
  });
}
