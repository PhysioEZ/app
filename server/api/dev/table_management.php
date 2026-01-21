<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../common/db.php';

$action = $_POST['action'] ?? $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'list_tables':
            // Get all tables with size and overhead info
            $stmt = $pdo->query("
                SELECT 
                    table_name,
                    table_rows,
                    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
                    ROUND((data_free / 1024 / 1024), 2) AS overhead_mb,
                    engine,
                    update_time
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                ORDER BY (data_length + index_length) DESC
            ");
            
            $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'status' => 'success',
                'tables' => $tables,
                'total_tables' => count($tables)
            ]);
            break;
            
        case 'optimize_table':
            $tableName = $_POST['table_name'] ?? '';
            
            if (empty($tableName)) {
                throw new Exception('Table name is required');
            }
            
            // Validate table name (prevent SQL injection)
            $validTables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array($tableName, $validTables)) {
                throw new Exception('Invalid table name');
            }
            
            // Optimize the table
            $pdo->exec("OPTIMIZE TABLE `$tableName`");
            
            echo json_encode([
                'status' => 'success',
                'message' => "Table '$tableName' optimized successfully"
            ]);
            break;
            
        case 'optimize_all':
            // Get all tables
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            $optimized = [];
            
            foreach ($tables as $table) {
                try {
                    $pdo->exec("OPTIMIZE TABLE `$table`");
                    $optimized[] = $table;
                } catch (Exception $e) {
                    // Skip tables that can't be optimized
                    continue;
                }
            }
            
            echo json_encode([
                'status' => 'success',
                'message' => count($optimized) . ' tables optimized',
                'optimized_tables' => $optimized
            ]);
            break;
            
        case 'analyze_table':
            $tableName = $_POST['table_name'] ?? '';
            
            if (empty($tableName)) {
                throw new Exception('Table name is required');
            }
            
            // Validate table name
            $validTables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array($tableName, $validTables)) {
                throw new Exception('Invalid table name');
            }
            
            // Get detailed table info
            $stmt = $pdo->query("
                SELECT 
                    table_name,
                    engine,
                    table_rows,
                    avg_row_length,
                    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS total_size_mb,
                    ROUND((data_length / 1024 / 1024), 2) AS data_size_mb,
                    ROUND((index_length / 1024 / 1024), 2) AS index_size_mb,
                    ROUND((data_free / 1024 / 1024), 2) AS overhead_mb,
                    table_collation,
                    create_time,
                    update_time
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                AND table_name = '$tableName'
            ");
            
            $info = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get column count
            $colCount = $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = '$tableName'")->fetchColumn();
            
            // Get index count
            $indexCount = $pdo->query("SELECT COUNT(DISTINCT index_name) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = '$tableName'")->fetchColumn();
            
            $info['column_count'] = $colCount;
            $info['index_count'] = $indexCount;
            
            echo json_encode([
                'status' => 'success',
                'table_info' => $info
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
