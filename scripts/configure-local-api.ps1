# Nexora.Ai Local Backend Setup for Windows PowerShell
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$EnvDir = Join-Path $Root "apps\api-node"
$EnvFile = Join-Path $EnvDir ".env"

if (-not (Test-Path $EnvDir)) {
    New-Item -ItemType Directory -Path $EnvDir -Force | Out-Null
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "            Nexora.Ai Local Backend Setup" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "This configures the standalone Node API server and keeps"
Write-Host "Gemini and Supabase service-role keys outside the APK.`n"

$SupabaseUrl = Read-Host "Supabase Project URL (e.g. https://xxxxx.supabase.co)"
$SupabaseUrl = $SupabaseUrl.Trim().TrimEnd('/')
if ([string]::IsNullOrWhiteSpace($SupabaseUrl)) {
    Write-Error "Supabase Project URL is required."
    exit 1
}

$ServiceKey = Read-Host "Supabase Service-Role Key (hidden)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($ServiceKey)
$SupabaseServiceRoleKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$SupabaseServiceRoleKey = $SupabaseServiceRoleKey.Trim()

if ([string]::IsNullOrWhiteSpace($SupabaseServiceRoleKey)) {
    Write-Error "Supabase Service-Role Key is required."
    exit 1
}

$GeminiSecure = Read-Host "Gemini API Key (hidden, press Enter to use built-in brain)" -AsSecureString
$BSTR2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($GeminiSecure)
$GeminiApiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR2)
$GeminiApiKey = $GeminiApiKey.Trim()

$GeminiModel = Read-Host "Gemini Model [gemini-2.5-flash]"
if ([string]::IsNullOrWhiteSpace($GeminiModel)) {
    $GeminiModel = "gemini-2.5-flash"
}

# Generate 32-byte secure random token
$Bytes = New-Object byte[] 32
(New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($Bytes)
$TokenEncryptionKey = [System.BitConverter]::ToString($Bytes).Replace("-", "").ToLower()

$EnvContent = @"
APP_NAME=Nexora.Ai
PUBLIC_API_BASE_URL=http://127.0.0.1:8787
SUPABASE_URL=$SupabaseUrl
SUPABASE_SERVICE_ROLE_KEY=$SupabaseServiceRoleKey
GEMINI_API_KEY=$GeminiApiKey
GEMINI_MODEL=$GeminiModel
ADMIN_USERNAME=Poojak@King
ADMIN_PASSWORD_SALT=b1bc1c17a257da0a4b84793835d9dc73
ADMIN_PASSWORD_HASH=443fe2accc8433ba3f6ffd9b5f6a4be200b0dc1253d14a770c94d4d149a42a61
ADMIN_PASSWORD_ITERATIONS=60000
TOKEN_ENCRYPTION_KEY=$TokenEncryptionKey
"@

Set-Content -Path $EnvFile -Value $EnvContent -Encoding UTF8

Write-Host "`n[SUCCESS] Configuration saved securely to:" -ForegroundColor Green
Write-Host "  $EnvFile`n" -ForegroundColor Yellow
Write-Host "To start the API server locally, run:" -ForegroundColor Green
Write-Host "  npm run dev:api`n" -ForegroundColor Yellow
