/**
 * Bicep Parameters File
 * 
 * This file provides default parameter values for local development.
 * In CI/CD, these values are overridden by GitHub Actions environment variables.
 */

using './main.bicep'

// These will be overridden by GitHub Actions environment variables
param environmentName = 'shell-env-dev'
param containerAppName = 'shell-app-dev'
param imageReference = 'ghcr.io/amuaapps/react-app-shell:dev-latest'
param revisionSuffix = 'green-initial'
param candidateLabel = 'green'
param candidateWeight = 100
param existingTraffic = []
param environment = 'dev'
param projectName = 'react-app-shell'
param registryServer = 'ghcr.io'
param registryUsername = 'github-user'
param registryPassword = 'github-token'
