<?php

declare(strict_types=1);
session_start(); // Start session to potentially access logged in user if available

// ----------------------------------------------------------------------
// API: Add Payment (Mobile Wrapper)
// ----------------------------------------------------------------------

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Connection
$db_paths = [
    __DIR__ . '/../../common/db.php',
    __DIR__ . '/../../../common/db.php',
    $_SERVER['DOCUMENT_ROOT'] . '/prospine/server/common/db.php',
    $_SERVER['DOCUMENT_ROOT'] . '/common/db.php'
];

$db_loaded = false;
foreach ($db_paths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $db_loaded = true;
        break;
    }
}

if (!$db_loaded) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database configuration not found']);
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        throw new Exception("Invalid JSON input");
    }

    $patientId = (int)($input['patient_id'] ?? 0);
    $amount = (float)($input['amount'] ?? 0);
    $mode = trim((string)($input['mode'] ?? ''));
    $remarks = trim((string)($input['remarks'] ?? ''));
    $employeeId = (int)($input['employee_id'] ?? $_SESSION['employee_id'] ?? 0); 
    
    // STRICT BRANCH ISOLATION - Verify Employee
    $requestingBranchId = 0;
    if ($employeeId) {
        $stmtB = $pdo->prepare("SELECT branch_id FROM employees WHERE employee_id = ?");
        $stmtB->execute([$employeeId]);
        $val = $stmtB->fetchColumn();
        if ($val) $requestingBranchId = $val;
    }
    if (!$requestingBranchId && isset($_SESSION['branch_id'])) $requestingBranchId = $_SESSION['branch_id'];
    
    if (!$requestingBranchId) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Valid Employee ID/Branch is required.']);
        exit;
    }

    if ($patientId <= 0 || $amount <= 0 || empty($mode)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid parameters (ID, Amount, Mode required)']);
        exit();
    }

    if (empty($remarks)) {
        $remarks = "Payment via Mobile";
    }

    $pdo->beginTransaction();

    // 1. Fetch Patient & Lock
    $stmt = $pdo->prepare("SELECT patient_id, branch_id, total_amount FROM patients WHERE patient_id = ? FOR UPDATE");
    $stmt->execute([$patientId]);
    $patient = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$patient) {
        throw new Exception("Patient not found");
    }

    // 2. Insert Payment
    $stmtIns = $pdo->prepare("
        INSERT INTO payments (patient_id, payment_date, amount, mode, remarks, created_at, processed_by_employee_id)
        VALUES (?, CURDATE(), ?, ?, ?, NOW(), ?)
    ");
    $stmtIns->execute([$patientId, $amount, $mode, $remarks, $employeeId]);
    $paymentId = $pdo->lastInsertId();

    // 3. Recalculate Totals
    $stmtSum = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE patient_id = ?");
    $stmtSum->execute([$patientId]);
    $totalPaid = (float)$stmtSum->fetchColumn();

    $totalAmount = (float)$patient['total_amount'];
    $dueAmount = $totalAmount - $totalPaid;

    // 4. Update Patient
    $stmtUpd = $pdo->prepare("UPDATE patients SET advance_payment = ?, due_amount = ? WHERE patient_id = ?");
    $stmtUpd->execute([$totalPaid, $dueAmount, $patientId]);

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'Payment recorded successfully',
        'data' => [
            'payment_id' => $paymentId,
            'total_paid' => $totalPaid,
            'due_amount' => $dueAmount
        ]
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
