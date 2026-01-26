#!/usr/bin/env bash
set -euo pipefail

# Azure Container Apps - Switch traffic from BLUE to GREEN

: "${AZURE_RESOURCE_GROUP_NAME:?AZURE_RESOURCE_GROUP_NAME is required}"
: "${AZURE_CONTAINER_APP_NAME:?AZURE_CONTAINER_APP_NAME is required}"
: "${GREEN_ID:?GREEN_ID is required}"
# BLUE_ID may be empty on first deployment
BLUE_ID="${BLUE_ID:-}"

echo "Switching traffic BLUE -> GREEN for Container App:"
echo "  app: $AZURE_CONTAINER_APP_NAME"
echo "  green: $GREEN_ID"
echo "  blue: ${BLUE_ID:-<none>}"

if [ -n "$BLUE_ID" ]; then
  az containerapp ingress traffic set \
    --name "$AZURE_CONTAINER_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP_NAME" \
    --revision-weight "${GREEN_ID}=100" "${BLUE_ID}=0" 1>/dev/null
else
  az containerapp ingress traffic set \
    --name "$AZURE_CONTAINER_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP_NAME" \
    --revision-weight "${GREEN_ID}=100" 1>/dev/null
fi

echo "✅ Traffic switched to GREEN."
