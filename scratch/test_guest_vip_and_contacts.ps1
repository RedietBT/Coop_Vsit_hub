# Test Individual Guest Registration with TIER_1 and Verify Contacts

$loginBody = @{
    identifier = "admin"
    password   = "ChangeMe@CoopBank2026!"
    loginType  = "LOCAL"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.accessToken
$headers = @{ "Authorization" = "Bearer $token" }

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

Write-Host "`n1. Testing Create Individual Guest with vipTier: 'TIER_1'..." -ForegroundColor Cyan
$guestBody = @{
    firstName              = "Dawit"
    lastName               = "Tsige"
    email                  = "dawit.tsige$timestamp@music.et"
    phoneNumber            = "+251911334455"
    vipTier                = "TIER_1" # Testing TIER_1 deserialization
    nationalityCountry     = "Ethiopia"
    identityDocumentType   = "PASSPORT"
    identityDocumentNumber = "EP8877665"
    relationshipScore      = 95
} | ConvertTo-Json

$guestRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/guests" -Method Post -Body $guestBody -ContentType "application/json" -Headers $headers
Write-Host "Guest Successfully Created!" -ForegroundColor Green
Write-Host "  -> Name      : $($guestRes.fullName)" -ForegroundColor Yellow
Write-Host "  -> Email     : $($guestRes.email)" -ForegroundColor Yellow
Write-Host "  -> Phone     : $($guestRes.phoneNumber)" -ForegroundColor Yellow
Write-Host "  -> VIP Tier  : $($guestRes.vipTier)" -ForegroundColor Yellow

Write-Host "`n2. Testing Fetch All Guests and Checking Table Columns Payload..." -ForegroundColor Cyan
$allGuests = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/guests" -Method Get -Headers $headers
Write-Host "Total Guests returned: $($allGuests.totalElements)" -ForegroundColor Green
$sample = $allGuests.content[0]
Write-Host "Sample Guest: $($sample.fullName) | Email: $($sample.email) | Phone: $($sample.phoneNumber) | Tier: $($sample.vipTier)" -ForegroundColor Yellow
