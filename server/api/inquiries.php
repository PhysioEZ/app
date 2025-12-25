<?php session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../common/db.php';

// STRICT BRANCH ISOLATION
$employeeId = $_GET['employee_id'] ?? $_REQUEST['employee_id'] ?? $_SESSION['employee_id'] ?? null;
$branchId = 0;
if ($employeeId) {
    $stmtB = $pdo->prepare("SELECT branch_id FROM employees WHERE employee_id = ?");
    $stmtB->execute([$employeeId]);
    $val = $stmtB->fetchColumn();
    if ($val) $branchId = $val;
}
if (!$branchId && isset($_GET["branch_id"])) { $branchId = (int)$_GET["branch_id"]; }
if (!$branchId) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Branch ID mismatch or missing.']);
    exit;
}
$type = isset($_GET['type']) ? $_GET['type'] : 'quick'; // quick, test, online, booked
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 15;
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$status = isset($_GET['status']) ? trim($_GET['status']) : '';

$offset = ($page - 1) * $limit;

$response = [
    "status" => "error",
    "data" => [],
    "pagination" => [
        "page" => $page,
        "limit" => $limit,
        "total" => 0,
        "pages" => 0
    ]
];

try {
    $table = '';
    $columns = '*';
    $searchCols = [];
    $orderBy = 'created_at DESC';

    switch ($type) {
        case 'quick':
            $table = 'quick_inquiry';
            $searchCols = ['name', 'phone_number'];
            $columns = 'inquiry_id as id, name, phone_number as phone, age, gender, referralSource as referral, chief_complain, review, expected_visit_date, status, created_at';
            break;
        case 'test':
            $table = 'test_inquiry';
            $searchCols = ['name', 'mobile_number', 'testname'];
            $columns = 'inquiry_id as id, name, mobile_number as phone, testname, reffered_by as referral, expected_visit_date, status, created_at';
            break;
        case 'online':
            $table = 'appointment_requests';
            $searchCols = ['fullName', 'phone'];
            $columns = 'id, fullName as name, phone, location, status, created_at';
            break;
        case 'booked':
            $table = 'appointments';
            $searchCols = ['fullName', 'phone'];
            $columns = 'id, fullName as name, phone, consultationType, gender, age, medical_condition, occupation, conditionType, contactMethod, status, created_at';
            break;
        default:
            throw new Exception("Invalid type");
    }

    // Build Query
    $where = "WHERE branch_id = :branch_id";
    $params = [':branch_id' => $branchId];

    if ($search) {
        $likes = [];
        foreach ($searchCols as $col) {
            $likes[] = "$col LIKE :search";
        }
        $where .= " AND (" . implode(" OR ", $likes) . ")";
        $params[':search'] = "%$search%";
    }

    if ($status) {
        $where .= " AND status = :status";
        $params[':status'] = $status;
    }

    // Total Count
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM $table $where");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Fetch Data
    $sql = "SELECT $columns FROM $table $where ORDER BY $orderBy LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    
    // Bind all params including limit/offset
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response['status'] = 'success';
    $response['data'] = $data;
    $response['pagination']['total'] = $total;
    $response['pagination']['pages'] = ceil($total / $limit);

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
exit;
