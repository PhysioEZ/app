<?php
declare(strict_types=1);

require_once '../../../common/db.php';
// require_once '../../../../common/auth_check.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$branchId = $_GET['branch_id'] ?? $_POST['branch_id'] ?? null;
// Allow 0, check for null specifically
if ($branchId === null || $branchId === '') {
    echo json_encode(['status' => 'error', 'message' => 'Branch ID is required']);
    exit;
}

$action = $_GET['action'] ?? 'tests'; // default to tests report

try {
    if ($action === 'tests') {
        getTestReports($pdo, $branchId, $_GET);
    } elseif ($action === 'registrations') {
        getRegistrationReports($pdo, $branchId, $_GET);
    } elseif ($action === 'patients') {
        getPatientReports($pdo, $branchId, $_GET);
    } elseif ($action === 'filter_options') {
        getFilterOptions($pdo, $branchId);
    } else {
        throw new Exception("Invalid action: $action");
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getPatientReports($pdo, $branchId, $filters) {
    // 1. STATS LOGIC (Ported from legacy patient_reports.php)
    $startDateStr = !empty($filters['start_date']) ? $filters['start_date'] : date('Y-m-01');
    $endDateStr = !empty($filters['end_date']) ? $filters['end_date'] : date('Y-m-t');

    // Registrations in Range
    $stmtReg = $pdo->prepare("SELECT COUNT(*) FROM registration WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?");
    $stmtReg->execute([$branchId, $startDateStr, $endDateStr]);
    $regPeriodCount = (int)$stmtReg->fetchColumn();

    // Patients Converted in Range
    $stmtPatConv = $pdo->prepare("SELECT COUNT(*) FROM patients WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?");
    $stmtPatConv->execute([$branchId, $startDateStr, $endDateStr]);
    $patConvertedCount = (int)$stmtPatConv->fetchColumn();

    // Status Counts
    $stmtStatus = $pdo->prepare("SELECT status, COUNT(*) as cnt FROM patients WHERE branch_id = ? GROUP BY status");
    $stmtStatus->execute([$branchId]);
    $statusCounts = $stmtStatus->fetchAll(PDO::FETCH_KEY_PAIR);

    $stats = [
        'registrations_period' => $regPeriodCount,
        'converted_period' => $patConvertedCount,
        'active' => $statusCounts['active'] ?? 0,
        'completed' => $statusCounts['completed'] ?? 0,
        'cancelled' => $statusCounts['cancelled'] ?? 0,
        'total_patients_global' => array_sum($statusCounts)
    ];

    // 2. MAIN PATIENT LIST QUERY
    // Note: Replicating logic mainly for display.
    $sql = "SELECT 
                p.patient_id as id,
                pm.patient_uid,
                r.patient_name,
                r.gender,
                r.age,
                r.consultation_amount,
                p.assigned_doctor,
                p.treatment_type,
                p.treatment_days,
                p.total_amount AS treatment_total_amount,
                p.advance_payment,
                p.due_amount,
                p.start_date,
                p.end_date,
                p.created_at,
                p.status,
                (
                    SELECT COALESCE(COUNT(*), 0)
                    FROM attendance
                    WHERE patient_id = p.patient_id AND status = 'present'
                ) AS attendance_present_count,
                 (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM payments
                    WHERE patient_id = p.patient_id
                ) AS total_paid_all_time,
                (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM payments
                    WHERE patient_id = p.patient_id AND payment_date BETWEEN :start_date_filter_1 AND :end_date_filter_1
                ) AS total_paid_in_range,
                pay.max_payment_date
            FROM patients p
            JOIN registration r ON p.registration_id = r.registration_id
            LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
            LEFT JOIN (
                SELECT patient_id, MAX(payment_date) as max_payment_date
                FROM payments
                GROUP BY patient_id
            ) pay ON p.patient_id = pay.patient_id";

    $params = [
        ':branch_id' => $branchId,
        ':start_date_filter_1' => $startDateStr,
        ':end_date_filter_1' => $endDateStr
    ];
    $whereClauses = ['p.branch_id = :branch_id'];

    if (!empty($filters['start_date']) || !empty($filters['end_date'])) {
        $s = $startDateStr;
        $e = $endDateStr;
        
        $params[':reg_start'] = $s;
        $params[':reg_end'] = $e;
        $params[':pay_check_start'] = $s;
        $params[':pay_check_end'] = $e;

        $whereClauses[] = "(
            (DATE(p.created_at) BETWEEN :reg_start AND :reg_end) 
            OR 
            EXISTS (SELECT 1 FROM payments WHERE patient_id = p.patient_id AND payment_date BETWEEN :pay_check_start AND :pay_check_end)
        )";
    }

    if (!empty($filters['assigned_doctor'])) {
        $whereClauses[] = 'p.assigned_doctor = :assigned_doctor';
        $params[':assigned_doctor'] = $filters['assigned_doctor'];
    }
     if (!empty($filters['treatment_type'])) {
        $whereClauses[] = 'p.treatment_type = :treatment_type';
        $params[':treatment_type'] = $filters['treatment_type'];
    }
    if (!empty($filters['status'])) {
        $whereClauses[] = 'p.status = :status';
        $params[':status'] = $filters['status'];
    }

    if (!empty($whereClauses)) {
        $sql .= " WHERE " . implode(' AND ', $whereClauses);
    }
    
    $sql .= " ORDER BY COALESCE(pay.max_payment_date, p.created_at) DESC LIMIT 500";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate Row Totals
    $totalBilledSum = 0;
    $paidInRangeSum = 0;
    $totalDueSum = 0;

    foreach ($data as &$row) {
        $billed = (float)($row['consultation_amount'] ?? 0) + (float)($row['treatment_total_amount'] ?? 0);
        $paidAllTime = (float)($row['consultation_amount'] ?? 0) + (float)($row['total_paid_all_time'] ?? 0);
        $paidInRange = (float)($row['consultation_amount'] ?? 0) + (float)($row['total_paid_in_range'] ?? 0);
        $due = $billed - $paidAllTime;

        $row['calculated_billed'] = $billed;
        $row['calculated_paid_all_time'] = $paidAllTime;
        $row['calculated_paid_in_period'] = $paidInRange; 
        $row['calculated_due'] = $due;

        $totalBilledSum += $billed;
        $paidInRangeSum += $paidInRange;
        $totalDueSum += $due;
    }

    echo json_encode([
        'status' => 'success',
        'data' => $data,
        'totals' => [
            'revenue' => $totalBilledSum,
            'collected' => $paidInRangeSum,
            'outstanding' => $totalDueSum
        ],
        'stats' => $stats
    ]);
}


function getTestReports($pdo, $branchId, $filters) {
    // Base SQL
    $sql = "SELECT 
                t.test_id as id, t.created_at, t.patient_name, t.test_name, t.referred_by,
                t.test_done_by, t.total_amount, t.advance_amount, t.due_amount, 
                t.payment_status, t.test_status
            FROM tests t";

    $totalsSql = "SELECT 
                    SUM(t.total_amount) as total_sum,
                    SUM(t.advance_amount) as paid_sum,
                    SUM(t.due_amount) as due_sum
                  FROM tests t";

    $whereClauses = ['t.branch_id = :branch_id'];
    $params = [':branch_id' => $branchId];

    // Filters
    if (!empty($filters['start_date'])) {
        $whereClauses[] = 'DATE(t.created_at) >= :start_date';
        $params[':start_date'] = $filters['start_date'];
    }
    if (!empty($filters['end_date'])) {
        $whereClauses[] = 'DATE(t.created_at) <= :end_date';
        $params[':end_date'] = $filters['end_date'];
    }
    if (!empty($filters['test_name'])) {
        $whereClauses[] = 't.test_name = :test_name';
        $params[':test_name'] = $filters['test_name'];
    }
    if (!empty($filters['referred_by'])) {
        $whereClauses[] = 't.referred_by = :referred_by';
        $params[':referred_by'] = $filters['referred_by'];
    }
    if (!empty($filters['status'])) { // payment status
        $whereClauses[] = 't.payment_status = :status';
        $params[':status'] = $filters['status'];
    }

    if (!empty($whereClauses)) {
        $sql .= " WHERE " . implode(' AND ', $whereClauses);
        $totalsSql .= " WHERE " . implode(' AND ', $whereClauses);
    }

    $sql .= " ORDER BY t.created_at DESC LIMIT 500"; // Limit for performance

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalsStmt = $pdo->prepare($totalsSql);
    $totalsStmt->execute($params);
    $totals = $totalsStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $data,
        'totals' => [
            'revenue' => (float)($totals['total_sum'] ?? 0),
            'collected' => (float)($totals['paid_sum'] ?? 0),
            'outstanding' => (float)($totals['due_sum'] ?? 0)
        ]
    ]);
}

