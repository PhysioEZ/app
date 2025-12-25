<?php

declare(strict_types=1);

// ----------------------------------------------------------------------
// API: Add Test Item (Updates Parent Test)
// ----------------------------------------------------------------------

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../common/db.php'; // Adjust path if needed

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) throw new Exception("Invalid JSON");

    $testId = (int)($input['test_id'] ?? 0);
    $testName = trim($input['test_name'] ?? '');
    $assignedDate = $input['assigned_test_date'] ?? date('Y-m-d');
    $doneBy = trim($input['test_done_by'] ?? '');
    $totalAmount = (float)($input['total_amount'] ?? 0);
    
    // Optional
    $limb = $input['limb'] ?? null;
    $referredBy = $input['referred_by'] ?? null;
    $discount = (float)($input['discount'] ?? 0);
    $advanceAmount = (float)($input['advance_amount'] ?? 0);
    $paymentMethod = $input['payment_method'] ?? 'cash';
    $status = $input['test_status'] ?? 'pending';

    // Due for this item (not stored in DB? yes stored: due_amount)
    $dueAmount = max(0, $totalAmount - $advanceAmount - $discount);

    if (!$testId || empty($testName) || $totalAmount <= 0) {
        throw new Exception("Test ID, Name, and Amount are required");
    }

    $pdo->beginTransaction();

    // 1. Insert Item
    $stmt = $pdo->prepare("
        INSERT INTO test_items (
            test_id, assigned_test_date, test_name, limb, referred_by, test_done_by, 
            total_amount, advance_amount, due_amount, discount, payment_method, test_status
        ) VALUES (
            ?, ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, ?, ?
        )
    ");
    $stmt->execute([
        $testId, $assignedDate, $testName, $limb, $referredBy, $doneBy,
        $totalAmount, $advanceAmount, $dueAmount, $discount, $paymentMethod, $status
    ]);
    $newItemId = $pdo->lastInsertId();

    // 2. Recalculate Parent Test Totals
    $stmtSum = $pdo->prepare("
        SELECT 
            SUM(total_amount) as total, 
            SUM(advance_amount) as advance, 
            SUM(discount) as discount 
        FROM test_items 
        WHERE test_id = ?
    ");
    $stmtSum->execute([$testId]);
    $sums = $stmtSum->fetch(PDO::FETCH_ASSOC);

    if ($sums) {
        $grandTotal = (float)$sums['total'];
        $grandAdvance = (float)$sums['advance'];
        $grandDiscount = (float)$sums['discount'];
        $grandDue = max(0, $grandTotal - $grandAdvance - $grandDiscount);

        // Status Logic
        if ($grandDue <= 0 && $grandTotal > 0) $pStatus = 'paid';
        elseif ($grandAdvance > 0) $pStatus = 'partial';
        else $pStatus = 'pending';

        $stmtUpd = $pdo->prepare("
            UPDATE tests 
            SET total_amount = ?, advance_amount = ?, discount = ?, due_amount = ?, payment_status = ? 
            WHERE test_id = ?
        ");
        $stmtUpd->execute([$grandTotal, $grandAdvance, $grandDiscount, $grandDue, $pStatus, $testId]);
    }

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'Test item added successfully',
        'item_id' => $newItemId
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
