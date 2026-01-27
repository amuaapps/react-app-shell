#!/usr/bin/env bash
set -euo pipefail

# Azure Container Apps - Deploy GREEN revision with 0% traffic
#
# CRITICAL: REGISTRY_PASSWORD must be a long-lived GitHub Personal Access Token
# with 'read:packages' scope (e.g., NPM_PACKAGE_TOKEN), NOT the ephemeral
# GITHUB_TOKEN. The Container App stores these credentials and uses them to
# pull images when activating revisions, which happens after the workflow completes.
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
EXISTING_TRAFFIC_JSON="$(az containerapp show \
  --name "$AZURE_CONTAINER_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP_NAME" \
  --query 'properties.configuration.ingress.traffic' \
  -o json 2>/dev/null || echo '[]')"

# Filter out the candidate label from existing traffic to avoid conflicts
EXISTING_TRAFFIC_JSON="$(echo "$EXISTING_TRAFFIC_JSON" | jq --arg label "$CANDIDATE_LABEL" '[.[] | select(.label != $label)]')"

# Determine candidate weight: 100 for first deployment, 0 for subsequent
if [ -z "$BLUE_REVISION" ]; then
  CANDIDATE_WEIGHT=100
  echo "First deployment detected - setting candidate weight to 100%"
else
  CANDIDATE_WEIGHT=0
  echo "Existing deployment detected - setting candidate weight to 0%"
fi

DEPLOYMENT_NAME="deploy-${AZURE_CONTAINER_APP_NAME}-${REVISION_SUFFIX}"

echo "Deploying GREEN revision via Bicep:"
echo "  app: $AZURE_CONTAINER_APP_NAME"
echo "  env: $ENVIRONMENT"
echo "  label: $CANDIDATE_LABEL"
echo "  weight: ${CANDIDATE_WEIGHT}%"
echo "  revisionSuffix: $REVISION_SUFFIX"
echo "  blueRevision: ${BLUE_REVISION:-<none>}"

# Deploy infra + new revision
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
      candidateWeight="$CANDIDATE_WEIGHT" \
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

# Validate required outputs before writing artifact
# Fail early if we can't determine critical deployment information
if [ -z "$GREEN_ID" ]; then
  echo "::error::Failed to determine GREEN revision ID"
  exit 1
fi

if [ -z "$ACTIVE_URL" ]; then
  echo "::error::Failed to determine active URL"
  exit 1
fi

if [ -z "$GREEN_URL" ]; then
  echo "::error::Failed to determine GREEN URL"
  exit 1
fi

echo "Deployed GREEN revision:"
echo "  green_id=$GREEN_ID"
echo "  green_url=$GREEN_URL"
echo "  active_url=$ACTIVE_URL"
echo "  blue_id=${BLUE_REVISION:-<none>}"

# Write outputs to file for artifact upload
# Contract: deploy-outputs.env v1.0.0
# Required fields: GREEN_URL, GREEN_ID, BLUE_ID, ACTIVE_URL
# Optional fields: IMAGE_REF, COMMIT_SHA, ENVIRONMENT, DEPLOYED_AT
OUTPUTS_FILE="deploy-outputs.env"
cat > "$OUTPUTS_FILE" <<EOF
GREEN_URL=$GREEN_URL
GREEN_ID=$GREEN_ID
BLUE_ID=${BLUE_REVISION:-}
ACTIVE_URL=$ACTIVE_URL
IMAGE_REF=${IMAGE_REF:-}
COMMIT_SHA=${GITHUB_SHA:-}
ENVIRONMENT=${ENVIRONMENT:-}
DEPLOYED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

echo "Outputs written to $OUTPUTS_FILE (contract v1.0.0)"
echo "Required fields:"
echo "  GREEN_URL=$GREEN_URL"
echo "  GREEN_ID=$GREEN_ID"
echo "  BLUE_ID=${BLUE_REVISION:-<empty>}"
echo "  ACTIVE_URL=$ACTIVE_URL"
echo "Optional fields:"
echo "  IMAGE_REF=${IMAGE_REF:-<not set>}"
echo "  COMMIT_SHA=${GITHUB_SHA:-<not set>}"
echo "  ENVIRONMENT=${ENVIRONMENT:-<not set>}"
echo "  DEPLOYED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
