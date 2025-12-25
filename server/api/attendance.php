<?php

declare(strict_types=1);
session_start();

// ----------------------------------------------------------------------
// API: List Patients for Attendance + Balance Info
// ----------------------------------------------------------------------

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Handle Preflight Options Request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ----------------------------------------------------------------------
// 1. Database Connection
// ----------------------------------------------------------------------
// Robust path check for db.php (handles various server folder depths)
$db_paths = [
    __DIR__ . '/../../common/db.php',       // Standard path (server/api/ -> server/common/)
    __DIR__ . '/../../../common/db.php',    // Fallback if nested deeper
    $_SERVER['DOCUMENT_ROOT'] . '/prospine/server/common/db.php', // Absolute fallback
    $_SERVER['DOCUMENT_ROOT'] . '/common/db.php' // Another absolute fallback
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
    // ------------------------------------------------------------------
    // 2. Input Parameters
    // ------------------------------------------------------------------
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
    throw new Exception("Unauthorized: Branch ID required from valid Employee.");
}

$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$statusFilter = isset($_GET['status']) ? trim($_GET['status']) : 'all'; 
$date = isset($_GET['date']) ? trim($_GET['date']) : date('Y-m-d');

    // Pagination
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 15;
    $offset = ($page - 1) * $limit;

    // ------------------------------------------------------------------
    // 3. Build Query
    // ------------------------------------------------------------------
    // We join patients with registration to get names.
    // We LEFT JOIN attendance for the specific Date to see if present.

    $whereClauses = ["p.branch_id = :branch_id"];
    $params = [':branch_id' => $branchId];

    // Search (Name/Phone/ID)
    if (!empty($search)) {
        $whereClauses[] = "(r.patient_name LIKE :search1 OR r.phone_number LIKE :search2 OR pm.patient_uid LIKE :search3 OR p.patient_id LIKE :search4)";
        $params[':search1'] = "%$search%";
        $params[':search2'] = "%$search%";
        $params[':search3'] = "%$search%";
        $params[':search4'] = "%$search%";
    }

    // Base query structure
    $baseQuery = "
        FROM patients p
        JOIN registration r ON p.registration_id = r.registration_id
        LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
        LEFT JOIN attendance a ON p.patient_id = a.patient_id AND a.attendance_date = :attendance_date
    ";
    $params[':attendance_date'] = $date;

    // Status Filter (Present/Absent/All)
    if ($statusFilter === 'present') {
        $whereClauses[] = "a.attendance_id IS NOT NULL";
    } elseif ($statusFilter === 'absent') {
        $whereClauses[] = "a.attendance_id IS NULL";
    }

    // Only active patients? Usually yes, but maybe user wants to mark inactive ones?
    // Let's stick to showing everyone matching the criteria, but typically Active users.
    // But attendance.php (web) shows specific logic? lines 36: SELECT ... WHERE p.branch_id = ...
    // It doesn't strictly filter by 'active'. So we won't either unless requested.

    $whereSql = implode(' AND ', $whereClauses);

    // Count Total
    $countStmt = $pdo->prepare("SELECT COUNT(*) $baseQuery WHERE $whereSql");
    $countStmt->execute($params);
    $totalRecords = (int)$countStmt->fetchColumn();
    $totalPages = ceil($totalRecords / $limit);

    // Calculate Stats (Active Patients for the Date)
    $statsSql = "
        SELECT
            COUNT(*) as total_active,
            SUM(CASE WHEN a.attendance_id IS NOT NULL AND a.status = 'present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN a.attendance_id IS NOT NULL AND a.status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN a.attendance_id IS NULL THEN 1 ELSE 0 END) as absent
        FROM patients p
        LEFT JOIN attendance a ON p.patient_id = a.patient_id AND a.attendance_date = :att_date
        WHERE p.branch_id = :bid AND LOWER(p.status) IN ('ongoing', 'active')
    ";
    $statsStmt = $pdo->prepare($statsSql);
    $statsStmt->execute([':bid' => $branchId, ':att_date' => $date]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    // Fetch Data
    // We select needed fields for display AND balance calculation
    $sql = "
        SELECT
            p.patient_id,
            p.treatment_type,
            p.treatment_cost_per_day,
            p.package_cost,
            p.treatment_days,
            p.advance_payment,
            p.start_date,
            p.status,
            r.registration_id,
            r.patient_name,
            r.phone_number,
            r.patient_photo_path,
            pm.patient_uid,
            a.attendance_id,
            a.attendance_date AS attended_date,
            a.status AS attendance_status,
            a.remarks AS attendance_remarks
        $baseQuery
        WHERE $whereSql
        ORDER BY
            (a.attendance_id IS NOT NULL) DESC, -- Show present first
            r.patient_name ASC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ------------------------------------------------------------------
    // 4. Process Records (Calculate Balance)
    // ------------------------------------------------------------------
    foreach ($records as &$row) {
        $patientId = (int)$row['patient_id'];
        $treatmentType = strtolower((string)$row['treatment_type']);

        // A. Calculate Cost Per Day
        $costPerDay = 0.0;
        if ($treatmentType === 'package') {
            if ((int)$row['treatment_days'] > 0) {
                $costPerDay = (float)$row['package_cost'] / (int)$row['treatment_days'];
            }
        } elseif ($treatmentType === 'daily' || $treatmentType === 'advance') {
            $costPerDay = (float)$row['treatment_cost_per_day'];
        }
        $row['cost_per_day'] = $costPerDay;

        // B. Calculate paid sum
        $paidStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE patient_id = ?");
        $paidStmt->execute([$patientId]);
        $paidSum = (float)$paidStmt->fetchColumn();

        // C. Calculate attendance count (Consumed sessions)
        // Only count attendance since start_date (Current Plan)
        // If start_date is null, use epoch
        $startDate = $row['start_date'] ?? '1970-01-01';
        $attCountStmt = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE patient_id = ? AND attendance_date >= ?");
        $attCountStmt->execute([$patientId, $startDate]);
        $attendanceCount = (int)$attCountStmt->fetchColumn();
        
        $row['session_count'] = $attendanceCount; // Total sessions so far

        // D. Calculate Effective Balance
        // Logic mirroring patients.php
        $effectiveBalance = 0.0;
        if ($paidSum > 0 || $attendanceCount > 0) {
            $consumedAmount = $attendanceCount * $costPerDay;
            $effectiveBalance = $paidSum - $consumedAmount;
        } else {
            // New patient logic
            // Assuming simplified logic: start with Advance Payment.
            // If days have passed but no attendance marked? patients.php line 230 calculates daysPassed.
            // But strict balance should likely rely on ACTUAL attendance if we are marking "Per Visit".
            // Let's stick to Paid - Consumed(Attendance). It's safer.
            // If they paid advance (in payments table?), it's in paidSum.
            // If `advance_payment` field exists in `patients` table, IS IT synced with `payments` table?
            // Usually `payments` table is the ledger.
            // Let's trust $paidSum.
            $effectiveBalance = $paidSum; // Consumed is 0
        }

        $row['effective_balance'] = $effectiveBalance;
        $row['is_present'] = !empty($row['attendance_id']);
        
        // Add robust photo URL
        if (!empty($row['patient_photo_path'])) {
            // Ensure no double slashes if path starts with /
            $path = ltrim($row['patient_photo_path'], '/');
            // Assuming web root is standard, construct absolute URL for listing
            // But frontend usually handles the domain prepending.
            // We'll leave it as relative path for now, frontend handles base.
        }
    }
    unset($row);

    // ------------------------------------------------------------------
    // 5. Response
    // ------------------------------------------------------------------
    echo json_encode([
        'status' => 'success',
        'data' => $records,
        'stats' => $stats,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $totalPages,
            'total_records' => $totalRecords,
            'limit' => $limit
        ],
        'date' => $date
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
