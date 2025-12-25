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

// STRICT BRANCH ISOLATION & INPUT HANDLING
$input = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?? [];
}

$employeeId = $_GET['employee_id'] ?? $input['employee_id'] ?? $input['user_id'] ?? $_SESSION['employee_id'] ?? null;
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
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Branch ID required from valid Employee.']);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // 1. Fetch Patients (Active/Searchable)
        // We fetch minimal data for dropdown
        $stmtPat = $pdo->prepare("
            SELECT p.patient_id, r.patient_name, r.phone_number, p.status
            FROM patients p 
            JOIN registration r ON p.registration_id = r.registration_id
            WHERE p.branch_id = :branch_id 
            ORDER BY r.patient_name ASC
        ");
        $stmtPat->execute([':branch_id' => $branchId]);
        $patients = $stmtPat->fetchAll(PDO::FETCH_ASSOC);

        // 2. Fetch Recent Feedbacks
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $stmtFeed = $pdo->prepare("
            SELECT pf.*, r.patient_name, CONCAT(e.first_name, ' ', e.last_name) as staff_name
            FROM patient_feedback pf
            JOIN patients p ON pf.patient_id = p.patient_id
            JOIN registration r ON p.registration_id = r.registration_id
            LEFT JOIN employees e ON pf.created_by_employee_id = e.employee_id 
            WHERE pf.branch_id = :branch_id
            ORDER BY pf.created_at DESC
            LIMIT :limit
        "); 
        // Note: Joined with 'users' table assuming 'created_by_employee_id' refers to user ID from app login.
        // In the original PHP view, it joined 'employees'. But the App usually uses 'users'.
        // We will try 'users' first, or fallback if needed. Data might be employee_id matching users.id?
        // Let's assume 'users' is the correct auth table for the app.
        
        $stmtFeed->execute([':branch_id' => $branchId, ':limit' => $limit]);
        $feedbacks = $stmtFeed->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'patients' => $patients,
            'feedbacks' => $feedbacks
        ]);
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Input already decoded above
        
        $patientId = $input['patient_id'] ?? '';
        $feedbackType = $input['feedback_type'] ?? 'Good';
        $patientStatus = $input['patient_status'] ?? 'active';
        $comments = $input['comments'] ?? '';
        $userId = $input['user_id'] ?? 0;

        if (empty($patientId)) {
            throw new Exception("Patient selection is required.");
        }

        $pdo->beginTransaction();

        // Insert Feedback
        $stmtFb = $pdo->prepare("
            INSERT INTO patient_feedback 
            (patient_id, branch_id, feedback_type, patient_status_snapshot, comments, created_by_employee_id, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmtFb->execute([
            $patientId, 
            $branchId, 
            $feedbackType, 
            $patientStatus, 
            $comments, 
            $userId
        ]);

        // Update Patient Status
        // Map form status to DB status
        $statusMap = [
            'active' => 'active',
            'completed' => 'completed',
            'discontinued' => 'inactive',
            'inactive' => 'inactive'
        ];
        $dbStatus = $statusMap[$patientStatus] ?? 'active';

        $stmtUpd = $pdo->prepare("UPDATE patients SET status = ? WHERE patient_id = ? AND branch_id = ?");
        $stmtUpd->execute([$dbStatus, $patientId, $branchId]);

        $pdo->commit();

        echo json_encode([
            'status' => 'success',
            'message' => 'Feedback saved and patient status updated.'
        ]);
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
