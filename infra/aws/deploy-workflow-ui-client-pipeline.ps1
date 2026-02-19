param(
  [Parameter(Mandatory = $false)]
  [string]$StackName = "idp-workflow-ui-client-pipeline",

  [Parameter(Mandatory = $true)]
  [string]$ConnectionArn,

  [Parameter(Mandatory = $false)]
  [string]$FullRepositoryId = "exavalu-solutions/idp-pipeline",

  [Parameter(Mandatory = $false)]
  [string]$BranchName = "development",

  [Parameter(Mandatory = $false)]
  [string]$DeployRegion = "us-east-1",

  [Parameter(Mandatory = $false)]
  [string]$UiStackName = "idp-workflow-ui-client",

  [Parameter(Mandatory = $false)]
  [string]$ProjectName = "idp-workflow-ui",

  [Parameter(Mandatory = $false)]
  [string]$EnvironmentName = "dev",

  [Parameter(Mandatory = $false)]
  [ValidateSet("PriceClass_100", "PriceClass_200", "PriceClass_All")]
  [string]$PriceClass = "PriceClass_100",

  [Parameter(Mandatory = $false)]
  [string]$ApiOriginDomainName = "",

  [Parameter(Mandatory = $false)]
  [string]$Region = "us-east-1",

  [Parameter(Mandatory = $false)]
  [string]$Profile = ""
)

$ErrorActionPreference = "Stop"

function Resolve-AwsExe {
  $awsOnPath = Get-Command aws.exe -ErrorAction SilentlyContinue
  if ($awsOnPath) { return $awsOnPath.Source }
  $candidate = "C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe"
  if (Test-Path $candidate) { return $candidate }
  throw "AWS CLI v2 not found. Install it and ensure aws.exe is available."
}

function Resolve-AwsArgs {
  $args = @()
  if ($Profile -ne "") { $args += @("--profile", $Profile) }
  if ($Region -ne "") { $args += @("--region", $Region) }
  return ,$args
}

function Invoke-Native {
  param(
    [Parameter(Mandatory = $true)][string]$Exe,
    [Parameter(Mandatory = $false)][string[]]$Args = @(),
    [Parameter(Mandatory = $false)][string]$ErrorMessage = ""
  )
  & $Exe @Args
  if ($LASTEXITCODE -ne 0) {
    if ($ErrorMessage -eq "") { $ErrorMessage = "Command failed: $Exe $($Args -join ' ')" }
    throw $ErrorMessage
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path
$templateFile = Join-Path $repoRoot "infra\\aws\\workflow-ui-client-codepipeline.yml"
if (!(Test-Path $templateFile)) { throw "Missing template: $templateFile" }

$awsExe = Resolve-AwsExe
$awsArgs = Resolve-AwsArgs

$paramOverrides = @(
  "PipelineName=$StackName",
  "ConnectionArn=$ConnectionArn",
  "FullRepositoryId=$FullRepositoryId",
  "BranchName=$BranchName",
  "DeployRegion=$DeployRegion",
  "UiStackName=$UiStackName",
  "ProjectName=$ProjectName",
  "EnvironmentName=$EnvironmentName",
  "PriceClass=$PriceClass",
  "ApiOriginDomainName=$ApiOriginDomainName"
)

Write-Host "Deploying CodePipeline stack '$StackName' in region '$Region'..."
Invoke-Native -Exe $awsExe -Args ($awsArgs + @(
  "cloudformation", "deploy",
  "--template-file", $templateFile,
  "--stack-name", $StackName,
  "--parameter-overrides"
) + $paramOverrides + @("--capabilities", "CAPABILITY_NAMED_IAM", "--no-fail-on-empty-changeset")) -ErrorMessage "CodePipeline stack deploy failed."

Write-Host ""
Write-Host "Deployed stack: $StackName"
Write-Host "Template: $templateFile"
