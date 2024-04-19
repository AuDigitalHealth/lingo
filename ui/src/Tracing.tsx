import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import {
  BatchSpanProcessor,
  WebTracerConfig,
  WebTracerProvider,
} from '@opentelemetry/sdk-trace-web';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { B3Propagator } from '@opentelemetry/propagator-b3';

export function initializeOpenTelemetry(): void {
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
  provider.addSpanProcessor(
    new BatchSpanProcessor(exporter, {
      // The maximum queue size. After the size is reached spans are dropped.
      maxQueueSize: 100,
      // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
      maxExportBatchSize: 10,
      // The interval between two consecutive exports
      scheduledDelayMillis: 500,
      // How long the export can run before it is cancelled
      exportTimeoutMillis: 30000,
    }),
  );

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  provider.register({
    propagator: new B3Propagator(),
  });

  registerInstrumentations({
    instrumentations: [getWebAutoInstrumentations()],
  });
}
