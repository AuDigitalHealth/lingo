#!/bin/bash

set -e

AZURE_STORAGE_ACCOUNT="nctsdevstorage"
end=$(date -u -v+60M '+%Y-%m-%dT%H:%MZ')
FILE_SHARE="snomio-dev-attachments"
SAS_URL=$(az storage share generate-sas -n ${FILE_SHARE} --account-name nctsdevstorage --https-only --permissions dlrw --expiry $end -o tsv)

SYNC_URL="https://${AZURE_STORAGE_ACCOUNT}.file.core.windows.net/${FILE_SHARE}/?${SAS_URL}"

echo $SYNC_URL

azcopy sync /opt/data/ "${SYNC_URL}" --recursive --delete-destination=true