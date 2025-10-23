# Test Simple de CRUDs Administrativos
Write-Host "=== TESTING SGD ===" -ForegroundColor Cyan

# 1. Login
Write-Host "`n[1] Login..." -ForegroundColor Yellow
$loginData = '{"email":"admin@sgd.com","password":"admin123"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginData -ContentType "application/json"
$token = $response.data.accessToken
Write-Host "OK - Token obtenido" -ForegroundColor Green

$headers = @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}

# 2. Listar Areas
Write-Host "`n[2] Listando areas..." -ForegroundColor Yellow
$areas = Invoke-RestMethod -Uri "http://localhost:3000/api/areas"
Write-Host "OK - Total: $($areas.count)" -ForegroundColor Green
$areas.data | Format-Table id, nombre, sigla -AutoSize

# 3. Crear Area
Write-Host "`n[3] Creando area..." -ForegroundColor Yellow
try {
    $body = '{"nombre":"Oficina de Imagen Institucional","sigla":"OII","descripcion":"Imagen institucional"}'
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/areas" -Method Post -Headers $headers -Body $body
    Write-Host "OK - Area creada: OII" -ForegroundColor Green
} catch {
    Write-Host "Ya existe o error" -ForegroundColor Yellow
}

# 4. Crear Tipo de Documento
Write-Host "`n[4] Creando tipo documento..." -ForegroundColor Yellow
try {
    $body = '{"nombre":"Oficio Multiple","codigo":"OFM","descripcion":"Oficio multiple","diasMaxAtencion":10}'
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/document-types" -Method Post -Headers $headers -Body $body
    Write-Host "OK - Tipo creado: OFM" -ForegroundColor Green
} catch {
    Write-Host "Ya existe o error" -ForegroundColor Yellow
}

# 5. Crear Rol
Write-Host "`n[5] Creando rol..." -ForegroundColor Yellow
try {
    $body = '{"nombre":"Jefe de Area","descripcion":"Jefe de area"}'
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/roles" -Method Post -Headers $headers -Body $body
    Write-Host "OK - Rol creado" -ForegroundColor Green
} catch {
    Write-Host "Ya existe o error" -ForegroundColor Yellow
}

# 6. Crear Usuario
Write-Host "`n[6] Creando usuario..." -ForegroundColor Yellow
try {
    $body = '{"nombre":"Juan Perez","email":"juan.perez@drtc.gob.pe","password":"Password123!","rolId":3,"areaId":1}'
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method Post -Headers $headers -Body $body
    Write-Host "OK - Usuario creado" -ForegroundColor Green
} catch {
    Write-Host "Ya existe o error" -ForegroundColor Yellow
}

# 7. Resumen Final
Write-Host "`n=== RESUMEN ===" -ForegroundColor Cyan
$areas2 = Invoke-RestMethod -Uri "http://localhost:3000/api/areas"
$roles = Invoke-RestMethod -Uri "http://localhost:3000/api/roles"
$tipos = Invoke-RestMethod -Uri "http://localhost:3000/api/document-types"

Write-Host "Areas: $($areas2.count)" -ForegroundColor White
Write-Host "Roles: $($roles.count)" -ForegroundColor White
Write-Host "Tipos Documento: $($tipos.count)" -ForegroundColor White

Write-Host "`n=== COMPLETADO ===" -ForegroundColor Green
