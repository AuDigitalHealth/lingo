#!/bin/bash

if [ "${DB_USER}" == "" ]; then
  echo "### ERROR: You must provide a database user via the DB_USER environment variable!"
  exit 1
fi

if [ "${DB_PASSWORD}" == "" ]; then
  echo "### ERROR: You must provide a database password via the DB_PASSWORD environment variable!"
  exit 1
fi


SNOMIO_ENV=${SNOMIO_ENV:-dev}
KUBECONFIG=${KUBECONFIG:-~/.kube/config}
SNOMIO_IMAGE_TAG=${SNOMIO_IMAGE_TAG:-snomio-20230824.1_main}
HELM_LOCATION=${HELM_LOCATION:-./helm}

helm upgrade --install --kubeconfig ${KUBECONFIG} --namespace snomio-${SNOMIO_ENV} --values snomio-${SNOMIO_ENV}.yaml \
  --set snomio.image="nctsacr.azurecr.io/snomio:${SNOMIO_IMAGE_TAG}" \
  --set snomio.config."spring\.datasource\.username="="${DB_USER}" \
  --set snomio.config."spring\.datasource\.password="="${DB_PASSWORD}" \
  --wait --create-namespace snomio-${SNOMIO_ENV} ${HELM_LOCATION}