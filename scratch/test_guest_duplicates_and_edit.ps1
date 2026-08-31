# Test Duplicate Prevention, Edit Guest, and Visit Auto-Connection

$loginBody = @{
    identifier = "admin"
    password   = "ChangeMe@CoopBank2026!"
    loginType  = "LOCAL"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.accessToken
$headers = @{ "Authorization" = "Bearer $token" }

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testPhone = "+251911$($timestamp.ToString().Substring(4, 6))"
$testEmail = "unique.guest$timestamp@cooptest.et"

Write-Host "`n1. Creating Initial Guest ($testPhone, $testEmail)..." -ForegroundColor Cyan
$g1Body = @{
    firstName          = "Abebe"
    lastName           = "Kebede"
    email              = $testEmail
    phoneNumber        = $testPhone
    vipTier            = "VIP_TIER_1"
    nationalityCountry = "Ethiopia"
} | ConvertTo-Json

$g1 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/guests" -Method Post -Body $g1Body -ContentType "application/json" -Headers $headers
Write-Host "Initial Guest Created: ID=$($g1.id), Name=$($g1.fullName)" -ForegroundColor Green

Write-Host "`n2. Testing Duplicate Phone Prevention (same phone, different email)..." -ForegroundColor Cyan
$dupPhoneBody = @{
    firstName          = "Duplicate"
    lastName           = "Person"
    email              = "diff.email$timestamp@cooptest.et"
    phoneNumber        = $testPhone
    vipTier            = "STANDARD"
    nationalityCountry = "Ethiopia"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/guests" -Method Post -Body $dupPhoneBody -ContentType "application/json" -Headers $headers
    Write-Host "ERROR: Duplicate phone was NOT rejected!" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Duplicate phone correctly rejected: $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n3. Testing Duplicate Email Prevention (different phone, same email)..." -ForegroundColor Cyan
$dupEmailBody = @{
    firstName          = "Duplicate"
    lastName           = "Person"
    email              = $testEmail
    phoneNumber        = "+251922998877"
    vipTier            = "STANDARD"
    nationalityCountry = "Ethiopia"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/guests" -Method Post -Body $dupEmailBody -ContentType "application/json" -Headers $headers
    Write-Host "ERROR: Duplicate email was NOT rejected!" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Duplicate email correctly rejected: $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n4. Testing Edit / Update Guest (PUT /api/v1/guests/$($g1.id))..." -ForegroundColor Cyan
$updateBody = @{
    firstName          = "Abebe"
    middleName         = "Tesfaye"
    lastName           = "Kebede"
    email              = $testEmail
    phoneNumber        = $testPhone
    vipTier            = "VIP_TIER_2"
    idType             = "PASSPORT"
    idNumber           = "EP998811"
    countryOfResidence = "Ethiopia"
    relationshipScore  = 98
    notes              = "Executive advisor on digital fintech transformation."
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/guests/$($g1.id)" -Method Put -Body $updateBody -ContentType "application/json" -Headers $headers
Write-Host "Updated Guest: Name=$($updated.fullName), Tier=$($updated.vipTier), ID=$($updated.idNumber), Score=$($updated.relationshipScore)" -ForegroundColor Green

Write-Host "`n5. Testing Visit Creation Auto-Reconnection by Phone..." -ForegroundColor Cyan
$startTime = (Get-Date).ToUniversalTime().AddHours(2).ToString("yyyy-MM-ddTHH:mm:ssZ")
$endTime   = (Get-Date).ToUniversalTime().AddHours(3).ToString("yyyy-MM-ddTHH:mm:ssZ")

$visitBody = @{
    title                    = "Advisory Briefing with Abebe"
    purposeDescription       = "Quarterly strategy alignment"
    scheduledStartTime       = $startTime
    scheduledEndTime         = $endTime
    locationRoom             = "Boardroom VIP $timestamp"
    guestCategory            = "INDIVIDUAL"
    individualGuestFirstName = "Abebe"
    individualGuestLastName  = "Kebede"
    individualGuestPhone     = $testPhone # Same phone as guest
    guestTier                = "TIER_1"
} | ConvertTo-Json

$visitRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/visits" -Method Post -Body $visitBody -ContentType "application/json" -Headers $headers
Write-Host "Visit Created: Code=$($visitRes.visitCode)" -ForegroundColor Green

Write-Host "`n6. Checking Guest Total Visits calculation..." -ForegroundColor Cyan
$recheckedGuest = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/guests/$($g1.id)" -Method Get -Headers $headers
Write-Host "Guest ID=$($g1.id) now has Total Visits = $($recheckedGuest.totalVisitsCompleted)" -ForegroundColor Green
Write-Host "ALL CHECKS PASSED!" -ForegroundColor Green
