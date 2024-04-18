import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Span } from '@opentelemetry/api';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import {
  FetchInstrumentation,
  FetchCustomAttributeFunction,
} from '@opentelemetry/instrumentation-fetch';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import {
  BatchSpanProcessor,
  WebTracerConfig,
  WebTracerProvider,
} from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { FetchError } from '@opentelemetry/instrumentation-fetch/build/src/types';
import { B3Propagator } from '@opentelemetry/propagator-b3';

const customAttributesFunction: FetchCustomAttributeFunction = (
  span: Span,
  request: Request | RequestInit,
  response: Response | FetchError,
): void => {
  if (
    'method' in request &&
    request.method === 'POST' &&
    'body' in request &&
    request.body
  ) {
    if (request instanceof Request) {
      // Safe to clone if the request is an instance of Request
      const clonedRequest = request.clone();
      clonedRequest
        .text()
        .then(text => {
          span.setAttribute('http.request.body', text);
        })
        .catch(error => {
          console.error('Error cloning request for telemetry:', error);
        });
    } else if (typeof request.body === 'string') {
      // Here handle cases where request is of type RequestInit and has a body
      // This might involve checking if the body can be read directly or needs special handling
      span.setAttribute('http.request.body', request.body);
    }
  }
};

const fetchInstrumentation = new FetchInstrumentation({
  applyCustomAttributesOnSpan: customAttributesFunction,
});

interface CustomXMLHttpRequest extends XMLHttpRequest {
  _method?: string;
  _body?: Document | BodyInit | null;
}

function wrapXHR() {
  const originalOpen = XMLHttpRequest.prototype.open.bind(
    XMLHttpRequest.prototype,
  );
  const originalSend = XMLHttpRequest.prototype.send.bind(
    XMLHttpRequest.prototype,
  );

  XMLHttpRequest.prototype.open = function (
    this: CustomXMLHttpRequest,
    method: string,
    url: string,
    async: boolean | undefined = true,
    user?: string,
    password?: string,
  ): void {
    this._method = method; // Capture method for later use
    return originalOpen.call(this, method, url, async ?? true, user, password);
  };

  XMLHttpRequest.prototype.send = function (
    this: CustomXMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null,
  ): void {
    this._body = body;

    // Before calling the original send method, ensure that the body is not a ReadableStream
    if (body instanceof ReadableStream) {
      console.error(
        'ReadableStream bodies are not supported by XMLHttpRequest',
      );
      return;
    }
    return originalSend.call(this, body);
  };
}

const xhrInstrumentation = new XMLHttpRequestInstrumentation({
  applyCustomAttributesOnSpan: (span: Span, xhr: XMLHttpRequest) => {
    const customXhr = xhr as CustomXMLHttpRequest;
    if (
      xhr.readyState === 4 &&
      customXhr._method === 'POST' &&
      customXhr._body
    ) {
      const bodyContent =
        typeof customXhr._body === 'string'
          ? customXhr._body
          : JSON.stringify(customXhr._body);
      span.setAttribute('http.request.body', bodyContent);
    }
  },
});

export function initializeOpenTelemetry(): void {
  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'snomio-ui',
  });

  const providerConfig: WebTracerConfig = {
    resource: resource,
  };
  const provider = new WebTracerProvider(providerConfig);
  const exporter = new OTLPTraceExporter({
    url: '/api/telemetry',
    headers: {
      'Content-Type': 'application/json',
    },
    concurrencyLimit: 10,
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

  wrapXHR();
  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      fetchInstrumentation, // Use custom instrumentation
      new UserInteractionInstrumentation(),
      xhrInstrumentation, // Use custom instrumentation
    ],
  });
}
