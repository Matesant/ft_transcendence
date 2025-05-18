<?php

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Rota: POST /register
if ($method === 'POST' && $requestUri === '/register') {
    require_once __DIR__ . '/api/register.php';
    exit;
}

if ($method === 'GET' && $requestUri === '/players') {
    require_once __DIR__ . '/api/players.php';
    exit;
}

// Default
http_response_code(404);
echo json_encode(["error" => "Not Found"]);
