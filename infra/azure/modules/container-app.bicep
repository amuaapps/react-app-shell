/**
 * Container App Module
 * 
 * Creates an Azure Container App with support for blue/green deployments using revisions.
 * Each deployment creates a new revision, and traffic can be split between revisions.
 */

@description('Name of the Container App')
param containerAppName string

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Container Apps Environment ID')
param environmentId string

@description('Container image reference (e.g., ghcr.io/org/image:tag)')
param imageReference string

@description('Revision suffix for this deployment')
param revisionSuffix string

@description('Traffic weight for the new revision (0-100)')
@minValue(0)
@maxValue(100)
param trafficWeight int

@description('Label for the revision (blue or green)')
param revisionLabel string

@description('Whether this is the first deployment (no existing revisions)')
param isFirstDeployment bool

@description('Environment name (dev, staging, prod)')
param environment string

@description('Tags to apply to resources')
param tags object = {}

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  tags: union(tags, {
    environment: environment
  })
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      ingress: {
        external: true
        targetPort: 80
        transport: 'auto'
        allowInsecure: false
        traffic: [
          {
            revisionName: '${containerAppName}--${revisionSuffix}'
            weight: isFirstDeployment ? 100 : trafficWeight
            label: revisionLabel
          }
        ]
      }
      registries: [
        {
          server: split(imageReference, '/')[0]
          identity: 'system'
        }
      ]
    }
    template: {
      revisionSuffix: revisionSuffix
      containers: [
        {
          name: 'shell'
          image: imageReference
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

output containerAppId string = containerApp.id
output containerAppName string = containerApp.name
output fqdn string = containerApp.properties.configuration.ingress.fqdn
output latestRevisionName string = containerApp.properties.latestRevisionName
output latestRevisionFqdn string = containerApp.properties.latestRevisionFqdn
output revisionUrl string = 'https://${revisionLabel}---${containerApp.properties.configuration.ingress.fqdn}'
