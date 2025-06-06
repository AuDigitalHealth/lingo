package au.gov.digitalhealth.lingo.configuration;

import java.util.concurrent.Executor;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.aop.interceptor.SimpleAsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

  @Override
  public Executor getAsyncExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(10);
    executor.setMaxPoolSize(20);
    executor.setQueueCapacity(25);
    executor.setThreadNamePrefix("async-");

    // This decorator preserves request context for all async tasks
    executor.setTaskDecorator(
        task -> {
          RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
          Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

          return () -> {
            RequestAttributes oldAttributes = RequestContextHolder.getRequestAttributes();
            Authentication oldAuthentication =
                SecurityContextHolder.getContext().getAuthentication();
            try {
              if (attributes != null) {
                RequestContextHolder.setRequestAttributes(attributes);
              }
              if (authentication != null) {
                SecurityContextHolder.getContext().setAuthentication(authentication);
              }
              task.run();
            } finally {
              RequestContextHolder.setRequestAttributes(oldAttributes);
              SecurityContextHolder.getContext().setAuthentication(oldAuthentication);
            }
          };
        });

    executor.initialize();
    return executor;
  }

  // Exception handler for async tasks
  @Override
  public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
    return new SimpleAsyncUncaughtExceptionHandler();
  }
}
