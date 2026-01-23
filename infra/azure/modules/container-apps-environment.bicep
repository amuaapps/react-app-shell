/**
 * Container Apps Environment Module
 * 
 * Creates an Azure Container Apps Environment for hosting the shell application.
 * The environment provides the managed infrastructure for running containers.
 */

@description('Name of the Container Apps Environment')
param environmentName string

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Tags to apply to resources')
param tags object = {}

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'azure-monitor'
    }
    zoneRedundant: false
  }
}

output environmentId string = containerAppsEnvironment.id
output environmentName string = containerAppsEnvironment.name
output defaultDomain string = containerAppsEnvironment.properties.defaultDomain
