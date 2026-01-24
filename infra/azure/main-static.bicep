// Main Bicep template for Azure Static Web Apps deployment
targetScope = 'resourceGroup'

@description('Name of the Static Web App')
param staticWebAppName string

@description('Location for resources')
param location string = resourceGroup().location

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

@description('Environment name (dev, staging, prod)')
param environment string

@description('Tags to apply to all resources')
param tags object = {
  project: 'react-app-shell'
  managedBy: 'bicep'
}

// Deploy Static Web App
module staticWebApp 'modules/static-web-app.bicep' = {
  name: 'deploy-static-web-app'
  params: {
    staticWebAppName: staticWebAppName
    location: location
    sku: sku
    repositoryUrl: repositoryUrl
    branch: branch
    repositoryToken: repositoryToken
    appLocation: '/'
    apiLocation: ''
    outputLocation: 'dist'
    tags: tags
    environment: environment
  }
}

// Outputs
output staticWebAppUrl string = 'https://${staticWebApp.outputs.defaultHostname}'
output deploymentToken string = staticWebApp.outputs.deploymentToken
output staticWebAppName string = staticWebApp.outputs.staticWebAppName
output staticWebAppId string = staticWebApp.outputs.staticWebAppId
