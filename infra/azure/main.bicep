/**
 * Main Bicep Template - React App Shell Azure Infrastructure
 * 
 * Deploys Azure Container Apps infrastructure for hosting the shell application
 * with support for blue/green deployments.
 * 
 * Prerequisites:
 * - Resource group must exist
 * - Service principal must have Contributor role on resource group
 * - OIDC federation configured for GitHub Actions
 * 
 * Deployment:
 * az deployment group create \
 *   --resource-group <rg-name> \
 *   --template-file main.bicep \
 *   --parameters main.bicepparam
 */

targetScope = 'resourceGroup'

// ============================================================================
// Parameters
// ============================================================================

@description('Name of the Container Apps Environment')
param environmentName string

@description('Name of the Container App')
param containerAppName string

@description('Container image reference (e.g., ghcr.io/org/image:tag)')
param imageReference string

@description('Revision suffix for this deployment (e.g., timestamp or build number)')
param revisionSuffix string

@description('Traffic weight for this revision (0-100)')
@minValue(0)
@maxValue(100)
param trafficWeight int = 100

@description('Revision label (blue or green)')
@allowed([
  'blue'
  'green'
  'active'
])
param revisionLabel string = 'active'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Environment name (dev, staging, prod)')
param environment string

@description('Whether this is the first deployment (no existing revisions)')
param isFirstDeployment bool = true

@description('Tags to apply to all resources')
param tags object = {
  project: 'react-app-shell'
  managedBy: 'bicep'
}

// ============================================================================
// Modules
// ============================================================================

module containerAppsEnvironment 'modules/container-apps-environment.bicep' = {
  name: 'deploy-container-apps-environment'
  params: {
    environmentName: environmentName
    location: location
    tags: tags
  }
}

module containerApp 'modules/container-app.bicep' = {
  name: 'deploy-container-app'
  params: {
    containerAppName: containerAppName
    location: location
    environmentId: containerAppsEnvironment.outputs.environmentId
    imageReference: imageReference
    revisionSuffix: revisionSuffix
    trafficWeight: trafficWeight
    revisionLabel: revisionLabel
    isFirstDeployment: isFirstDeployment
    environment: environment
    tags: tags
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('The FQDN of the active Container App')
output activeUrl string = 'https://${containerApp.outputs.fqdn}'

@description('The FQDN of the specific revision (for testing before traffic switch)')
output revisionUrl string = containerApp.outputs.revisionUrl

@description('The latest revision name')
output latestRevisionName string = containerApp.outputs.latestRevisionName

@description('Container App name')
output containerAppName string = containerApp.outputs.containerAppName

@description('Container Apps Environment name')
output environmentName string = containerAppsEnvironment.outputs.environmentName
