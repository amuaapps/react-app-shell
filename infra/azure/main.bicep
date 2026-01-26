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

@description('Candidate label (blue or green) for the new revision')
@allowed([
  'blue'
  'green'
])
param candidateLabel string = 'green'

@description('Initial traffic weight for the candidate revision (0 recommended for blue/green)')
@minValue(0)
@maxValue(100)
param candidateWeight int = 0

@description('Existing traffic rules to preserve live traffic safely (array of objects)')
param existingTraffic array = []

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Environment name (dev, staging, prod)')
param environment string

@description('Project name (used for resource naming and tagging)')
param projectName string = 'react-app-shell'

@description('Container registry server (e.g., ghcr.io)')
param registryServer string = 'ghcr.io'

@description('Container registry username (GitHub username)')
param registryUsername string

@description('Container registry password (GitHub token)')
@secure()
param registryPassword string

@description('Expose ingress publicly')
param externalIngress bool = true

@description('Container port exposed via ingress')
param targetPort int = 80

@description('CPU cores (e.g., 0.25, 0.5, 1.0)')
param cpu string = '0.25'

@description('Memory (e.g., 0.5Gi, 1Gi)')
param memory string = '0.5Gi'

@description('Minimum replicas')
@minValue(0)
param minReplicas int = 1

@description('Maximum replicas')
@minValue(1)
param maxReplicas int = 3

@description('Tags to apply to all resources')
param tags object = {
  project: projectName
  managedBy: 'bicep'
  environment: environment
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
    candidateLabel: candidateLabel
    candidateWeight: candidateWeight
    existingTraffic: existingTraffic
    environment: environment
    registryServer: registryServer
    registryUsername: registryUsername
    registryPassword: registryPassword
    externalIngress: externalIngress
    targetPort: targetPort
    cpu: cpu
    memory: memory
    minReplicas: minReplicas
    maxReplicas: maxReplicas
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
