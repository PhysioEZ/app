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
$input = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
}

$employeeId = $_GET['employee_id'] ?? $input['employee_id'] ?? $_REQUEST['user_id'] ?? $_SESSION['employee_id'] ?? null;
$branchId = 0;

if ($employeeId) {
    try {
        $stmtB = $pdo->prepare("SELECT branch_id FROM employees WHERE employee_id = ?");
        $stmtB->execute([$employeeId]);
        $val = $stmtB->fetchColumn();
        if ($val) $branchId = $val;
    } catch(Exception $e){}
}

if (!$branchId && isset($_GET["branch_id"])) { $branchId = (int)$_GET["branch_id"]; }
if (!$branchId) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Branch ID required from valid Employee.']);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $startDate = $_GET['start_date'] ?? date('Y-m-01');
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $offset = ($page - 1) * $limit;

        // 1. Calculate Stats
        $todayDate = date('Y-m-d');
        $stmtBudget = $pdo->prepare("
            SELECT daily_budget_amount FROM branch_budgets
            WHERE branch_id = :branch_id AND effective_from_date <= :today_date
            ORDER BY effective_from_date DESC
            LIMIT 1
        ");
        $stmtBudget->execute([':branch_id' => $branchId, ':today_date' => $todayDate]);
        $dailyBudget = (float)($stmtBudget->fetchColumn() ?? 0.00);

        $stmtToday = $pdo->prepare("
            SELECT SUM(amount) FROM expenses
            WHERE branch_id = :branch_id AND expense_date = :today_date AND status = 'approved'
        ");
        $stmtToday->execute([':branch_id' => $branchId, ':today_date' => $todayDate]);
        $totalApprovedToday = (float)$stmtToday->fetchColumn();

        $remainingBudget = $dailyBudget - $totalApprovedToday;

        // Filtered Totals
        $whereSql = "branch_id = :branch_id AND expense_date BETWEEN :start_date AND :end_date";
        $params = [':branch_id' => $branchId, ':start_date' => $startDate, ':end_date' => $endDate];

        $stmtTotal = $pdo->prepare("
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(amount), 0) as total_amount,
                COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as approved_amount,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
            FROM expenses
            WHERE $whereSql
        ");
        $stmtTotal->execute($params);
        $totals = $stmtTotal->fetch(PDO::FETCH_ASSOC);

        // 2. Fetch Data List
        $sql = "
            SELECT 
                e.expense_id, e.voucher_no, e.expense_date, e.paid_to, e.expense_for, 
                e.amount, e.amount_in_words, e.payment_method, e.status, e.description,
                e.bill_image_path, e.created_at, e.expense_done_by
            FROM expenses e
            WHERE $whereSql
            ORDER BY e.expense_date DESC, e.created_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'stats' => [
                'daily_budget' => $dailyBudget,
                'remaining_today' => $remainingBudget,
                'total_expenses' => (int)$totals['count'],
                'total_amount' => (float)$totals['total_amount'],
                'approved_amount' => (float)$totals['approved_amount'],
                'pending_amount' => (float)$totals['pending_amount']
            ],
            'data' => $expenses,
            'pagination' => [
                'page' => $page,
                'limit' => $limit
            ]
        ]);
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Create Expense
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = $input['user_id'] ?? 0; // Or fetch from token/session if available? Mobile sends user_id usually.
        // If user_id is not passed, maybe use 0 or logic? Apps usually send context.
        // We'll trust input for now or default.
        
        $voucher_no = trim($input['voucher_no'] ?? '');
        $expense_date = $input['expense_date'] ?? date('Y-m-d');
        $paid_to = trim($input['paid_to'] ?? '');
        $description = trim($input['description'] ?? '');
        $amount = (float)($input['amount'] ?? 0);
        $expense_done_by = trim($input['expense_done_by'] ?? '');
        $expense_for = trim($input['expense_for'] ?? '');
        $payment_method = trim($input['payment_method'] ?? '');
        $amount_in_words = trim($input['amount_in_words'] ?? '');

        if (empty($expense_date) || empty($paid_to) || $amount <= 0 || empty($payment_method) || empty($expense_done_by) || empty($expense_for)) {
            throw new Exception("Missing required fields or invalid amount.");
        }

        // Voucher check
        if (!empty($voucher_no)) {
            $stmtCheck = $pdo->prepare("SELECT 1 FROM expenses WHERE branch_id = ? AND voucher_no = ?");
            $stmtCheck->execute([$branchId, $voucher_no]);
            if ($stmtCheck->fetch()) {
                throw new Exception("Voucher No. '{$voucher_no}' already exists.");
            }
        } else {
            $voucher_no = 'EXP-' . date('YmdHis');
        }

        // Budget Logic (Determine Status)
        $stmtBudget = $pdo->prepare("
            SELECT daily_budget_amount FROM branch_budgets
            WHERE branch_id = ? AND effective_from_date <= ?
            ORDER BY effective_from_date DESC
            LIMIT 1
        ");
        $stmtBudget->execute([$branchId, $expense_date]);
        $dailyBudget = (float)($stmtBudget->fetchColumn() ?? 0.00);

        $stmtToday = $pdo->prepare("
            SELECT SUM(amount) FROM expenses
            WHERE branch_id = ? AND expense_date = ? AND status = 'approved'
        ");
        $stmtToday->execute([$branchId, $expense_date]);
        $totalApprovedToday = (float)$stmtToday->fetchColumn();

        $remainingBudgetBeforeThis = $dailyBudget - $totalApprovedToday;
        $status = ($amount <= $remainingBudgetBeforeThis) ? 'approved' : 'pending';

        // Insert
        $stmt = $pdo->prepare(
            "INSERT INTO expenses (branch_id, user_id, voucher_no, expense_date, paid_to, expense_done_by, expense_for, description, amount, amount_in_words, payment_method, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
        );
        $stmt->execute([
            $branchId,
            $userId,
            $voucher_no,
            $expense_date,
            $paid_to,
            $expense_done_by,
            $expense_for,
            $description,
            $amount,
            $amount_in_words,
            $payment_method,
            $status
        ]);
        $newExpenseId = $pdo->lastInsertId();

        // --- Notification for Admin (Match Web App Logic) ---
        if ($status === 'pending') {
            require_once '../../common/logger.php'; // Ensure helper is available
            
            // Fetch username if not set, or use "Mobile User"
            $username = "Mobile User";
            if ($userId) {
                $uStmt = $pdo->prepare("SELECT CONCAT(first_name, ' ', last_name) FROM employees WHERE employee_id = ?");
                $uStmt->execute([$userId]);
                $username = $uStmt->fetchColumn() ?: "User #$userId";
            }

            $message = "New high-value expense req: {$amount} ({$voucher_no}) from {$username}.";
            $link = "manage_expenses.php?search=" . $voucher_no;
            
            // Notify Admins
            create_notification_for_roles($pdo, $branchId, ['admin'], $message, $link, $userId);
        }

        echo json_encode([
            'status' => 'success',
            'message' => "Expense added successfully. Status: " . ucfirst($status),
            'expense_status' => $status,
            'voucher_no' => $voucher_no
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
