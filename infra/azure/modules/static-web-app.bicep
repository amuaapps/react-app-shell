// Azure Static Web App module
@description('Name of the Static Web App')
param staticWebAppName string

@description('Location for the Static Web App')
param location string

@description('SKU for the Static Web App')
@allowed([
  'Free'
  'Standard'
])
param sku string = 'Free'

@description('GitHub repository URL')
param repositoryUrl string

@description('GitHub branch to deploy from')
param branch string

@description('GitHub repository token for deployment')
@secure()
param repositoryToken string

@description('Build configuration for the app')
param appLocation string = '/'

@description('API location (if any)')
param apiLocation string = ''

@description('Output location for built files')
param outputLocation string = 'dist'

@description('Tags to apply to resources')
param tags object = {}

@description('Environment name (dev, staging, prod)')
param environment string

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: union(tags, {
    environment: environment
  })
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: branch
    repositoryToken: repositoryToken
    buildProperties: {
      appLocation: appLocation
      apiLocation: apiLocation
      outputLocation: outputLocation
    }
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'GitHub'
  }
}

// Output the deployment token for GitHub Actions
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
output defaultHostname string = staticWebApp.properties.defaultHostname
output staticWebAppId string = staticWebApp.id
output staticWebAppName string = staticWebApp.name
