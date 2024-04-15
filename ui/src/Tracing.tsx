import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { BatchSpanProcessor, WebTracerConfig, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';

export function initializeOpenTelemetry(): void {
    const resource = new Resource({
        [SEMRESATTRS_SERVICE_NAME]: "Snomio UI",
    });
    
    const providerConfig: WebTracerConfig = {
        resource: resource,
    };    
    const provider = new WebTracerProvider(providerConfig);
    const exporter = new OTLPTraceExporter({
      url: '/api/telemetry', // url is optional and can be omitted - default is http://localhost:4318/v1/traces
      headers: {
        'Content-Type': 'application/json'
      }, // an optional object containing custom headers to be sent with each request
      concurrencyLimit: 10, // an optional limit on pending requests
    });
    provider.addSpanProcessor(new BatchSpanProcessor(exporter, {
      // The maximum queue size. After the size is reached spans are dropped.
      maxQueueSize: 100,
      // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
      maxExportBatchSize: 10,
      // The interval between two consecutive exports
      scheduledDelayMillis: 500,
      // How long the export can run before it is cancelled
      exportTimeoutMillis: 30000,
    }));
    
    provider.register({
        contextManager: new ZoneContextManager(),
      });
      
    registerInstrumentations({
      instrumentations: [
        getWebAutoInstrumentations(),
      ],
    });
    
}
