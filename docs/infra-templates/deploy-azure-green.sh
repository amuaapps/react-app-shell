#!/usr/bin/env bash
set -euo pipefail

# Required env vars (set via GitHub Environment vars/secrets)
: "${AZURE_RESOURCE_GROUP:?AZURE_RESOURCE_GROUP is required}"
: "${AZURE_CONTAINERAPPS_ENVIRONMENT:?AZURE_CONTAINERAPPS_ENVIRONMENT is required}"
: "${AZURE_CONTAINER_APP_NAME:?AZURE_CONTAINER_APP_NAME is required}"
: "${AZURE_LOCATION:?AZURE_LOCATION is required}"
: "${IMAGE_REF:?IMAGE_REF (container image) is required}"

# Optional: registry auth (for private registries like GHCR)
: "${REGISTRY_USERNAME:?REGISTRY_USERNAME is required}"
: "${REGISTRY_PASSWORD:?REGISTRY_PASSWORD is required}"

ENVIRONMENT="${ENVIRONMENT:-dev}"

# Determine current BLUE revision (active traffic > 0)
BLUE_REVISION="$(az containerapp ingress traffic show \
  --name "$AZURE_CONTAINER_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query "[?weight>0].revisionName | [0]" -o tsv 2>/dev/null || true)"

# Determine candidate label (toggle)
CANDIDATE_LABEL="green"
if [ -n "${BLUE_REVISION:-}" ] && [[ "$BLUE_REVISION" == *"green"* ]]; then
  CANDIDATE_LABEL="blue"
fi

REVISION_SUFFIX="${CANDIDATE_LABEL}-$(date +%Y%m%d-%H%M%S)"

# Fetch existing traffic rules to preserve live traffic safely
EXISTING_TRAFFIC_JSON="[]"
if az containerapp show --name "$AZURE_CONTAINER_APP_NAME" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
  EXISTING_TRAFFIC_JSON="$(az containerapp ingress traffic show \
    --name "$AZURE_CONTAINER_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP" -o json)"
fi

DEPLOYMENT_NAME="deploy-${AZURE_CONTAINER_APP_NAME}-${REVISION_SUFFIX}"

echo "Deploying GREEN revision (0% traffic) via Bicep:"
echo "  app: $AZURE_CONTAINER_APP_NAME"
echo "  env: $ENVIRONMENT"
echo "  label: $CANDIDATE_LABEL"
echo "  revisionSuffix: $REVISION_SUFFIX"
echo "  blueRevision: ${BLUE_REVISION:-<none>}"

# Deploy infra + new revision with 0% weight
az deployment group create \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --template-file infra/azure/main.bicep \
  --parameters \
      location="$AZURE_LOCATION" \
      environment="$ENVIRONMENT" \
      projectName="${PROJECT_NAME:-$AZURE_CONTAINER_APP_NAME}" \
      environmentName="$AZURE_CONTAINERAPPS_ENVIRONMENT" \
      containerAppName="$AZURE_CONTAINER_APP_NAME" \
      imageReference="$IMAGE_REF" \
      revisionSuffix="$REVISION_SUFFIX" \
      candidateLabel="$CANDIDATE_LABEL" \
      candidateWeight=0 \
      existingTraffic="$EXISTING_TRAFFIC_JSON" \
      registryUsername="$REGISTRY_USERNAME" \
      registryPassword="$REGISTRY_PASSWORD" \
  1>/dev/null

# Query outputs
GREEN_ID="$(az containerapp show --name "$AZURE_CONTAINER_APP_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query properties.latestRevisionName -o tsv)"
GREEN_URL="https://$(az containerapp show --name "$AZURE_CONTAINER_APP_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query properties.latestRevisionFqdn -o tsv)"
ACTIVE_URL="https://$(az containerapp show --name "$AZURE_CONTAINER_APP_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query properties.configuration.ingress.fqdn -o tsv)"

echo "Deployed GREEN revision:"
echo "  green_id=$GREEN_ID"
echo "  green_url=$GREEN_URL"
echo "  active_url=$ACTIVE_URL"
echo "  blue_id=${BLUE_REVISION:-}"

# Required outputs for CI pipeline
{
  echo "green_url=$GREEN_URL"
  echo "green_id=$GREEN_ID"
  echo "blue_id=${BLUE_REVISION:-}"
  echo "active_url=$ACTIVE_URL"
} >> "$GITHUB_OUTPUT"
