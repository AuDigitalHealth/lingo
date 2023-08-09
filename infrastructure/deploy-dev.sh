#!/bin/bash

helm upgrade --install --namespace snomio-dev --values snomio-dev.yaml \
  --set snomio.image='nctsacr.azurecr.io/snomio:snomio-20230809.1_main' \
  --wait --create-namespace snomio-dev ./helm