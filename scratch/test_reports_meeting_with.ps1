# Test Reports Endpoint for Meeting Room and Meeting With

$loginBody = @{
    identifier = "admin"
    password   = "ChangeMe@CoopBank2026!"
    loginType  = "LOCAL"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.accessToken
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "`nFetching Visitor Reports..."
$reports = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/reports/detailed?page=0&size=10" -Method Get -Headers $headers
$reports.content | Select-Object visitCode, name, phone, floor, meetingWith | Format-Table -AutoSize
