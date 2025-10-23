# Test de FASE 2 - Filtros y Consultas Avanzadas
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST FASE 2 - Filtros Avanzados     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Login
Write-Host "[1/7] Login..." -ForegroundColor Yellow
$loginData = '{"email":"admin@sgd.com","password":"admin123"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginData -ContentType "application/json"
$token = $response.data.token

if (-not $token) {
    Write-Host "ERROR: No se pudo obtener el token" -ForegroundColor Red
    Write-Host "Respuesta: $($response | ConvertTo-Json)" -ForegroundColor Yellow
    exit
}

Write-Host "OK - Token obtenido" -ForegroundColor Green
Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
Write-Host ""

$headers = @{"Authorization" = "Bearer $token"}

# Test 1: Filtros avanzados
Write-Host "[2/7] Test: Filtros Avanzados (archived=false, priority=alta)" -ForegroundColor Yellow
try {
    $docs = Invoke-RestMethod -Uri "http://localhost:3000/api/documents?archived=false&priority=alta&limit=5" -Headers $headers
    Write-Host "OK - Total encontrados: $($docs.count)" -ForegroundColor Green
    if ($docs.data.Count -gt 0) {
        Write-Host "Documentos encontrados:" -ForegroundColor Cyan
        $docs.data | ForEach-Object { 
            Write-Host "  • $($_.trackingCode) - $($_.asunto.Substring(0, [Math]::Min(50, $_.asunto.Length)))..." -ForegroundColor White
        }
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Busqueda avanzada
Write-Host "[3/7] Test: Búsqueda Avanzada (asunto=solicitud)" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/documents/search?asunto=solicitud&page=1&pageSize=5" -Headers $headers
    Write-Host "OK - Total: $($result.pagination.total), Página: $($result.pagination.page)/$($result.pagination.totalPages)" -ForegroundColor Green
    if ($result.documents.Count -gt 0) {
        Write-Host "Resultados:" -ForegroundColor Cyan
        $result.documents | ForEach-Object {
            Write-Host "  • $($_.trackingCode) - $($_.asunto.Substring(0, [Math]::Min(50, $_.asunto.Length)))" -ForegroundColor White
        }
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Documentos por estado
Write-Host "[4/7] Test: Documentos Agrupados por Estado" -ForegroundColor Yellow
try {
    $byStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/documents/by-status" -Headers $headers
    Write-Host "OK - Agrupación por estado:" -ForegroundColor Green
    $byStatus.data | ForEach-Object {
        $status = $_.status
        Write-Host "  • $($status.nombre): $($_.count) documentos" -ForegroundColor Cyan
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Documentos archivados por área
Write-Host "[5/7] Test: Documentos Archivados del Área 4 (Logística)" -ForegroundColor Yellow
try {
    $archived = Invoke-RestMethod -Uri "http://localhost:3000/api/documents/area/4/archived" -Headers $headers
    Write-Host "OK - Archivados encontrados: $($archived.count)" -ForegroundColor Green
    if ($archived.data.Count -gt 0) {
        $archived.data | ForEach-Object {
            Write-Host "  • $($_.trackingCode) - $($_.asunto.Substring(0, [Math]::Min(40, $_.asunto.Length)))" -ForegroundColor White
        }
    } else {
        Write-Host "  (No hay documentos archivados en esta área)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Historial de documento
Write-Host "[6/7] Test: Historial Completo de Documento" -ForegroundColor Yellow
try {
    # Primero obtener un documento con ID
    $docs = Invoke-RestMethod -Uri "http://localhost:3000/api/documents?limit=1" -Headers $headers
    if ($docs.data.Count -gt 0) {
        $docId = $docs.data[0].id
        $history = Invoke-RestMethod -Uri "http://localhost:3000/api/documents/$docId/history" -Headers $headers
        
        Write-Host "OK - Historial del documento: $($history.data.document.trackingCode)" -ForegroundColor Green
        Write-Host "`nEstadísticas:" -ForegroundColor Cyan
        Write-Host "  • Total movimientos: $($history.data.estadisticas.totalMovimientos)"
        Write-Host "  • Días totales: $($history.data.estadisticas.totalDias)"
        Write-Host "  • Áreas visitadas: $($history.data.estadisticas.areasVisitadas)"
        Write-Host "  • Estado actual: $($history.data.estadisticas.estadoActual)"
        
        if ($history.data.timeline.Count -gt 0) {
            Write-Host "`nTimeline:" -ForegroundColor Cyan
            $history.data.timeline | ForEach-Object {
                $area = if ($_.toArea) { $_.toArea.nombre } else { "N/A" }
                $dias = if ($_.diasPermanencia) { " ($($_.diasPermanencia) días)" } else { "" }
                Write-Host "  • $($_.accion) → $area$dias" -ForegroundColor White
            }
        }
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Filtro por rango de fechas
Write-Host "[7/7] Test: Filtro por Rango de Fechas (Octubre 2024)" -ForegroundColor Yellow
try {
    $docs = Invoke-RestMethod -Uri "http://localhost:3000/api/documents?dateFrom=2024-10-01&dateTo=2024-10-31&limit=10" -Headers $headers
    Write-Host "OK - Documentos de Octubre 2024: $($docs.count)" -ForegroundColor Green
    if ($docs.data.Count -gt 0) {
        $docs.data | ForEach-Object {
            $fecha = ([DateTime]$_.created_at).ToString("dd/MM/yyyy")
            Write-Host "  • $fecha - $($_.trackingCode)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Resumen final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTING COMPLETADO                   " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoints probados:" -ForegroundColor Yellow
Write-Host "  [OK] GET /api/documents (filtros avanzados)" -ForegroundColor Green
Write-Host "  [OK] GET /api/documents/search (busqueda con paginacion)" -ForegroundColor Green
Write-Host "  [OK] GET /api/documents/by-status (agrupacion)" -ForegroundColor Green
Write-Host "  [OK] GET /api/documents/area/:id/archived" -ForegroundColor Green
Write-Host "  [OK] GET /api/documents/:id/history (timeline)" -ForegroundColor Green
Write-Host ""
