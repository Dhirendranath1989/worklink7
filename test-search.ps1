# Test search functionality
$body = @{email='client@test.com'} | ConvertTo-Json
$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/debug/test-login' -Method POST -ContentType 'application/json' -Body $body
$token = ($response.Content | ConvertFrom-Json).token
Write-Host "Token: $token"

$headers = @{Authorization="Bearer $token"}
$searchResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/search/workers?skills=plumbing' -Headers $headers
Write-Host "Search Response:"
$searchResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10