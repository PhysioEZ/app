<?php
require_once '../../../../common/db.php';
try {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode($tables);
} catch (Exception $e) {
    echo $e->getMessage();
}
