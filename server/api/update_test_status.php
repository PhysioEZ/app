<?php

declare(strict_types=1);
session_start();

// ----------------------------------------------------------------------
// API: Update Test Status/Payment
// ----------------------------------------------------------------------

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../common/db.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $testId = isset($input['test_id']) ? (int)$input['test_id'] : 0;
    $updateType = $input['update_type'] ?? ''; // 'test_status' or 'payment_status'
    $newValue = $input['new_value'] ?? '';
    
    if (!$testId || !$updateType || !$newValue) {
        throw new Exception("Missing required parameters");
    }

    // STRICT BRANCH ISOLATION
    $employeeId = $input['employee_id'] ?? $_SESSION['employee_id'] ?? null;
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
    if (!$branchId && isset($input["branch_id"])) { $branchId = (int)$input["branch_id"]; }
    
    if (!$branchId) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Branch ID mismatch or missing.']);
        exit;
    }

    // Verify test belongs to this branch
    $stmt = $pdo->prepare("SELECT test_id FROM tests WHERE test_id = ? AND branch_id = ?");
    $stmt->execute([$testId, $branchId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Test not found']);
        exit();
    }

    // Update based on type
    if ($updateType === 'test_status') {
        $allowed = ['pending', 'completed', 'cancelled'];
        if (!in_array($newValue, $allowed)) {
            throw new Exception("Invalid test status");
        }
        
        $stmt = $pdo->prepare("UPDATE tests SET test_status = ? WHERE test_id = ?");
        $stmt->execute([$newValue, $testId]);
        
    } elseif ($updateType === 'payment_status') {
        $allowed = ['pending', 'partial', 'paid'];
        if (!in_array($newValue, $allowed)) {
            throw new Exception("Invalid payment status");
        }
        
        $stmt = $pdo->prepare("UPDATE tests SET payment_status = ? WHERE test_id = ?");
        $stmt->execute([$newValue, $testId]);
        
    } else {
        throw new Exception("Invalid update type");
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Updated successfully'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
