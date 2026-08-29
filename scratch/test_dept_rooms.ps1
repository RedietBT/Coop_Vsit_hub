# Test Meeting Rooms Department and Deletion Guard

$loginBody = @{
    identifier = "admin"
    password   = "ChangeMe@CoopBank2026!"
    loginType  = "LOCAL"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.accessToken
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "`n1. Listing Meeting Rooms with Departments:"
$rooms = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/meeting-rooms" -Method Get -Headers $headers
$rooms | Select-Object name, department, capacity | Format-Table -AutoSize

Write-Host "`n2. Listing Departments:"
$depts = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/departments" -Method Get -Headers $headers
$depts | Select-Object id, name, code | Format-Table -AutoSize

Write-Host "`n3. Testing Deletion Guard on assigned department (Executive Office):"
$execDept = $depts | Where-Object { $_.name -like "*Executive*" } | Select-Object -First 1
if ($execDept) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8080/api/v1/departments/$($execDept.id)" -Method Delete -Headers $headers
        Write-Host "WARNING: Deletion succeeded when it should have been blocked!" -ForegroundColor Red
    } catch {
        Write-Host "SUCCESS: Deletion safely blocked by server guard: $($_.Exception.Message)" -ForegroundColor Green
    }
}

Write-Host "`n4. Testing creation and deletion of temporary unassigned department:"
$newDeptBody = @{
    name = "Temporary Test Branch $(Get-Random)"
    code = "TEMP_TEST"
    description = "Test temporary department"
} | ConvertTo-Json

$newDept = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/departments" -Method Post -Headers $headers -Body $newDeptBody -ContentType "application/json"
Write-Host "Created temporary department: $($newDept.name) ($($newDept.id))"

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/departments/$($newDept.id)" -Method Delete -Headers $headers
Write-Host "Deleted temporary unassigned department successfully!" -ForegroundColor Green
