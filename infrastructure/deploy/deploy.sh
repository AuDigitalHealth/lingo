#!/bin/bash

if [ -f "setenv.sh" ]; then
  echo "Using setenv to set variables"
  source setenv.sh
fi

SNOMIO_ENV=${SNOMIO_ENV:-dev}
DB_USER=${DB_USER:snomioapi_dev}
KUBECONFIG=${KUBECONFIG:-~/.kube/config}
SNOMIO_IMAGE_TAG=${SNOMIO_IMAGE_TAG:-snomio-20230824.1_main}
HELM_LOCATION=${HELM_LOCATION:-./helm}
AZ_ACCOUNTKEY=${AZ_ACCOUNTKEY:-settheenvvar}

helm upgrade --install --kubeconfig ${KUBECONFIG} --namespace snomio-${SNOMIO_ENV} --values snomio-${SNOMIO_ENV}.yaml \
  --set snomio.image="nctsacr.azurecr.io/snomio:${SNOMIO_IMAGE_TAG}" \
  --set snomio.config."spring\.datasource\.username"=${DB_USER} \
  --set snomio.database.password="${DB_PASSWORD}" \
  --set snomio.attachments.store.azaccountkey="${AZ_ACCOUNTKEY}" \
  --wait --create-namespace snomio-${SNOMIO_ENV} ${HELM_LOCATION}