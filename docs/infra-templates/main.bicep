// Azure Container Apps — blue/green-safe deployment template
// NOTE: This template assumes the Container Apps managed environment already exists.
//
// Recommended workflow:
// - Stage 3: pass existing traffic rules + candidate rule (0% weight) => deploy GREEN with no prod traffic
// - Stage 4: verify revisionUrl then switch traffic via az CLI

targetScope = 'resourceGroup'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Deployment environment: dev|staging|prod')
param environment string

@description('Project name (used for resource naming)')
param projectName string

@description('Existing Container Apps managed environment name')
param environmentName string

@description('Container app resource name')
param containerAppName string = '${projectName}-${environment}'

@description('Container image reference (e.g. ghcr.io/org/repo:tag)')
param imageReference string

@description('Revision suffix for the new revision (unique per deploy)')
param revisionSuffix string

@description('Candidate label (typically blue|green)')
param candidateLabel string = 'green'

@description('Initial traffic weight for the candidate (0 recommended)')
@minValue(0)
@maxValue(100)
param candidateWeight int = 0

@description('Existing traffic rules to preserve live traffic safely (array of objects).')
param existingTraffic array = []

@description('Expose ingress publicly')
param externalIngress bool = true

@description('Container port exposed via ingress')
param targetPort int = 3000

@description('CPU cores')
param cpu float = 0.5

@description('Memory (e.g. 0.5Gi, 1Gi, 2Gi)')
param memory string = '1Gi'

@description('Container registry server (e.g. ghcr.io)')
param registryServer string = 'ghcr.io'

@description('Container registry username')
param registryUsername string

@description('Container registry password/token')
@secure()
param registryPassword string

@description('Minimum replicas')
@minValue(0)
param minReplicas int = 0

@description('Maximum replicas')
@minValue(1)
param maxReplicas int = 5

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

resource managedEnv 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: environmentName
}

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: managedEnv.id
    configuration: {
      activeRevisionsMode: 'Multiple'
      ingress: {
        external: externalIngress
        targetPort: targetPort
        traffic: trafficRules
      }
      secrets: [
        {
          name: 'registry-password'
          value: registryPassword
        }
      ]
      registries: [
        {
          server: registryServer
          username: registryUsername
          passwordSecretRef: 'registry-password'
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
            cpu: cpu
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

output containerAppName string = containerApp.name
output activeUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output revisionUrl string = 'https://${containerApp.properties.latestRevisionFqdn}'
output latestRevisionName string = containerApp.properties.latestRevisionName
