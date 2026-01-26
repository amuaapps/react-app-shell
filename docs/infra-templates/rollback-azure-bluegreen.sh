#!/usr/bin/env bash
set -euo pipefail

: "${AZURE_RESOURCE_GROUP:?AZURE_RESOURCE_GROUP is required}"
: "${AZURE_CONTAINER_APP_NAME:?AZURE_CONTAINER_APP_NAME is required}"
: "${BLUE_ID:?BLUE_ID is required}"

GREEN_ID="${GREEN_ID:-}"

echo "Rollback: switching traffic back to BLUE:"
echo "  app: $AZURE_CONTAINER_APP_NAME"
echo "  blue: $BLUE_ID"
echo "  green: ${GREEN_ID:-<unknown>}"

if [ -n "$GREEN_ID" ]; then
  az containerapp ingress traffic set \
    --name "$AZURE_CONTAINER_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --revision-weight "${BLUE_ID}=100" "${GREEN_ID}=0" 1>/dev/null
else
  az containerapp ingress traffic set \
    --name "$AZURE_CONTAINER_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --revision-weight "${BLUE_ID}=100" 1>/dev/null
fi

echo "✅ Rollback complete."
