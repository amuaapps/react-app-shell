# Deploy Outputs Contract

**Version:** 1.0.0  
**Purpose:** Defines the stable contract for passing deployment information from Stage 3 (Deploy GREEN) to Stage 4 (Verify & Switch Traffic).

## Overview

Stage 3 produces a `deploy-outputs.env` file that is uploaded as a GitHub Actions artifact. Stage 4 downloads this artifact and sources the environment variables to perform health checks, smoke tests, and traffic switching.

This contract ensures Stage 4 never relies on GitHub Actions job outputs or "re-discovery" of deployment state.

## Artifact Details

- **Artifact Name:** `deploy-outputs`
- **File Name:** `deploy-outputs.env`
- **Format:** Shell environment variable format (`KEY=value`)
- **Retention:** 1 day (sufficient for deployment pipeline)

## Required Fields

These fields **MUST** be present in every `deploy-outputs.env` file:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `GREEN_URL` | URL | Direct URL to the GREEN revision (label-based FQDN) | `https://react-app-shell---green.eastus.azurecontainerapps.io` |
| `GREEN_ID` | String | Azure Container App revision name for GREEN | `react-app-shell--green-20260127-0930` |
| `BLUE_ID` | String | Azure Container App revision name for BLUE (empty if first deployment) | `react-app-shell--blue-20260126-1530` or empty |
| `ACTIVE_URL` | URL | Production URL (main FQDN) | `https://react-app-shell.eastus.azurecontainerapps.io` |

## Optional Fields

These fields **MAY** be present for enhanced observability and debugging:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `IMAGE_REF` | String | Container image reference used for deployment | `ghcr.io/amuaapps/react-app-shell:dev-abc1234` |
| `COMMIT_SHA` | String | Git commit SHA that triggered the deployment | `abc1234567890def` |
| `ENVIRONMENT` | String | Target environment name | `dev`, `staging`, `prod` |
| `DEPLOYED_AT` | ISO8601 | Timestamp when deployment completed | `2026-01-27T09:30:45Z` |

## Contract Guarantees

### Stage 3 (Deploy GREEN) Guarantees

1. **Always produces the file:** Even on partial failures, the script will produce `deploy-outputs.env` with all required fields before failing
2. **Fail early:** If required information cannot be determined, the script fails before uploading the artifact
3. **No secrets in file:** The artifact file never contains sensitive information (passwords, tokens, etc.)
4. **Atomic writes:** The file is written atomically to prevent partial reads

### Stage 4 (Verify & Switch) Guarantees

1. **Only uses artifact:** Stage 4 never relies on GitHub Actions job outputs or re-queries Azure for deployment state
2. **Validates contract:** Stage 4 validates that all required fields are present before proceeding
3. **Fails fast:** If the artifact is missing or invalid, Stage 4 fails immediately with a clear error

## Error Handling

### Missing Artifact

If Stage 4 cannot download the `deploy-outputs` artifact:
- **Behavior:** Job fails immediately
- **Error Message:** `Failed to download deploy-outputs artifact`
- **Resolution:** Check Stage 3 logs to ensure artifact was uploaded

### Invalid Contract

If required fields are missing from `deploy-outputs.env`:
- **Behavior:** Job fails immediately after validation
- **Error Message:** `Missing required field: <FIELD_NAME>`
- **Resolution:** Check Stage 3 deploy script to ensure all required fields are set

### Empty BLUE_ID

If `BLUE_ID` is empty (first deployment):
- **Behavior:** Normal operation, rollback is skipped if deployment fails
- **Warning Message:** `No BLUE revision to rollback to (first deployment)`

## Example File

```bash
# deploy-outputs.env (required fields only)
GREEN_URL=https://react-app-shell---green.eastus.azurecontainerapps.io
GREEN_ID=react-app-shell--green-20260127-0930
BLUE_ID=react-app-shell--blue-20260126-1530
ACTIVE_URL=https://react-app-shell.eastus.azurecontainerapps.io
```

```bash
# deploy-outputs.env (with optional fields)
GREEN_URL=https://react-app-shell---green.eastus.azurecontainerapps.io
GREEN_ID=react-app-shell--green-20260127-0930
BLUE_ID=react-app-shell--blue-20260126-1530
ACTIVE_URL=https://react-app-shell.eastus.azurecontainerapps.io
IMAGE_REF=ghcr.io/amuaapps/react-app-shell:dev-abc1234
COMMIT_SHA=abc1234567890def
ENVIRONMENT=dev
DEPLOYED_AT=2026-01-27T09:30:45Z
```

## Version History

- **1.0.0** (2026-01-27): Initial contract definition
  - Required fields: `GREEN_URL`, `GREEN_ID`, `BLUE_ID`, `ACTIVE_URL`
  - Optional fields: `IMAGE_REF`, `COMMIT_SHA`, `ENVIRONMENT`, `DEPLOYED_AT`
