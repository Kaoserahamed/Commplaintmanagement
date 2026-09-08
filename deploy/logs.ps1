# View Azure App Service Logs
# This script helps view logs from backend and frontend services

param(
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "deployment-info.json",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("backend", "frontend", "both")]
    [string]$Service = "both",
    
    [Parameter(Mandatory=$false)]
    [switch]$Follow
)

function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Load deployment info
if (-not (Test-Path $ConfigFile)) {
    Write-Error "Deployment info file not found: $ConfigFile"
    exit 1
}

$config = Get-Content $ConfigFile | ConvertFrom-Json
$backendAppName = "$($config.appName)-backend"
$frontendAppName = "$($config.appName)-frontend"

function Show-Logs {
    param([string]$AppName, [string]$ServiceName)
    
    Write-Info "============================================"
    Write-Info "  $ServiceName Logs"
    Write-Info "============================================"
    Write-Info ""
    
    if ($Follow) {
        Write-Info "Streaming logs (Ctrl+C to stop)..."
        az webapp log tail --name $AppName --resource-group $config.resourceGroup
    } else {
        az webapp log download --name $AppName --resource-group $config.resourceGroup --log-file "$ServiceName-logs.zip"
        Write-Info "Logs downloaded to: $ServiceName-logs.zip"
    }
}

if ($Service -eq "backend" -or $Service -eq "both") {
    Show-Logs -AppName $backendAppName -ServiceName "Backend"
}

if ($Service -eq "frontend" -or $Service -eq "both") {
    if ($Service -eq "both") { Write-Info "" }
    Show-Logs -AppName $frontendAppName -ServiceName "Frontend"
}

Write-Info ""
Write-Info "To view logs in Azure Portal:"
Write-Info "  Backend: https://portal.azure.com/#@/resource/subscriptions/.../providers/Microsoft.Web/sites/$backendAppName/logStream"
Write-Info "  Frontend: https://portal.azure.com/#@/resource/subscriptions/.../providers/Microsoft.Web/sites/$frontendAppName/logStream"
Write-Info ""
