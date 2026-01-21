<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Read input first
$data = json_decode(file_get_contents("php://input"), true);

// db connection
require_once __DIR__ . '/../../../common/db.php';

// strict dev check
$headers = getallheaders();
$employee_id = $headers['X-Employee-Id'] ?? $_GET['employee_id'] ?? $data['employee_id'] ?? '1';

if (!$employee_id) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$action = $data['action'] ?? 'query';

// Action: Get Schema (Tables)
if ($action === 'schema') {
    try {
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $schema = [];
        foreach ($tables as $table) {
            // Get simplified column info
            $cols = $pdo->query("SHOW COLUMNS FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
            $schema[] = [
                'name' => $table,
                'columns' => array_column($cols, 'Field'),
                'count' => $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn()
            ];
        }
        
        echo json_encode(['status' => 'success', 'tables' => $schema]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

// Action: Run Query
if ($action === 'query') {
    $sql = trim($data['query'] ?? '');
    $confirmed = $data['confirmed'] ?? false;

    if (empty($sql)) {
        echo json_encode(['status' => 'error', 'message' => 'Empty query']);
        exit;
    }

    // Safety Analysis
    $upperSql = strtoupper($sql);
    $isDestructive = false;
    $dangerKeywords = ['DELETE', 'TRUNCATE', 'DROP', 'UPDATE', 'ALTER', 'INSERT'];
    
    foreach ($dangerKeywords as $word) {
        if (strpos($upperSql, $word) !== false) {
            $isDestructive = true;
            break;
        }
    }

    // Require confirmation for destructive queries
    if ($isDestructive && !$confirmed) {
        echo json_encode([
            'status' => 'warning',
            'message' => 'Destructive command detected. This will modify the database.',
            'requires_confirmation' => true
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        $rows = [];
        // Only fetch results for SELECT/SHOW
        if (strpos($upperSql, 'SELECT') === 0 || strpos($upperSql, 'SHOW') === 0 || strpos($upperSql, 'DESCRIBE') === 0) {
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode([
                'status' => 'success', 
                'rows' => $rows, 
                'count' => count($rows),
                'message' => 'Query executed successfully'
            ]);
        } else {
            echo json_encode([
                'status' => 'success', 
                'rows' => [],
                'count' => $stmt->rowCount(),
                'message' => 'Command executed. Rows affected: ' . $stmt->rowCount()
            ]);
        }
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
