<?php
// server/api/admin/records.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database Access
$dbPaths = [
    __DIR__ . '/../../../common/db.php',
    __DIR__ . '/../../common/db.php',
    __DIR__ . '/../../../../common/db.php'
];

$dbFound = false;
foreach ($dbPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $dbFound = true;
        break;
    }
}

if (!$dbFound) {
    echo json_encode(['status' => 'error', 'message' => 'Database configuration not found']);
    exit;
}

$branch_id = isset($_GET['branch_id']) ? intval($_GET['branch_id']) : 0;
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
$offset = ($page - 1) * $limit;

// Filters
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$action = isset($_GET['action']) ? trim($_GET['action']) : '';
$user = isset($_GET['user']) ? trim($_GET['user']) : '';
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : '';
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : '';
$sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'newest';

// Build Query Logic
$whereClauses = [];
$params = [];

if ($branch_id > 0) {
    $whereClauses[] = "branch_id = ?";
    $params[] = $branch_id;
} else {
    $whereClauses[] = "1=1";
}

if (!empty($search)) {
    $whereClauses[] = "(username LIKE ? OR details_after LIKE ? OR target_table LIKE ?)";
    $term = "%$search%";
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
}

if (!empty($action) && $action !== 'all') {
    $whereClauses[] = "action_type = ?";
    $params[] = $action;
}

if (!empty($user) && $user !== 'all') {
    $whereClauses[] = "username = ?";
    $params[] = $user;
}

if (!empty($start_date)) {
    $whereClauses[] = "DATE(log_timestamp) >= ?";
    $params[] = $start_date;
}

if (!empty($end_date)) {
    $whereClauses[] = "DATE(log_timestamp) <= ?";
    $params[] = $end_date;
}

$whereCheck = implode(' AND ', $whereClauses);

// Sorting
$orderBy = "log_timestamp DESC";
switch ($sort_by) {
    case 'oldest': $orderBy = "log_timestamp ASC"; break;
    case 'user_asc': $orderBy = "username ASC, log_timestamp DESC"; break;
    case 'user_desc': $orderBy = "username DESC, log_timestamp DESC"; break;
    default: $orderBy = "log_timestamp DESC"; break;
}

$response = [
    'status' => 'success',
    'data' => [],
    'stats' => [],
    'pagination' => [
        'current_page' => $page,
        'limit' => $limit,
        'total_pages' => 0,
        'total_records' => 0
    ]
];

try {
    // 1. Get Total Count
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM audit_log WHERE $whereCheck");
    $stmt->execute($params);
    $totalRecords = $stmt->fetchColumn() ?: 0;
    
    $response['pagination']['total_records'] = (int)$totalRecords;
    $response['pagination']['total_pages'] = ceil($totalRecords / $limit);

    // 2. Fetch Aggregated Stats (only if page 1 to allow efficient loading)
    if ($page === 1) {
        // A. Activity Timeline (last 30 days based on filter)
        $statsSql = "SELECT DATE(log_timestamp) as d, COUNT(*) as c 
                     FROM audit_log 
                     WHERE $whereCheck 
                     GROUP BY DATE(log_timestamp) 
                     ORDER BY d ASC 
                     LIMIT 30";
                     
        $stmtStats = $pdo->prepare($statsSql);
        $stmtStats->execute($params);
        $activity = [];
        while($r = $stmtStats->fetch(PDO::FETCH_ASSOC)) {
            $activity[] = ['date' => $r['d'], 'count' => (int)$r['c']];
        }

        // B. Action Distribution
        $actionSql = "SELECT action_type, COUNT(*) as c 
                      FROM audit_log 
                      WHERE $whereCheck 
                      GROUP BY action_type 
                      ORDER BY c DESC 
                      LIMIT 5";
        $stmtAction = $pdo->prepare($actionSql);
        $stmtAction->execute($params);
        $distribution = [];
        while($r = $stmtAction->fetch(PDO::FETCH_ASSOC)) {
            $distribution[] = ['action' => $r['action_type'], 'count' => (int)$r['c']];
        }

        // C. Top Contributors (Users)
        $userSql = "SELECT username, COUNT(*) as c 
                    FROM audit_log 
                    WHERE $whereCheck 
                    GROUP BY username 
                    ORDER BY c DESC 
                    LIMIT 10"; // Increased limit for filter usage
        $stmtUser = $pdo->prepare($userSql);
        $stmtUser->execute($params);
        $contributors = [];
        while($r = $stmtUser->fetch(PDO::FETCH_ASSOC)) {
            $contributors[] = ['user' => $r['username'], 'count' => (int)$r['c']];
        }
        
        // D. Summary Counts
        $summary = [
            'total_actions' => $totalRecords,
            'unique_users' => count($contributors) 
        ];
        
        $response['stats'] = [
            'activity' => $activity,
            'distribution' => $distribution,
            'top_users' => $contributors,
            'summary' => $summary
        ];
    } else {
        $response['stats'] = null; 
    }

    // 3. Fetch Logs
    $sql = "
        SELECT 
            username, 
            action_type, 
            target_table, 
            target_id, 
            details_before,
            details_after,
            log_timestamp
        FROM audit_log 
        WHERE $whereCheck 
        ORDER BY $orderBy 
        LIMIT $limit OFFSET $offset
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $logs = [];
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Format for frontend
        $logs[] = [
            'id' => isset($row['log_id']) ? $row['log_id'] : (isset($row['id']) ? $row['id'] : uniqid()),
            'user' => $row['username'],
            'action' => $row['action_type'],
            'target' => $row['target_table'] . ' #' . $row['target_id'],
            'timestamp' => $row['log_timestamp'],
            'details' => $row['details_after'] ? ("New: " . substr($row['details_after'], 0, 50) . "...") : "No details",
            'full_details' => [
                'old' => $row['details_before'],
                'new' => $row['details_after']
            ]
        ];
    }
    
    $response['data'] = $logs;

} catch (PDOException $e) {
    // Fallback if columns are missing
    $response['status'] = 'error';
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>
