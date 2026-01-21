<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

date_default_timezone_set('Asia/Kolkata');

$dbPath = __DIR__ . '/../../../common/db.php';

if (!file_exists($dbPath)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'DB Core missing']);
    exit;
}

require_once $dbPath;

try {
    // 1. Fetch Details for a Specific Table
    if (isset($_GET['table'])) {
        $tableName = $_GET['table'];
        
        // Fetch Columns
        $colStmt = $pdo->prepare("DESCRIBE `$tableName` ");
        $colStmt->execute();
        $columns = $colStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Fetch Sample Data (Last 10)
        // We'll try to order by ID if it exists, else just limit
        $sampleData = [];
        try {
            $dataStmt = $pdo->prepare("SELECT * FROM `$tableName` shadow_data ORDER BY 1 DESC LIMIT 10");
            $dataStmt->execute();
            $sampleData = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $dataStmt = $pdo->prepare("SELECT * FROM `$tableName` LIMIT 10");
            $dataStmt->execute();
            $sampleData = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode([
            'status' => 'success',
            'table' => $tableName,
            'columns' => $columns,
            'data' => $sampleData
        ]);
        exit;
    }

    // 2. Default: Fetch All Tables List
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $schema = [];
    foreach ($tables as $table) {
        // Get row count
        $countStmt = $pdo->query("SELECT COUNT(*) FROM `$table` shadow_count");
        $rowCount = $countStmt->fetchColumn();
        
        // Get last updated (if updated_at exists)
        $updateTime = 'N/A';
        try {
            $columnStmt = $pdo->query("SHOW COLUMNS FROM `$table` LIKE 'updated_at'");
            if ($columnStmt->rowCount() > 0) {
                $lastStmt = $pdo->query("SELECT MAX(updated_at) FROM `$table` shadow_time");
                $updateTime = $lastStmt->fetchColumn() ?: 'No records';
            }
        } catch (Exception $e) { /* ignore */ }
        
        $schema[] = [
            'name' => $table,
            'rows' => (int)$rowCount,
            'last_updated' => $updateTime
        ];
    }
    
    echo json_encode([
        'status' => 'success',
        'database' => 'PhysioEZ_Master',
        'tables' => $schema,
        'server_time' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
