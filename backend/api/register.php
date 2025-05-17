<?php

header('Content-Type: application/json');

// Lê dados do POST
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['alias']) || empty(trim($data['alias']))) {
    http_response_code(400);
    echo json_encode(["error" => "Alias is required"]);
    exit;
}

$alias = htmlspecialchars(trim($data['alias']));

// Conecta ao banco (cria se não existir)
$db = new PDO('sqlite:' . __DIR__ . '/../data/players.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Cria tabela se não existir
$db->exec("CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alias TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)");

// Insere jogador
try {
    $stmt = $db->prepare("INSERT INTO players (alias) VALUES (:alias)");
    $stmt->bindParam(':alias', $alias);
    $stmt->execute();
    echo json_encode(["success" => true, "alias" => $alias]);
} catch (PDOException $e) {
    http_response_code(409);
    echo json_encode(["error" => "Alias already exists"]);
}
