# Cleanup Azure Resources
# This script deletes all Azure resources created for TaskCloud

param(
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "deployment-info.json",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Warning "============================================"
Write-Warning "  TaskCloud Cleanup"
Write-Warning "============================================"
Write-Info ""

# Load deployment info
if (-not (Test-Path $ConfigFile)) {
    Write-Error "Deployment info file not found: $ConfigFile"
    Write-Info "Please specify the resource group manually:"
    $ResourceGroup = Read-Host "Resource Group Name"
} else {
    $config = Get-Content $ConfigFile | ConvertFrom-Json
    $ResourceGroup = $config.resourceGroup
}

Write-Warning "This will DELETE all resources in resource group: $ResourceGroup"
Write-Warning "This action CANNOT be undone!"
Write-Info ""

# List resources that will be deleted
Write-Info "Resources to be deleted:"
az resource list --resource-group $ResourceGroup --output table

Write-Info ""

if (-not $Force) {
    $confirmation = Read-Host "Type 'DELETE' to confirm deletion"
    if ($confirmation -ne "DELETE") {
        Write-Info "Cleanup cancelled."
        exit 0
    }
}

Write-Info ""
Write-Info "Deleting resource group and all resources..."
Write-Warning "This may take 5-10 minutes..."

az group delete --name $ResourceGroup --yes --no-wait

if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ Deletion initiated"
    Write-Info ""
    Write-Info "Resources are being deleted in the background."
    Write-Info "Check status with: az group show --name $ResourceGroup"
    Write-Info ""
    
    # Delete local deployment info
    if (Test-Path $ConfigFile) {
        Remove-Item $ConfigFile
        Write-Success "✓ Local deployment info removed"
    }
} else {
    Write-Error "✗ Failed to delete resource group"
    exit 1
}

Write-Info ""
Write-Success "Cleanup complete!"
Write-Info ""
