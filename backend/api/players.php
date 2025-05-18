<?php

header('Content-Type: application/json');

// Define o caminho para o diretório de dados
$dataDir = '/var/www/data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

$db = new PDO('sqlite:' . $dataDir . '/players.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db->exec("CREATE TABLE IF NOT EXISTS players (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	alias TEXT UNIQUE NOT NULL,
	created_at TEXT DEFAULT CURRENT_TIMESTAMP
)");

$stmt = $db->query("SELECT alias, created_at FROM players ORDER BY created_at DESC");
$players = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($players);