function getRegistrationReports($pdo, $branchId, $filters) {
    $sql = "SELECT 
                r.registration_id as id, r.created_at, r.patient_name, r.age, r.gender,
                r.chief_complain, r.referralSource, r.reffered_by, r.consultation_type,
                r.consultation_amount, r.payment_method, r.status
            FROM registration r";

    $totalsSql = "SELECT 
                    SUM(CASE WHEN r.status = 'consulted' THEN r.consultation_amount ELSE 0 END) as consulted_sum,
                    SUM(CASE WHEN r.status = 'pending' THEN r.consultation_amount ELSE 0 END) as pending_sum,
                    SUM(CASE WHEN r.status = 'closed' THEN r.consultation_amount ELSE 0 END) as closed_sum
                  FROM registration r";

    $whereClauses = ['r.branch_id = :branch_id'];
    $params = [':branch_id' => $branchId];

    if (!empty($filters['start_date'])) {
        $whereClauses[] = 'DATE(r.created_at) >= :start_date';
        $params[':start_date'] = $filters['start_date'];
    }
    if (!empty($filters['end_date'])) {
        $whereClauses[] = 'DATE(r.created_at) <= :end_date';
        $params[':end_date'] = $filters['end_date'];
    }
    if (!empty($filters['status'])) {
        $whereClauses[] = 'r.status = :status';
        $params[':status'] = $filters['status'];
    }

    if (!empty($whereClauses)) {
        $sql .= " WHERE " . implode(' AND ', $whereClauses);
        $totalsSql .= " WHERE " . implode(' AND ', $whereClauses);
    }

    $sql .= " ORDER BY r.created_at DESC LIMIT 500";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalsStmt = $pdo->prepare($totalsSql);
    $totalsStmt->execute($params);
    $totals = $totalsStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $data,
        'totals' => [
            'consulted_revenue' => (float)($totals['consulted_sum'] ?? 0),
            'pending_revenue' => (float)($totals['pending_sum'] ?? 0),
            'closed_revenue' => (float)($totals['closed_sum'] ?? 0)
        ]
    ]);
}

function getFilterOptions($pdo, $branchId) {
    $options = [];

    // Test Names
    $stmt = $pdo->prepare("SELECT DISTINCT test_name FROM tests WHERE branch_id = ? ORDER BY test_name");
    $stmt->execute([$branchId]);
    $options['test_names'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Referral Sources (Registration)
    $stmt = $pdo->prepare("SELECT DISTINCT referralSource FROM registration WHERE branch_id = ? AND referralSource IS NOT NULL AND referralSource != '' ORDER BY referralSource");
    $stmt->execute([$branchId]);
    $options['referral_sources'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Referrers (Both)
    // Union to get all unique referrers from both tables
    $stmt = $pdo->prepare("
        SELECT DISTINCT referrer FROM (
            SELECT referred_by as referrer FROM tests WHERE branch_id = ?
            UNION
            SELECT reffered_by as referrer FROM registration WHERE branch_id = ?
        ) as combined WHERE referrer IS NOT NULL AND referrer != '' ORDER BY referrer
    ");
    $stmt->execute([$branchId, $branchId]);
    $options['referrers'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode(['status' => 'success', 'data' => $options]);
}
