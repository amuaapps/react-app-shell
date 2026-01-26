#!/usr/bin/env bash
set -euo pipefail

# Azure Container Apps - Deploy GREEN revision with 0% traffic
# Adapted from infra-templates to use existing GitHub secret names

# Required env vars (set via GitHub Environment vars/secrets)
: "${AZURE_RESOURCE_GROUP_NAME:?AZURE_RESOURCE_GROUP_NAME is required}"
: "${AZURE_CONTAINER_APPS_ENVIRONMENT_NAME:?AZURE_CONTAINER_APPS_ENVIRONMENT_NAME is required}"
: "${AZURE_CONTAINER_APP_NAME:?AZURE_CONTAINER_APP_NAME is required}"
: "${AZURE_REGION:?AZURE_REGION is required}"
: "${IMAGE_REF:?IMAGE_REF (container image) is required}"

# Optional: registry auth (for private registries like GHCR)
: "${REGISTRY_USERNAME:?REGISTRY_USERNAME is required}"
: "${REGISTRY_PASSWORD:?REGISTRY_PASSWORD is required}"

ENVIRONMENT="${ENVIRONMENT:-dev}"
PROJECT_NAME="${PROJECT_NAME:-react-app-shell}"

# Determine current BLUE revision (active traffic > 0)
BLUE_REVISION="$(az containerapp ingress traffic show \
  --name "$AZURE_CONTAINER_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP_NAME" \
  --query "[?weight>0].revisionName | [0]" -o tsv 2>/dev/null || true)"

# Determine candidate label (toggle blue/green)
CANDIDATE_LABEL="green"
if [ -n "${BLUE_REVISION:-}" ] && [[ "$BLUE_REVISION" == *"green"* ]]; then
  CANDIDATE_LABEL="blue"
fi

REVISION_SUFFIX="${CANDIDATE_LABEL}-$(date +%Y%m%d-%H%M%S)"

# Fetch existing traffic rules to preserve live traffic safely
# Filter out any rules with the candidate label to avoid conflicts
EXISTING_TRAFFIC_JSON="[]"
if az containerapp show --name "$AZURE_CONTAINER_APP_NAME" --resource-group "$AZURE_RESOURCE_GROUP_NAME" >/dev/null 2>&1; then
  EXISTING_TRAFFIC_JSON="$(az containerapp ingress traffic show \
    --name "$AZURE_CONTAINER_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP_NAME" -o json | \
    jq --arg label "$CANDIDATE_LABEL" '[.[] | select(.label != $label)]')"
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
  --resource-group "$AZURE_RESOURCE_GROUP_NAME" \
  --template-file infra/azure/main.bicep \
  --parameters \
      location="$AZURE_REGION" \
      environment="$ENVIRONMENT" \
      projectName="$PROJECT_NAME" \
      environmentName="$AZURE_CONTAINER_APPS_ENVIRONMENT_NAME" \
      containerAppName="$AZURE_CONTAINER_APP_NAME" \
      imageReference="$IMAGE_REF" \
      revisionSuffix="$REVISION_SUFFIX" \
      candidateLabel="$CANDIDATE_LABEL" \
      candidateWeight=0 \
      existingTraffic="$EXISTING_TRAFFIC_JSON" \
      registryUsername="$REGISTRY_USERNAME" \
      registryPassword="$REGISTRY_PASSWORD" \
  --only-show-errors

# Query outputs
GREEN_ID="$(az containerapp show --name "$AZURE_CONTAINER_APP_NAME" --resource-group "$AZURE_RESOURCE_GROUP_NAME" --query properties.latestRevisionName -o tsv)"
ACTIVE_URL="https://$(az containerapp show --name "$AZURE_CONTAINER_APP_NAME" --resource-group "$AZURE_RESOURCE_GROUP_NAME" --query properties.configuration.ingress.fqdn -o tsv)"

# Get GREEN URL using the label-based FQDN
# Format: https://<app-name>---<label>.<region>.azurecontainerapps.io
GREEN_FQDN="$(az containerapp revision show \
  --name "$GREEN_ID" \
  --app "$AZURE_CONTAINER_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP_NAME" \
  --query properties.fqdn -o tsv 2>/dev/null || echo "")"

if [ -z "$GREEN_FQDN" ]; then
  # Fallback: construct URL from label if revision FQDN not available
  BASE_FQDN="${ACTIVE_URL#https://}"
  GREEN_URL="https://${AZURE_CONTAINER_APP_NAME}---${CANDIDATE_LABEL}.${BASE_FQDN#*.}"
else
  GREEN_URL="https://${GREEN_FQDN}"
fi

echo "Deployed GREEN revision:"
echo "  green_id=$GREEN_ID"
echo "  green_url=$GREEN_URL"
echo "  active_url=$ACTIVE_URL"
echo "  blue_id=${BLUE_REVISION:-}"

# Write outputs to file for artifact upload
OUTPUTS_FILE="deploy-outputs.env"
cat > "$OUTPUTS_FILE" <<EOF
GREEN_URL=$GREEN_URL
GREEN_ID=$GREEN_ID
BLUE_ID=${BLUE_REVISION:-}
ACTIVE_URL=$ACTIVE_URL
EOF

echo "Outputs written to $OUTPUTS_FILE"
cat "$OUTPUTS_FILE"
