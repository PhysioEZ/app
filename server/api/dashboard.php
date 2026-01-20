<?php session_start();
// /server/api/dashboard.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database Access
$dbPaths = [
    __DIR__ . '/../../../common/db.php',
    __DIR__ . '/../../common/db.php',
    '/srv/http/admin/common/db.php'
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
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database configuration not found']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

// STRICT BRANCH ISOLATION
$employeeId = $data->employee_id ?? $data->user_id ?? $_SESSION['employee_id'] ?? null;
$branchId = 0;

if ($employeeId) {
    $stmtB = $pdo->prepare("SELECT branch_id FROM employees WHERE employee_id = ?");
    $stmtB->execute([$employeeId]);
    $dbBranch = $stmtB->fetchColumn();
    if ($dbBranch) {
        $branchId = $dbBranch;
    }
}

if (!$branchId && isset($_SESSION['branch_id'])) {
    $branchId = $_SESSION['branch_id'];
}
if (!$branchId && isset($_GET["branch_id"])) { $branchId = (int)$_GET["branch_id"]; }
if (!$branchId) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Branch ID required.']);
    exit;
}

try {
    $pdo->exec("SET time_zone = '+05:30'");
    date_default_timezone_set('Asia/Kolkata');

    $today = date('Y-m-d');
    
    // --- 1. REGISTRATION ---
    // Today
    $stmtRegToday = $pdo->prepare("SELECT COUNT(*) FROM registration WHERE branch_id = :bid AND DATE(created_at) = :today");
    $stmtRegToday->execute(['bid' => $branchId, 'today' => $today]);
    $regToday = (int)$stmtRegToday->fetchColumn();

    $stmtApptToday = $pdo->prepare("SELECT COUNT(*) FROM registration WHERE branch_id = :bid AND appointment_date = :today"); // Assuming appointment_date is crucial
    $stmtApptToday->execute(['bid' => $branchId, 'today' => $today]);
    $apptToday = (int)$stmtApptToday->fetchColumn();

    // Total
    $stmtRegTotal = $pdo->prepare("SELECT COUNT(*) FROM registration WHERE branch_id = :bid");
    $stmtRegTotal->execute(['bid' => $branchId]);
    $regTotal = (int)$stmtRegTotal->fetchColumn();

    $stmtQueue = $pdo->prepare("SELECT COUNT(*) FROM registration WHERE branch_id = :bid AND status = 'pending' AND appointment_date = :today");
    $stmtQueue->execute(['bid' => $branchId, 'today' => $today]);
    $queueTotal = (int)$stmtQueue->fetchColumn();


    // --- 2. INQUIRY ---
    // Today
    $stmtGenInqToday = $pdo->prepare("SELECT COUNT(*) FROM quick_inquiry WHERE branch_id = :bid AND DATE(created_at) = :today");
    $stmtGenInqToday->execute(['bid' => $branchId, 'today' => $today]);
    $genInqToday = (int)$stmtGenInqToday->fetchColumn();

    $stmtTestInqToday = $pdo->prepare("SELECT COUNT(*) FROM test_inquiry WHERE branch_id = :bid AND DATE(created_at) = :today");
    $stmtTestInqToday->execute(['bid' => $branchId, 'today' => $today]);
    $testInqToday = (int)$stmtTestInqToday->fetchColumn();

    // Total
    $stmtGenInqTotal = $pdo->prepare("SELECT COUNT(*) FROM quick_inquiry WHERE branch_id = :bid");
    $stmtGenInqTotal->execute(['bid' => $branchId]);
    $genInqTotal = (int)$stmtGenInqTotal->fetchColumn();

    $stmtTestInqTotal = $pdo->prepare("SELECT COUNT(*) FROM test_inquiry WHERE branch_id = :bid");
    $stmtTestInqTotal->execute(['bid' => $branchId]);
    $testInqTotal = (int)$stmtTestInqTotal->fetchColumn();


    // --- 3. PATIENTS ---
    // Today
    $stmtPatEnrolledToday = $pdo->prepare("SELECT COUNT(*) FROM patients WHERE branch_id = :bid AND DATE(created_at) = :today");
    $stmtPatEnrolledToday->execute(['bid' => $branchId, 'today' => $today]);
    $patEnrolledToday = (int)$stmtPatEnrolledToday->fetchColumn();

    $stmtPatOngoing = $pdo->prepare("SELECT COUNT(*) FROM patients WHERE branch_id = :bid AND status = 'ongoing'");
    $stmtPatOngoing->execute(['bid' => $branchId]);
    $patOngoing = (int)$stmtPatOngoing->fetchColumn(); 

    // Total
    $stmtPatTotal = $pdo->prepare("SELECT COUNT(*) FROM patients WHERE branch_id = :bid");
    $stmtPatTotal->execute(['bid' => $branchId]);
    $patTotal = (int)$stmtPatTotal->fetchColumn();

    $stmtPatDischarged = $pdo->prepare("SELECT COUNT(*) FROM patients WHERE branch_id = :bid AND status = 'discharged'");
    $stmtPatDischarged->execute(['bid' => $branchId]);
    $patDischarged = (int)$stmtPatDischarged->fetchColumn();


    // --- 4. TESTS ---
    // Today
    $stmtTestSched = $pdo->prepare("SELECT COUNT(*) FROM tests WHERE branch_id = :bid AND assigned_test_date = :today");
    $stmtTestSched->execute(['bid' => $branchId, 'today' => $today]);
    $testSchedToday = (int)$stmtTestSched->fetchColumn();

    $stmtTestCondToday = $pdo->prepare("SELECT COUNT(*) FROM tests WHERE branch_id = :bid AND test_status = 'completed' AND DATE(assigned_test_date) = :today");
    $stmtTestCondToday->execute(['bid' => $branchId, 'today' => $today]);
    $testCondToday = (int)$stmtTestCondToday->fetchColumn();

    // Total
    $stmtTestQueue = $pdo->prepare("SELECT COUNT(*) FROM tests WHERE branch_id = :bid AND test_status = 'pending'");
    $stmtTestQueue->execute(['bid' => $branchId]);
    $testQueueTotal = (int)$stmtTestQueue->fetchColumn();

    $stmtTestCondTotal = $pdo->prepare("SELECT COUNT(*) FROM tests WHERE branch_id = :bid AND test_status = 'completed'");
    $stmtTestCondTotal->execute(['bid' => $branchId]);
    $testCondTotal = (int)$stmtTestCondTotal->fetchColumn();


    // --- 5. PAYMENTS ---
    // Breakdown components for Today
    $stmtPayRegToday = $pdo->prepare("SELECT COALESCE(SUM(consultation_amount), 0) FROM registration WHERE branch_id = :bid AND DATE(created_at) = :today");
    $stmtPayRegToday->execute(['bid' => $branchId, 'today' => $today]);
    $payRegToday = (float)$stmtPayRegToday->fetchColumn();

    $stmtPayTestToday = $pdo->prepare("SELECT COALESCE(SUM(advance_amount), 0) FROM tests WHERE branch_id = :bid AND DATE(created_at) = :today");
    $stmtPayTestToday->execute(['bid' => $branchId, 'today' => $today]);
    $payTestToday = (float)$stmtPayTestToday->fetchColumn();

    $stmtPayTreatToday = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM payments p JOIN patients pt ON p.patient_id = pt.patient_id WHERE pt.branch_id = :bid AND p.payment_date = :today");
    $stmtPayTreatToday->execute(['bid' => $branchId, 'today' => $today]);
    $payTreatToday = (float)$stmtPayTreatToday->fetchColumn();

    $payTodayReceived = $payRegToday + $payTestToday + $payTreatToday;

    // Today Dues
    $sqlPayTodayDues = "
          SELECT SUM(d) FROM (
            SELECT COALESCE(SUM(due_amount), 0) as d FROM tests WHERE branch_id = :bid1 AND DATE(created_at) = :today1
            UNION ALL
            SELECT COALESCE(SUM(due_amount), 0) as d FROM patients WHERE branch_id = :bid2 AND DATE(created_at) = :today2
          ) as t
    ";
    $stmtPayTodayDuesQuery = $pdo->prepare($sqlPayTodayDues);
    $stmtPayTodayDuesQuery->execute(['bid1'=>$branchId, 'today1'=>$today, 'bid2'=>$branchId, 'today2'=>$today]);
    $payTodayDues = (float)$stmtPayTodayDuesQuery->fetchColumn();


    // Total Received
    $sqlPayTotal = "
        SELECT SUM(val) FROM (
            SELECT COALESCE(SUM(consultation_amount), 0) as val FROM registration WHERE branch_id = :bid1
            UNION ALL
            SELECT COALESCE(SUM(advance_amount), 0) as val FROM tests WHERE branch_id = :bid2
            UNION ALL
            SELECT COALESCE(SUM(amount), 0) as val FROM payments p JOIN patients pt ON p.patient_id = pt.patient_id WHERE pt.branch_id = :bid3
        ) as t
    ";
    $stmtPayTotalReceived = $pdo->prepare($sqlPayTotal);
    $stmtPayTotalReceived->execute(['bid1'=>$branchId, 'bid2'=>$branchId, 'bid3'=>$branchId]);
    $payTotalReceived = (float)$stmtPayTotalReceived->fetchColumn();


    // Total Dues
    $sqlPayDuesTotal = "
        SELECT SUM(d) FROM (
            SELECT COALESCE(SUM(due_amount), 0) as d FROM tests WHERE branch_id = :bid1
            UNION ALL
            SELECT COALESCE(SUM(due_amount), 0) as d FROM patients WHERE branch_id = :bid2
        ) as t
    ";
    $stmtPayTotalDues = $pdo->prepare($sqlPayDuesTotal);
    $stmtPayTotalDues->execute(['bid1'=>$branchId, 'bid2'=>$branchId]);
    $payTotalDues = (float)$stmtPayTotalDues->fetchColumn();


    // --- 6. SCHEDULE (Restored) ---
    $stmtSched = $pdo->prepare("
        SELECT patient_name, appointment_time, status
        FROM registration 
        WHERE branch_id = :bid 
          AND appointment_date = :today
          AND status NOT IN ('closed', 'cancelled', 'consulted')
        ORDER BY appointment_time ASC
        LIMIT 10
    ");
    $stmtSched->execute(['bid' => $branchId, 'today' => $today]);
    $schedule = $stmtSched->fetchAll(PDO::FETCH_ASSOC);

    // --- Response ---
    echo json_encode([
        "status" => "success",
        "data" => [
            "registration" => [
                "today" => ["registration" => $regToday, "appointments" => $apptToday],
                "total" => ["registration" => $regTotal, "in_queue" => $queueTotal]
            ],
            "inquiry" => [
                "today" => ["general" => $genInqToday, "test_inquiry" => $testInqToday],
                "total" => ["general" => $genInqTotal, "test_inquiry" => $testInqTotal]
            ],
            "patients" => [
                "today" => ["enrolled" => $patEnrolledToday, "ongoing" => $patOngoing],
                "total" => ["enrolled" => $patTotal, "discharged" => $patDischarged]
            ],
            "tests" => [
                "today" => ["scheduled" => $testSchedToday, "conducted" => $testCondToday],
                "total" => ["in_queue" => $testQueueTotal, "conducted" => $testCondTotal]
            ],
            "payments" => [
                "today" => [
                    "received" => $payTodayReceived, 
                    "dues" => $payTodayDues,
                    "breakdown" => [
                        "registrations" => $payRegToday,
                        "tests" => $payTestToday,
                        "treatments" => $payTreatToday
                    ]
                ],
                "total" => ["received" => $payTotalReceived, "dues" => $payTotalDues]
            ],
            "schedule" => $schedule
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
