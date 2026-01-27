#!/usr/bin/env bash
set -euo pipefail

# Azure Container Apps - Rollback traffic from GREEN to BLUE
# Uses label-based switching to align with forward deployment behavior

: "${AZURE_RESOURCE_GROUP_NAME:?AZURE_RESOURCE_GROUP_NAME is required}"
: "${AZURE_CONTAINER_APP_NAME:?AZURE_CONTAINER_APP_NAME is required}"
: "${BLUE_ID:?BLUE_ID is required}"

GREEN_ID="${GREEN_ID:-}"

echo "Rollback: switching traffic back to BLUE:"
echo "  app: $AZURE_CONTAINER_APP_NAME"
echo "  blue: $BLUE_ID"
echo "  green: ${GREEN_ID:-<unknown>}"

# Determine BLUE label from revision name
if [[ "$BLUE_ID" == *"green"* ]]; then
  BLUE_LABEL="green"
else
  BLUE_LABEL="blue"
fi

# Use label-based traffic switching (consistent with forward deployment)
if [ -n "$GREEN_ID" ]; then
  # Determine GREEN label from revision name
  if [[ "$GREEN_ID" == *"green"* ]]; then
    GREEN_LABEL="green"
  else
    GREEN_LABEL="blue"
  fi
  
  echo "Setting traffic: ${BLUE_LABEL}=100%, ${GREEN_LABEL}=0%"
  az containerapp ingress traffic set \
    --name "$AZURE_CONTAINER_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP_NAME" \
    --label-weight "${BLUE_LABEL}=100" "${GREEN_LABEL}=0" 1>/dev/null
else
  echo "Setting traffic: ${BLUE_LABEL}=100%"
  az containerapp ingress traffic set \
    --name "$AZURE_CONTAINER_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP_NAME" \
    --label-weight "${BLUE_LABEL}=100" 1>/dev/null
fi

echo "✅ Rollback complete. Traffic restored to BLUE ($BLUE_LABEL label)."
