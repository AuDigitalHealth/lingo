package com.csiro.snomio.extension;

/* Extensions should implement this so Snomio Can recognise them */
public interface SnomioExtension {
  void initialise();

  void shutdown();
}
