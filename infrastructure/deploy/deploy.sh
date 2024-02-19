#!/bin/bash

if [ -f "setenv.sh" ]; then
  echo "Using setenv to set variables"
  source setenv.sh
fi

SNOMIO_ENV=${SNOMIO_ENV:-dev}
DB_USER=${DB_USER:-snomioapi_dev}
IMS_USERNAME=${IMS_USERNAME:-defaultuser}
IMS_PASSWORD=${IMS_PASSWORD:-defaultpassword}
KUBECONFIG=${KUBECONFIG:-~/.kube/config}
SNOMIO_IMAGE_TAG=${SNOMIO_IMAGE_TAG:-snomio-20230824.1_main}
HELM_LOCATION=${HELM_LOCATION:-./helm}
AZ_ACCOUNTKEY=${AZ_ACCOUNTKEY:-settheenvvar}
NAMEGEN_API_URL=${NAMEGEN_API_URL:-https://amt-namegenerator.azurewebsites.net/api/amt_name_gen}

helm upgrade --install --kubeconfig ${KUBECONFIG} --namespace snomio-${SNOMIO_ENV} --values snomio-${SNOMIO_ENV}.yaml \
  --set snomio.image="nctsacr.azurecr.io/snomio:${SNOMIO_IMAGE_TAG}" \
  --set snomio.config."spring\.datasource\.username"=${DB_USER} \
  --set snomio.config."ims-username"=${IMS_USERNAME} \
  --set snomio.config."ims-password"=${IMS_PASSWORD} \
  --set snomio.config."name\.generator\.api\.url"="${NAMEGEN_API_URL}" \
  --set snomio.database.password="${DB_PASSWORD}" \
  --set snomio.attachments.store.azaccountkey="${AZ_ACCOUNTKEY}" \
  --wait --create-namespace snomio-${SNOMIO_ENV} ${HELM_LOCATION}