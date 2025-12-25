<?php session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../common/db.php';

$patientId = isset($_GET['patient_id']) ? (int)$_GET['patient_id'] : 0;
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
    echo json_encode(["status" => "error", "message" => "Unauthorized: Branch ID mismatch or missing."]);
    exit;
}

if (!$patientId) {
    echo json_encode(["status" => "error", "message" => "Patient ID required"]);
    exit;
}

try {
    // 1. Fetch Patient & Registration Data
    $stmt = $pdo->prepare("
        SELECT
            p.*, r.*, pm.patient_uid,
            p.status AS patient_status,
            r.patient_photo_path
        FROM patients p
        LEFT JOIN registration r ON p.registration_id = r.registration_id
        LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
        WHERE p.patient_id = :id AND p.branch_id = :branch
    ");
    $stmt->execute(['id' => $patientId, 'branch' => $branchId]);
    $patient = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$patient) {
        echo json_encode(["status" => "error", "message" => "Patient not found"]);
        exit;
    }

    // 2. Financials
    $totalBilled = (float)($patient['total_amount'] ?? 0);
    $dueAmount = (float)($patient['due_amount'] ?? 0);
    $paidAmount = $totalBilled - $dueAmount;
    $paymentPercentage = ($totalBilled > 0) ? round(($paidAmount / $totalBilled) * 100) : 0;

    // 3. Attendance Logic
    // A. Get Total Count
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE patient_id = :pid");
    $countStmt->execute(['pid' => $patientId]);
    $totalAttendance = (int)$countStmt->fetchColumn();

    // B. Get Recent History
    $attendanceStmt = $pdo->prepare("
        SELECT attendance_date, remarks
        FROM attendance
        WHERE patient_id = :patient_id
        ORDER BY attendance_date DESC
        LIMIT 50
    ");
    $attendanceStmt->execute(['patient_id' => $patientId]);
    $attendanceRecords = $attendanceStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Counts
    $attendCount = $totalAttendance;

    // Prepare response
    $response = [
        "status" => "success",
        "data" => [
            "basic" => [
                "patient_id" => $patient['patient_id'],
                "patient_uid" => $patient['patient_uid'],
                "name" => $patient['patient_name'],
                "photo" => $patient['patient_photo_path'],
                "status" => $patient['patient_status'],
                "age" => $patient['age'],
                "gender" => $patient['gender'],
                "phone" => $patient['phone_number'],
                "email" => $patient['email'],
                "address" => $patient['address'],
                "reg_id" => $patient['registration_id'],
                "created_at" => $patient['created_at'],
                "referral" => $patient['reffered_by'] ?? 'N/A',
                "occupation" => $patient['occupation'],
                "chief_complaint" => $patient['chief_complain'],
                "remarks" => $patient['remarks'],
                "assigned_doctor" => $patient['assigned_doctor'] ?? 'Unassigned'
            ],
            "financials" => [
                "total_billed" => $totalBilled,
                "paid" => $paidAmount,
                "due" => $dueAmount,
                "percentage" => $paymentPercentage
            ],
            "treatment" => [
                "type" => $patient['treatment_type'],
                "days" => $patient['treatment_days'],
                "start_date" => $patient['start_date'],
                "end_date" => $patient['end_date'],
                "cost_per_day" => $patient['treatment_cost_per_day'],
                "total_cost" => $patient['total_amount']
            ],
            "consultation" => [
                "type" => $patient['consultation_type'] ?? 'N/A',
                "date" => $patient['appointment_date'] ?? null,
                "amount" => $patient['consultation_amount'] ?? 0,
                "notes" => $patient['doctor_notes'],
                "prescription" => $patient['prescription']
            ],
            "attendance" => [
                "total_present" => $attendCount, // Simplified
                "history" => $attendanceRecords
            ]
        ]
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
