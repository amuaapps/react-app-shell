// Parameter file for local development/testing
using './main-static.bicep'

param staticWebAppName = 'react-app-shell-dev'
param location = 'northeurope'
param sku = 'Free'
param repositoryUrl = 'https://github.com/amuaapps/react-app-shell'
param branch = 'develop'
param repositoryToken = '' // Will be provided at runtime
param environment = 'dev'
