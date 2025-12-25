<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../common/db.php';

// In a real app, we'd validate the session/token here.
// For this mobile app demo, we might accept an 'employee_id' param if session isn't available via API (API is stateless usually).
// However, existing APIs seem to assume session or passed parameters. 
// Let's accept 'employee_id' via POST or GET for flexibility, defaulting to 1 (Admin) for testing if not set.

$input = json_decode(file_get_contents("php://input"), true);
$employeeId = isset($_GET['employee_id']) ? (int)$_GET['employee_id'] : ($input['employee_id'] ?? 1);

try {
    $stmt = $pdo->prepare("
        SELECT 
            e.employee_id, e.first_name, e.last_name, e.job_title, e.phone_number, 
            e.address, e.date_of_birth, e.date_of_joining, e.is_active, e.photo_path,
            e.email,
            r.role_name AS role,
            b.branch_id, b.branch_name, b.clinic_name, 
            b.phone_primary AS branch_phone, b.email AS branch_email,
            b.address_line_1, b.city
        FROM employees e
        LEFT JOIN roles r ON e.role_id = r.role_id
        LEFT JOIN branches b ON e.branch_id = b.branch_id
        WHERE e.employee_id = :eid
        LIMIT 1
    ");
    
    $stmt->execute([':eid' => $employeeId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $user['full_name'] = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
        echo json_encode(["status" => "success", "data" => $user]);
    } else {
        echo json_encode(["status" => "error", "message" => "User not found"]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
