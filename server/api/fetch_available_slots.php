<?php session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../common/db.php';

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
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Branch ID required from valid Employee.']);
    exit;
}
$selectedDate = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

// Basic date validation
if (!DateTime::createFromFormat('Y-m-d', $selectedDate)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid date format']);
    exit;
}

try {
    // Fetch filled slots
    $stmt = $pdo->prepare("
        SELECT appointment_time 
        FROM registration 
        WHERE appointment_date = :selected_date 
          AND branch_id = :branch_id
          AND appointment_time IS NOT NULL
          AND status NOT IN ('closed', 'cancelled')
    ");
    $stmt->execute([
        ':selected_date' => $selectedDate,
        ':branch_id' => $branchId
    ]);
    
    $filledSlots = $stmt->fetchAll(PDO::FETCH_COLUMN);
    // Normalize to H:i
    $filledSlots = array_map(fn($t) => date('H:i', strtotime($t)), $filledSlots);

    // Generate slots (09:00 to 19:00, 30 min intervals)
    $slots = [];
    $start = new DateTime('09:00');
    $end   = new DateTime('19:00'); // 7 PM

    while ($start < $end) {
        $time24 = $start->format('H:i');
        $time12 = $start->format('h:i A');
        
        $slots[] = [
            'time' => $time24,
            'label' => $time12,
            'is_booked' => in_array($time24, $filledSlots)
        ];
        
        $start->modify('+30 minutes');
    }

    echo json_encode([
        'status' => 'success', 
        'date' => $selectedDate,
        'slots' => $slots
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
