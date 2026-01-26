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

@description('Candidate label (blue or green) for the new revision')
param candidateLabel string

@description('Initial traffic weight for the candidate revision (0-100)')
@minValue(0)
@maxValue(100)
param candidateWeight int

@description('Existing traffic rules to preserve live traffic safely')
param existingTraffic array = []

@description('Environment name (dev, staging, prod)')
param environment string

@description('Container registry server (e.g., ghcr.io)')
param registryServer string = 'ghcr.io'

@description('Container registry username')
param registryUsername string

@description('Container registry password')
@secure()
param registryPassword string

@description('Expose ingress publicly')
param externalIngress bool = true

@description('Container port')
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

@description('Tags to apply to resources')
param tags object = {}

// Build traffic rules: preserve existing + add new candidate
var trafficRules = concat(
  existingTraffic,
  [
    {
      latestRevision: true
      weight: candidateWeight
      label: candidateLabel
    }
  ]
)

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  tags: union(tags, {
    environment: environment
  })
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Multiple'
      ingress: {
        external: externalIngress
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
        traffic: trafficRules
      }
      registries: [
        {
          server: registryServer
          username: registryUsername
          passwordSecretRef: 'registry-password'
        }
      ]
      secrets: [
        {
          name: 'registry-password'
          value: registryPassword
        }
      ]
    }
    template: {
      revisionSuffix: revisionSuffix
      containers: [
        {
          name: 'app'
          image: imageReference
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: [
            {
              name: 'AMUA_ENV'
              value: environment
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: []
      }
    }
  }
}

output containerAppId string = containerApp.id
output containerAppName string = containerApp.name
output fqdn string = containerApp.properties.configuration.ingress.fqdn
output latestRevisionName string = containerApp.properties.latestRevisionName
output latestRevisionFqdn string = containerApp.properties.latestRevisionFqdn
output revisionUrl string = 'https://${containerApp.properties.latestRevisionFqdn}'
