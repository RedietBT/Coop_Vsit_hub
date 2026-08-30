# Test Organization Creation & Category API Removal

$loginBody = @{
    identifier = "admin"
    password   = "ChangeMe@CoopBank2026!"
    loginType  = "LOCAL"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.accessToken
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "`n1. Testing New Organization Registration..."
$orgBody = @{
    name                 = "Google DeepMind Innovations UK"
    industrySector       = "Artificial Intelligence & Cloud"
    contactEmail         = "partnerships@deepmind.google.com"
    contactPhone         = "+251911998877"
    primaryContactPerson = "Demis Hassabis"
    marketCountry        = "United Kingdom"
    relationshipScore    = 98
} | ConvertTo-Json

try {
    $createdOrg = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/organizations" -Method Post -Body $orgBody -ContentType "application/json" -Headers $headers
    Write-Host "Organization Created: $($createdOrg.name) (ID: $($createdOrg.id))" -ForegroundColor Green
    Write-Host "Contact: $($createdOrg.contactPersonName) | Phone: $($createdOrg.contactPhone) | Email: $($createdOrg.contactEmail)"
    Write-Host "Sector: $($createdOrg.industrySector)"
} catch {
    Write-Host "Creation Error: $_" -ForegroundColor Red
}

Write-Host "`n2. Listing Organizations to verify Table DTO..."
$orgs = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/organizations?page=0&size=5" -Method Get -Headers $headers
$orgs.content | Select-Object name, industrySector, contactPersonName, contactPhone, contactEmail | Format-Table -AutoSize
