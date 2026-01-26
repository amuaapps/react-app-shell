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

# Determine the label from the GREEN_ID
if [[ "$GREEN_ID" == *"green"* ]]; then
  GREEN_LABEL="green"
else
  GREEN_LABEL="blue"
fi

# Use label-based traffic switching to avoid triggering new deployments
if [ -n "$BLUE_ID" ]; then
  # Determine BLUE label
  if [[ "$BLUE_ID" == *"green"* ]]; then
    BLUE_LABEL="green"
  else
    BLUE_LABEL="blue"
  fi
  
  az containerapp ingress traffic set \
    --name "$AZURE_CONTAINER_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP_NAME" \
    --label-weight "${GREEN_LABEL}=100" "${BLUE_LABEL}=0"
else
  az containerapp ingress traffic set \
    --name "$AZURE_CONTAINER_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP_NAME" \
    --label-weight "${GREEN_LABEL}=100"
fi

echo "✅ Traffic switched to GREEN."
