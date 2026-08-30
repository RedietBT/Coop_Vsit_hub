# Test Full Organization Workflow: Duplicates, Edit, and Auto-Registration on Visit

$loginBody = @{
    identifier = "admin"
    password   = "ChangeMe@CoopBank2026!"
    loginType  = "LOCAL"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.accessToken
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "`n1. Testing Duplicate Name Prevention..." -ForegroundColor Cyan
$dupNameBody = @{
    name                 = "Ethio Telecom"
    contactEmail         = "unique1@test.com"
    contactPhone         = "+251999111222"
} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/organizations" -Method Post -Body $dupNameBody -ContentType "application/json" -Headers $headers
    Write-Host "FAILED: Allowed duplicate name!" -ForegroundColor Red
} catch {
    Write-Host "PASSED: Duplicate name prevented -> $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n2. Testing Duplicate Phone Prevention..." -ForegroundColor Cyan
$dupPhoneBody = @{
    name                 = "Unique Name Corp"
    contactEmail         = "unique2@test.com"
    contactPhone         = "+251115500000" # Ethio Telecom's phone
} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/organizations" -Method Post -Body $dupPhoneBody -ContentType "application/json" -Headers $headers
    Write-Host "FAILED: Allowed duplicate phone!" -ForegroundColor Red
} catch {
    Write-Host "PASSED: Duplicate phone prevented -> $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n3. Testing Duplicate Email Prevention..." -ForegroundColor Cyan
$dupEmailBody = @{
    name                 = "Unique Name Corp 2"
    contactEmail         = "corporate@ethiotelecom.et" # Ethio Telecom's email
    contactPhone         = "+251999222333"
} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/organizations" -Method Post -Body $dupEmailBody -ContentType "application/json" -Headers $headers
    Write-Host "FAILED: Allowed duplicate email!" -ForegroundColor Red
} catch {
    Write-Host "PASSED: Duplicate email prevented -> $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n4. Testing Update Organization API..." -ForegroundColor Cyan
$allOrgs = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/organizations?page=0&size=10" -Method Get -Headers $headers
$targetOrg = $allOrgs.content | Where-Object { $_.name -like "*DeepMind*" } | Select-Object -First 1
if ($targetOrg) {
    $updateBody = @{
        name                 = $targetOrg.name
        industrySector       = "Next-Gen AI & Quantum Computing"
        contactPersonName    = "Sir Demis Hassabis (CEO)"
        contactPhone         = "+251911998800"
        contactEmail         = "press@deepmind.google.com"
        marketCountry        = "United Kingdom"
        relationshipScore    = 99
        notes                = "Strategic AI collaboration partnership"
    } | ConvertTo-Json

    try {
        $updated = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/organizations/$($targetOrg.id)" -Method Put -Body $updateBody -ContentType "application/json" -Headers $headers
        Write-Host "PASSED: Organization Updated -> $($updated.name) | Sector: $($updated.industrySector) | Contact: $($updated.contactPersonName)" -ForegroundColor Green
    } catch {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Update Error: $($reader.ReadToEnd())" -ForegroundColor Red
    }
}

Write-Host "`n5. Testing Visit Creation with Auto-Registering Organization..." -ForegroundColor Cyan
$now = [DateTime]::UtcNow.AddHours(2)
$visitBody = @{
    guestDisplayName             = "Abebe Kebede"
    individualGuestFirstName     = "Abebe"
    individualGuestLastName      = "Kebede"
    individualGuestEmail         = "abebe.kebede@oromia-coffee.et"
    individualGuestPhone         = "+251911445566"
    individualGuestIdNumber      = "ID-OROMIA-9900"
    individualGuestTitle         = "Managing Director"
    organizationName             = "Oromia Coffee Farmers Cooperative Union"
    purpose                      = "Export Financing & FX Agreement"
    scheduledStartTime           = $now.ToString("yyyy-MM-ddTHH:mm:ssZ")
    scheduledEndTime             = $now.AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

$visitRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/visits" -Method Post -Body $visitBody -ContentType "application/json" -Headers $headers
Write-Host "Visit Created: $($visitRes.visitCode) with Organization: $($visitRes.organizationName)" -ForegroundColor Green

# Fetch organizations to verify auto-created org has Abebe Kebede as contact person & phone/email mapped!
$allOrgsAfter = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/organizations?search=Oromia&page=0&size=5" -Method Get -Headers $headers
$oromiaOrg = $allOrgsAfter.content | Where-Object { $_.name -like "*Oromia Coffee*" } | Select-Object -First 1

if ($oromiaOrg) {
    Write-Host "Auto-Registered Org Found: $($oromiaOrg.name)" -ForegroundColor Green
    Write-Host "  -> Contact Person: $($oromiaOrg.contactPersonName)" -ForegroundColor Yellow
    Write-Host "  -> Phone Number : $($oromiaOrg.contactPhone)" -ForegroundColor Yellow
    Write-Host "  -> Email Address: $($oromiaOrg.contactEmail)" -ForegroundColor Yellow
}
