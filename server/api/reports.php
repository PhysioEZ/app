<?php session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

require_once '../../common/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
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
    } catch (Exception $e) {}
}
if (!$branchId && isset($_GET["branch_id"])) { $branchId = (int)$_GET["branch_id"]; }
if (!$branchId) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Branch ID required.']);
    exit;
}
if (!$branchId && isset($_GET["branch_id"])) { $branchId = (int)$_GET["branch_id"]; }
if (!$branchId) {
    echo json_encode(['status' => 'error', 'message' => 'Branch ID required']);
    exit();
}

$type = $_GET['type'] ?? 'tests';
$startDate = $_GET['start_date'] ?? date('Y-m-01');
$endDate = $_GET['end_date'] ?? date('Y-m-d');

try {
    $data = [];
    $totals = [];

    switch ($type) {
        case 'tests':
            // Logic from reports.php
            $whereClauses = ['t.branch_id = :branch_id', 'DATE(t.assigned_test_date) BETWEEN :start_date AND :end_date'];
            $params = [':branch_id' => $branchId, ':start_date' => $startDate, ':end_date' => $endDate];

            if (!empty($_GET['test_name'])) {
                $whereClauses[] = 't.test_name = :test_name';
                $params[':test_name'] = $_GET['test_name'];
            }
            if (!empty($_GET['test_status'])) {
                $whereClauses[] = 't.test_status = :test_status';
                $params[':test_status'] = $_GET['test_status'];
            }

            $whereSql = implode(' AND ', $whereClauses);

            // Data
            $sql = "SELECT 
                        t.test_id, t.assigned_test_date, t.patient_name, t.test_name, t.referred_by,
                        t.test_done_by, t.total_amount, t.advance_amount, t.due_amount, t.payment_status, t.test_status
                    FROM tests t
                    WHERE $whereSql
                    ORDER BY t.assigned_test_date DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Totals
            $totalsSql = "SELECT 
                            SUM(t.total_amount) as total_sum,
                            SUM(t.advance_amount) as paid_sum,
                            SUM(t.due_amount) as due_sum
                        FROM tests t
                        WHERE $whereSql";
            $totalsStmt = $pdo->prepare($totalsSql);
            $totalsStmt->execute($params);
            $totals = $totalsStmt->fetch(PDO::FETCH_ASSOC);
            if (!$totals) $totals = ['total_sum' => 0, 'paid_sum' => 0, 'due_sum' => 0];
            break;

        case 'registration':
            // Logic from clinic_reports.php
            $whereClauses = ['r.branch_id = :branch_id', 'DATE(r.appointment_date) BETWEEN :start_date AND :end_date'];
            $params = [':branch_id' => $branchId, ':start_date' => $startDate, ':end_date' => $endDate];

            if (!empty($_GET['status'])) {
                $whereClauses[] = 'r.status = :status';
                $params[':status'] = $_GET['status'];
            }

            $whereSql = implode(' AND ', $whereClauses);

            // Data
            $sql = "SELECT 
                        r.registration_id, r.appointment_date, r.patient_name, r.age, r.gender,
                        r.chief_complain, r.referralSource, r.reffered_by, r.consultation_type,
                        r.consultation_amount, r.payment_method, r.status
                    FROM registration r
                    WHERE $whereSql
                    ORDER BY r.appointment_date DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Totals
            $totalsSql = "SELECT 
                            SUM(CASE WHEN r.status = 'consulted' THEN r.consultation_amount ELSE 0 END) as consulted_sum,
                            SUM(CASE WHEN r.status = 'pending' THEN r.consultation_amount ELSE 0 END) as pending_sum,
                            SUM(CASE WHEN r.status = 'closed' THEN r.consultation_amount ELSE 0 END) as closed_sum
                          FROM registration r
                          WHERE $whereSql";
            $totalsStmt = $pdo->prepare($totalsSql);
            $totalsStmt->execute($params);
            $totals = $totalsStmt->fetch(PDO::FETCH_ASSOC);
            if (!$totals) $totals = ['consulted_sum' => 0, 'pending_sum' => 0, 'closed_sum' => 0];
            break;

        case 'patients':
            // Logic from patient_reports.php
            $whereClauses = ['p.branch_id = :branch_id', 'DATE(p.start_date) BETWEEN :start_date AND :end_date'];
            $params = [':branch_id' => $branchId, ':start_date' => $startDate, ':end_date' => $endDate];

            if (!empty($_GET['assigned_doctor'])) {
                $whereClauses[] = 'p.assigned_doctor = :assigned_doctor';
                $params[':assigned_doctor'] = $_GET['assigned_doctor'];
            }

            $whereSql = implode(' AND ', $whereClauses);

            // Data
            $sql = "SELECT 
                        p.patient_id,
                        r.patient_name,
                        p.assigned_doctor,
                        p.treatment_type,
                        p.total_amount,
                        p.advance_payment,
                        p.due_amount,
                        p.start_date,
                        p.end_date,
                        p.status
                    FROM patients p
                    JOIN registration r ON p.registration_id = r.registration_id
                    WHERE $whereSql
                    ORDER BY p.start_date DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Totals
            $totalsSql = "SELECT 
                            SUM(p.total_amount) as total_sum,
                            SUM(p.advance_payment) as paid_sum,
                            SUM(p.due_amount) as due_sum
                        FROM patients p
                        WHERE $whereSql";
            $totalsStmt = $pdo->prepare($totalsSql);
            $totalsStmt->execute($params);
            $totals = $totalsStmt->fetch(PDO::FETCH_ASSOC);
            if (!$totals) $totals = ['total_sum' => 0, 'paid_sum' => 0, 'due_sum' => 0];
            break;

        case 'inquiry':
            // Logic from inquiry_reports.php
            $whereClauses = ['i.branch_id = :branch_id', 'DATE(i.created_at) BETWEEN :start_date AND :end_date'];
            $params = [':branch_id' => $branchId, ':start_date' => $startDate, ':end_date' => $endDate];

            $whereSql = implode(' AND ', $whereClauses);

            // Data
            $sql = "SELECT 
                        i.inquiry_id, i.created_at, i.name, i.age, i.gender, i.referralSource,
                        i.chief_complain, i.phone_number, i.status
                    FROM quick_inquiry i
                    WHERE $whereSql
                    ORDER BY i.created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Totals
            // PHP logic was used for counts in original file, we can do it in SQL or PHP. SQL is cleaner.
            $totalsSql = "SELECT 
                            COUNT(*) as total_inquiries,
                            SUM(CASE WHEN LOWER(status) = 'registered' THEN 1 ELSE 0 END) as registered_count,
                            SUM(CASE WHEN LOWER(status) IN ('new', 'pending') THEN 1 ELSE 0 END) as new_count
                          FROM quick_inquiry i
                          WHERE $whereSql";
            $totalsStmt = $pdo->prepare($totalsSql);
            $totalsStmt->execute($params);
            $totals = $totalsStmt->fetch(PDO::FETCH_ASSOC);
            if (!$totals) $totals = ['total_inquiries' => 0, 'registered_count' => 0, 'new_count' => 0];
            break;
            
        default:
            throw new Exception("Invalid report type");
    }

    echo json_encode([
        'status' => 'success',
        'type' => $type,
        'filters' => [
            'start_date' => $startDate,
            'end_date' => $endDate
        ],
        'totals' => $totals,
        'data' => $data
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
