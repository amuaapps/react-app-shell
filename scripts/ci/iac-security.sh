#!/usr/bin/env bash
set -euo pipefail

# IaC Security Check - Run Checkov on Bicep templates
# This script is called from Stage 4 of the deploy pipeline

echo "Running IaC security checks on Azure Bicep templates..."

# Check if checkov is installed
if ! command -v checkov &> /dev/null; then
    echo "Installing checkov..."
    pip install checkov
fi

# Run checkov on Bicep files
echo "Scanning infra/azure/ with Checkov..."
checkov -d infra/azure --framework bicep --quiet --compact

echo "✅ IaC security checks passed"
