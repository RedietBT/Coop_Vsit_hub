# Test Front Desk Visit Cancellation

$loginBody = @{
    identifier = "admin"
    password   = "ChangeMe@CoopBank2026!"
    loginType  = "LOCAL"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.accessToken
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "`n1. Creating a New Visit to Test Cancellation..." -ForegroundColor Cyan
$now = [DateTime]::UtcNow.AddHours(3)
$visitBody = @{
    guestDisplayName             = "Tewodros Kassahun"
    individualGuestFirstName     = "Tewodros"
    individualGuestLastName      = "Kassahun"
    individualGuestEmail         = "teddy.k@musicethiopia.et"
    individualGuestPhone         = "+251911776655"
    organizationName             = "Ethiopian Arts & Culture Council"
    purpose                      = "Cultural Sponsorship & Partnership"
    scheduledStartTime           = $now.ToString("yyyy-MM-ddTHH:mm:ssZ")
    scheduledEndTime             = $now.AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

$visitRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/visits" -Method Post -Body $visitBody -ContentType "application/json" -Headers $headers
Write-Host "Visit Created: $($visitRes.visitCode) (ID: $($visitRes.id)) - Status: $($visitRes.status)" -ForegroundColor Green

Write-Host "`n2. Cancelling Visit from Front Desk..." -ForegroundColor Cyan
$cancelBody = @{
    status        = "CANCELLED"
    decisionNotes = "Visitor requested cancellation: meeting rescheduled to next quarter"
} | ConvertTo-Json

$cancelRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/visits/$($visitRes.id)/status" -Method Put -Body $cancelBody -ContentType "application/json" -Headers $headers
Write-Host "Visit Cancelled Successfully!" -ForegroundColor Green
Write-Host "  -> New Status       : $($cancelRes.status)" -ForegroundColor Yellow
Write-Host "  -> Decision/Notes   : $($cancelRes.decisionNotes)" -ForegroundColor Yellow

Write-Host "`n3. Verifying Cancelled Visit is recorded in Database History..." -ForegroundColor Cyan
$fetchRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/visits/$($visitRes.id)" -Method Get -Headers $headers
Write-Host "Fetched Visit: $($fetchRes.visitCode) | Status: $($fetchRes.status) | Notes: $($fetchRes.decisionNotes)" -ForegroundColor Green
