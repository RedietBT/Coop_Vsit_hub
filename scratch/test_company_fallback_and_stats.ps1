# Test Company Contact Details Priority & Fallback Logic & Total Visits Count

$loginBody = @{
    identifier = "admin"
    password   = "ChangeMe@CoopBank2026!"
    loginType  = "LOCAL"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.accessToken
$headers = @{ "Authorization" = "Bearer $token" }

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "TEST 1: Visit with EXPLICIT Company Contact Information" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

$now = [DateTime]::UtcNow.AddHours(2)
$visitBody1 = @{
    title                      = "FinTech Partnership"
    guestCategory              = "ORGANIZATION"
    organizationName           = "Alpha Tech Sol $timestamp"
    organizationContactPerson  = "Director Martha Haile"
    organizationPhone          = "+251911998877"
    organizationEmail          = "corporate@alphatech$timestamp.et"
    organizationSector         = "FinTech & Cloud"
    
    # Visitor Demographics (Different from company)
    individualGuestFirstName   = "Robel"
    individualGuestLastName    = "Girma"
    individualGuestPhone       = "+251933445566"
    individualGuestEmail       = "robel.visitor@gmail.com"
    
    scheduledStartTime         = $now.ToString("yyyy-MM-ddTHH:mm:ssZ")
    scheduledEndTime           = $now.AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

$visitRes1 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/visits" -Method Post -Body $visitBody1 -ContentType "application/json" -Headers $headers
Write-Host "Visit 1 Created: $($visitRes1.visitCode) (Org: $($visitRes1.guestOrganizationName))" -ForegroundColor Green

# Fetch newly created organization
$orgsRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/organizations?search=Alpha Tech Sol $timestamp" -Method Get -Headers $headers
$org1 = $orgsRes.content[0]
Write-Host "Organization Saved Details:" -ForegroundColor Yellow
Write-Host "  -> Name           : $($org1.name)"
Write-Host "  -> Contact Person : $($org1.contactPersonName) (Expected: Director Martha Haile)"
Write-Host "  -> Phone          : $($org1.contactPhone) (Expected: +251911998877)"
Write-Host "  -> Email          : $($org1.contactEmail) (Expected: corporate@alphatech$timestamp.et)"
Write-Host "  -> Sector         : $($org1.industrySector) (Expected: FinTech & Cloud)"
Write-Host "  -> Total Visits   : $($org1.totalVisits) (Expected: 1)"

if ($org1.contactPersonName -eq "Director Martha Haile" -and $org1.contactPhone -eq "+251911998877") {
    Write-Host ">>> TEST 1 PASSED: Explicit company information was preserved! <<<" -ForegroundColor Green
} else {
    Write-Host ">>> TEST 1 FAILED! <<<" -ForegroundColor Red
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "TEST 2: Visit with BLANK Company Contact -> Auto-Fallback" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

$visitBody2 = @{
    title                      = "Agro Innovation Discussion"
    guestCategory              = "ORGANIZATION"
    organizationName           = "Beta Agro Exports $timestamp"
    # Company fields left blank
    
    # Visitor Demographics (Should be used as fallback)
    individualGuestFirstName   = "Selamawit"
    individualGuestLastName    = "Bekele"
    individualGuestPhone       = "+251944112233"
    individualGuestEmail       = "selam.agro@gmail.com"
    
    scheduledStartTime         = $now.AddHours(3).ToString("yyyy-MM-ddTHH:mm:ssZ")
    scheduledEndTime           = $now.AddHours(4).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

$visitRes2 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/visits" -Method Post -Body $visitBody2 -ContentType "application/json" -Headers $headers
Write-Host "Visit 2 Created: $($visitRes2.visitCode) (Org: $($visitRes2.guestOrganizationName))" -ForegroundColor Green

# Fetch newly created organization
$orgsRes2 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/organizations?search=Beta Agro Exports $timestamp" -Method Get -Headers $headers
$org2 = $orgsRes2.content[0]
Write-Host "Organization Saved Details (Via Fallback):" -ForegroundColor Yellow
Write-Host "  -> Name           : $($org2.name)"
Write-Host "  -> Contact Person : $($org2.contactPersonName) (Expected: Selamawit Bekele)"
Write-Host "  -> Phone          : $($org2.contactPhone) (Expected: +251944112233)"
Write-Host "  -> Email          : $($org2.contactEmail) (Expected: selam.agro@gmail.com)"
Write-Host "  -> Total Visits   : $($org2.totalVisits) (Expected: 1)"

if ($org2.contactPersonName -eq "Selamawit Bekele" -and $org2.contactPhone -eq "+251944112233") {
    Write-Host ">>> TEST 2 PASSED: Visitor details successfully used as fallback! <<<" -ForegroundColor Green
} else {
    Write-Host ">>> TEST 2 FAILED! <<<" -ForegroundColor Red
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "TEST 3: Register 2nd Visit for Org 1 -> Total Visits Count" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

$visitBody3 = @{
    title                      = "Follow-up Meeting"
    guestCategory              = "ORGANIZATION"
    guestOrganizationId        = $org1.id
    scheduledStartTime         = $now.AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
    scheduledEndTime           = $now.AddDays(1).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

$visitRes3 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/visits" -Method Post -Body $visitBody3 -ContentType "application/json" -Headers $headers
Write-Host "Visit 3 (Follow-up) Created: $($visitRes3.visitCode)" -ForegroundColor Green

# Fetch Org 1 again
$orgsRes1Updated = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/organizations?search=Alpha Tech Sol $timestamp" -Method Get -Headers $headers
$org1Updated = $orgsRes1Updated.content[0]
Write-Host "Org 1 Total Visits count now: $($org1Updated.totalVisits) (Expected: 2)" -ForegroundColor Yellow

if ($org1Updated.totalVisits -eq 2) {
    Write-Host ">>> TEST 3 PASSED: Total Visits accurately counted 2 visits! <<<" -ForegroundColor Green
} else {
    Write-Host ">>> TEST 3 FAILED! <<<" -ForegroundColor Red
}
