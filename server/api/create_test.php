<?php

declare(strict_types=1);

// ----------------------------------------------------------------------
// API: Create New Test Record
// Adapted from reception/api/test_submission.php
// ----------------------------------------------------------------------

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ----------------------------------------------------------------------
// 1. Database & Logger Inclusion
// ----------------------------------------------------------------------
$db_paths = [
    __DIR__ . '/../../../common/db.php', // admin/app/server/api -> admin/common/db.php (Depth: 3)
    __DIR__ . '/../../common/db.php',    // Fallback
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

// Logger
$logger_path = __DIR__ . '/../../../common/logger.php';
if (file_exists($logger_path)) {
    require_once $logger_path;
}

// ----------------------------------------------------------------------
// 2. Parse Input
// ----------------------------------------------------------------------
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
    exit();
}

$branch_id   = isset($input['branch_id']) ? (int)$input['branch_id'] : 1;
$employee_id = isset($input['employee_id']) ? (int)$input['employee_id'] : 0;
$username    = isset($input['username']) ? $input['username'] : 'Mobile App';

// ----------------------------------------------------------------------
// 3. Logic
// ----------------------------------------------------------------------
try {
    $visit_date         = $input['visit_date'] ?? date('Y-m-d');
    $assigned_test_date = $input['assigned_test_date'] ?? date('Y-m-d');
    $patient_name       = trim($input['patient_name'] ?? '');
    $age                = trim($input['age'] ?? '');
    $dob                = !empty($input['dob']) ? $input['dob'] : null;
    $gender             = $input['gender'] ?? '';
    $parents            = !empty(trim($input['parents'] ?? '')) ? trim($input['parents']) : null;
    $relation           = !empty(trim($input['relation'] ?? '')) ? trim($input['relation']) : null;
    $phone_number       = trim($input['phone_number'] ?? '');
    $alternate_phone_no = !empty(trim($input['alternate_phone_no'] ?? '')) ? trim($input['alternate_phone_no']) : null;
    $referred_by        = !empty(trim($input['referred_by'] ?? '')) ? trim($input['referred_by']) : null;
    
    // Test Data
    $test_names   = isset($input['test_names']) ? (array)$input['test_names'] : [];
    $test_amounts = isset($input['test_amounts']) ? (array)$input['test_amounts'] : [];
    
    $limb           = !empty($input['limb']) ? $input['limb'] : null;
    $test_done_by   = $input['test_done_by'] ?? '';
    $payment_method = $input['payment_method'] ?? 'cash';
    
    $advance_amount = isset($input['advance_amount']) ? (float)$input['advance_amount'] : 0.0;
    $discount       = isset($input['discount']) ? (float)$input['discount'] : 0.0;

    // Validation
    if (empty($patient_name)) throw new Exception("Patient Name is required");
    if (empty($test_names)) throw new Exception("Please select at least one test");

    $pdo->beginTransaction();

    // --- UID Generation ---
    $datePrefix = date('ymd', strtotime($visit_date));
    $stmtLastUid = $pdo->prepare("SELECT test_uid FROM tests WHERE test_uid LIKE :prefix ORDER BY test_uid DESC LIMIT 1");
    $stmtLastUid->execute([':prefix' => $datePrefix . '%']);
    $lastUid = $stmtLastUid->fetchColumn();
    $serial = $lastUid ? (int)substr($lastUid, 6) : 0;
    $serial++;
    $newTestUid = $datePrefix . str_pad((string)$serial, 2, '0', STR_PAD_LEFT);

    // --- Calculate Totals ---
    $global_total_amount = 0.00;
    foreach ($test_names as $name) {
        $amount = isset($test_amounts[$name]) ? (float)$test_amounts[$name] : 0.00;
        $global_total_amount += $amount;
    }
    
    $global_due_amount = $global_total_amount - $advance_amount - $discount;

    $global_payment_status = 'pending';
    if ($global_total_amount == 0) {
        $global_payment_status = 'paid';
    } elseif ($global_due_amount <= 0 && $global_total_amount > 0) {
        $global_payment_status = 'paid';
    } elseif ($advance_amount > 0 && $global_due_amount > 0) {
        $global_payment_status = 'partial';
    }

    // --- Insert Parent (Tests) ---
    $parent_test_name = implode(', ', array_map('strtoupper', $test_names));

    $stmtParent = $pdo->prepare("
        INSERT INTO tests (
            test_uid, visit_date, assigned_test_date, patient_name, phone_number,
            gender, age, dob, parents, relation, alternate_phone_no,
            limb, test_name, referred_by, test_done_by, created_by_employee_id,
            total_amount, advance_amount, discount, due_amount, payment_method,
            payment_status, test_status, branch_id
        ) VALUES (
            :test_uid, :visit_date, :assigned_test_date, :patient_name, :phone_number,
            :gender, :age, :dob, :parents, :relation, :alternate_phone_no,
            :limb, :test_name, :referred_by, :test_done_by, :created_by_employee_id,
            :total_amount, :advance_amount, :discount, :due_amount, :payment_method,
            :payment_status, 'pending', :branch_id
        )

    ");

    $stmtParent->execute([
        ':test_uid'           => $newTestUid,
        ':visit_date'         => $visit_date,
        ':assigned_test_date' => $assigned_test_date,
        ':patient_name'       => $patient_name,
        ':phone_number'       => $phone_number,
        ':gender'             => $gender,
        ':age'                => $age,
        ':dob'                => $dob,
        ':parents'            => $parents,
        ':relation'           => $relation,
        ':alternate_phone_no' => $alternate_phone_no,
        ':limb'               => $limb,
        ':test_name'          => $parent_test_name,
        ':referred_by'        => $referred_by,
        ':test_done_by'       => $test_done_by,
        ':created_by_employee_id' => $employee_id,
        ':total_amount'       => $global_total_amount,
        ':advance_amount'     => $advance_amount,
        ':discount'           => $discount,
        ':due_amount'         => $global_due_amount,
        ':payment_method'     => $payment_method,
        ':payment_status'     => $global_payment_status,
        ':branch_id'          => $branch_id
    ]);

    $parent_test_id = $pdo->lastInsertId();

    // --- Insert Items (Test Items) ---
    $remaining_advance = $advance_amount;
    $remaining_discount = $discount;

    foreach ($test_names as $single_test_name) {
        $current_total_amount = isset($test_amounts[$single_test_name]) ? (float)$test_amounts[$single_test_name] : 0.00;

        // Distribute Advance
        $current_advance_amount = 0.00;
        if ($remaining_advance > 0) {
            if ($remaining_advance >= $current_total_amount) {
                $current_advance_amount = $current_total_amount;
                $remaining_advance -= $current_total_amount;
            } else {
                $current_advance_amount = $remaining_advance;
                $remaining_advance = 0;
            }
        }

        // Distribute Discount
        $current_discount_amount = 0.00;
        if ($remaining_discount > 0) {
            $max_discount = max(0, $current_total_amount - $current_advance_amount);
            if ($remaining_discount >= $max_discount) {
                $current_discount_amount = $max_discount;
                $remaining_discount -= $max_discount;
            } else {
                $current_discount_amount = $remaining_discount;
                $remaining_discount = 0;
            }
        }

        $current_due_amount = $current_total_amount - $current_advance_amount - $current_discount_amount;
        
        $current_status = 'pending';
        if ($current_total_amount == 0) $current_status = 'paid';
        elseif ($current_due_amount <= 0) $current_status = 'paid';
        elseif ($current_advance_amount > 0) $current_status = 'partial';

        $stmtItem = $pdo->prepare("
            INSERT INTO test_items (
                test_id, created_by_employee_id, assigned_test_date, test_name,
                limb, referred_by, test_done_by, total_amount, advance_amount, discount,
                due_amount, payment_method, test_status, payment_status, created_at
            ) VALUES (
                :test_id, :created_by_employee_id, :assigned_test_date, :test_name,
                :limb, :referred_by, :test_done_by, :total_amount, :advance_amount, :discount,
                :due_amount, :payment_method, 'pending', :payment_status, NOW()
            )
        ");

        $stmtItem->execute([
            ':test_id' => $parent_test_id,
            ':created_by_employee_id' => $employee_id,
            ':assigned_test_date' => $assigned_test_date,
            ':test_name' => $single_test_name,
            ':limb' => $limb,
            ':referred_by' => $referred_by,
            ':test_done_by' => $test_done_by,
            ':total_amount' => $current_total_amount,
            ':advance_amount' => $current_advance_amount,
            ':discount' => $current_discount_amount,
            ':due_amount' => $current_due_amount,
            ':payment_method' => $payment_method,
            ':payment_status' => $current_status
        ]);
        
        $newItemId = $pdo->lastInsertId();

        // --- Commission Logic (If logic matches web) ---
        if (!empty($referred_by)) {
            $stmtP = $pdo->prepare("SELECT partner_id FROM referral_partners WHERE TRIM(name) = ? LIMIT 1");
            $stmtP->execute([$referred_by]);
            $pId = $stmtP->fetchColumn();
            
            if ($pId) {
                $pdo->prepare("UPDATE tests SET referral_partner_id = ? WHERE test_id = ?")->execute([$pId, $parent_test_id]);
                $pdo->prepare("UPDATE test_items SET referral_partner_id = ? WHERE item_id = ?")->execute([$pId, $newItemId]);
                
                $stmtRate = $pdo->prepare("SELECT commission_amount FROM referral_rates WHERE partner_id = ? AND service_type = 'test' AND service_item_name = ? LIMIT 1");
                $stmtRate->execute([$pId, $single_test_name]);
                $commAmt = $stmtRate->fetchColumn();
                
                if ($commAmt !== false) {
                    $pdo->prepare("UPDATE test_items SET commission_amount = ? WHERE item_id = ?")->execute([$commAmt, $newItemId]);
                }
            }
        }
    }

    // --- Logging ---
    if (function_exists('log_activity')) {
        log_activity(
            $pdo,
            $employee_id,
            $username,
            $branch_id,
            'CREATE',
            'tests',
            (int)$parent_test_id,
            null,
            ['test_uid' => $newTestUid, 'total' => $global_total_amount]
        );
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Test created', 'test_uid' => $newTestUid]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
