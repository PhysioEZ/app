<?php

declare(strict_types=1);
session_start();

// ----------------------------------------------------------------------
// API: Test Details
// ----------------------------------------------------------------------

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../common/db.php';

try {
    $testId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if (!$testId) {
        throw new Exception("Invalid Test ID");
    }

    // STRICT BRANCH ISOLATION
    $employeeId = $_GET['employee_id'] ?? $_REQUEST['employee_id'] ?? $_SESSION['employee_id'] ?? null;
    $branchId = 0;
    if ($employeeId) {
        try {
            $stmtB = $pdo->prepare("SELECT branch_id FROM employees WHERE employee_id = ?");
            $stmtB->execute([$employeeId]);
            $val = $stmtB->fetchColumn();
            if ($val) $branchId = $val;
        } catch(Exception $e){}
    }
    if (!$branchId && isset($_SESSION['branch_id'])) $branchId = $_SESSION['branch_id'];

    if (!$branchId && isset($_GET["branch_id"])) { $branchId = (int)$_GET["branch_id"]; }
if (!$branchId) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Branch ID mismatch or missing.']);
        exit;
    }

    // 1. Fetch Header with all fields
    $stmt = $pdo->prepare("
        SELECT 
            t.*,
            TIMESTAMPDIFF(YEAR, t.dob, CURDATE()) as age
        FROM tests t 
        WHERE t.test_id = ? AND t.branch_id = ?
    ");
    $stmt->execute([$testId, $branchId]);
    $header = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$header) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Test not found']);
        exit();
    }

    // 2. Fetch Items with all details
    $stmtItems = $pdo->prepare("
        SELECT 
            item_id,
            test_name,
            limb,
            assigned_test_date,
            test_done_by,
            referred_by,
            total_amount,
            discount,
            advance_amount,
            due_amount,
            payment_method,
            test_status,
            payment_status,
            created_at
        FROM test_items 
        WHERE test_id = ? 
        ORDER BY item_id ASC
    ");
    $stmtItems->execute([$testId]);
    $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

    // Format numeric fields
    $header['total_amount'] = (float)$header['total_amount'];
    $header['advance_amount'] = (float)$header['advance_amount'];
    $header['due_amount'] = (float)$header['due_amount'];
    $header['discount'] = (float)($header['discount'] ?? 0);
    $header['age'] = (int)($header['age'] ?? 0);

    foreach ($items as &$item) {
        $item['total_amount'] = (float)$item['total_amount'];
        $item['advance_amount'] = (float)$item['advance_amount'];
        $item['due_amount'] = (float)$item['due_amount'];
        $item['discount'] = (float)($item['discount'] ?? 0);
    }

    $header['items'] = $items;

    echo json_encode([
        'status' => 'success',
        'data' => $header
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
