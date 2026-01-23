/**
 * Bicep Parameters File
 * 
 * This file provides default parameter values for local development.
 * In CI/CD, these values are overridden by environment variables.
 */

using './main.bicep'

// These will be overridden by GitHub Actions environment variables
param environmentName = 'shell-env-dev'
param containerAppName = 'shell-app-dev'
param imageReference = 'ghcr.io/amuaapps/react-app-shell:latest'
param revisionSuffix = 'initial'
param trafficWeight = 100
param revisionLabel = 'active'
param environment = 'dev'
