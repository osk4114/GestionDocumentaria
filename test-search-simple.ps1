# Test simple del endpoint de búsqueda
Write-Host "Test: Endpoint /search" -ForegroundColor Cyan

# 1. Login
$loginData = '{"email":"admin@sgd.com","password":"admin123"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginData -ContentType "application/json"
$token = $response.data.token

Write-Host "Token obtenido: $($token.Substring(0, 20))..."

# 2. Probar búsqueda
$headers = @{"Authorization" = "Bearer $token"}

try {
    Write-Host "`nProbando /search con asunto=solicitud..."
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/documents/search?asunto=solicitud" -Headers $headers
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Total encontrados: $($result.pagination.total)"
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host "Mensaje: $($_.Exception.Message)"
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
}

# 3. Probar sin filtros
try {
    Write-Host "`nProbando /search SIN filtros..."
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/documents/search" -Headers $headers
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Total encontrados: $($result.pagination.total)"
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host "Mensaje: $($_.Exception.Message)"
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
}
