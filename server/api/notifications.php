<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

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
    echo json_encode(['status' => 'error', 'message' => 'Database configuration not found']);
    exit;
}

// Utils
if (file_exists('../../../common/utils.php')) {
    require_once '../../../common/utils.php';
} elseif (file_exists('../../common/utils.php')) {
    require_once '../../common/utils.php';
}

// Include Push Logic
// Include Push Logic
$pushPaths = [
    __DIR__ . '/../../../common/send_push.php',
    __DIR__ . '/../../common/send_push.php',
    '/srv/http/admin/common/send_push.php'
];

foreach ($pushPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        break;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $employeeId = isset($_GET['employee_id']) ? (int)$_GET['employee_id'] : 0;
        
        if (!$employeeId) {
             // Fallback if user_id passed
             $employeeId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
        }

        if (!$employeeId) {
            echo json_encode(['status' => 'error', 'message' => 'Employee ID required', 'data' => []]);
            exit;
        }

        // Query matching legacy logic
        $stmt = $pdo->prepare("
            SELECT 
                n.notification_id, n.message, n.link_url, n.is_read, n.created_at,
                e.first_name, e.last_name
            FROM notifications n
            LEFT JOIN employees e ON n.created_by_employee_id = e.employee_id
            WHERE n.employee_id = :employee_id
            ORDER BY n.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([':employee_id' => $employeeId]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fix Timezone: DB is UTC, convert to Asia/Kolkata
        foreach ($notifications as &$n) {
            if (!empty($n['created_at'])) {
                try {
                    $dt = new DateTime($n['created_at'], new DateTimeZone('UTC'));
                    $dt->setTimezone(new DateTimeZone('Asia/Kolkata'));
                    $n['created_at'] = $dt->format('c');
                } catch (Exception $e) {}
            }
        }
        unset($n);

        // Calculate unread count
        $unreadCount = 0;
        foreach ($notifications as $n) {
            if ($n['is_read'] == 0) $unreadCount++;
        }

        echo json_encode([
            'status' => 'success',
            'data' => $notifications,
            'unread_count' => $unreadCount
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        if ($action === 'mark_read') {
            $notifId = $input['notification_id'] ?? 0;
            if ($notifId) {
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE notification_id = ?");
                $stmt->execute([$notifId]);
                echo json_encode(['status' => 'success', 'message' => 'Marked as read']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Notification ID missing']);
            }
        } elseif ($action === 'mark_all_read') {
            $employeeId = $input['employee_id'] ?? 0;
            if ($employeeId) {
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE employee_id = ?");
                $stmt->execute([$employeeId]);
                 echo json_encode(['status' => 'success', 'message' => 'All marked as read']);
            }
        } elseif ($action === 'delete') {
            $notifId = $input['notification_id'] ?? 0;
            if ($notifId) {
                $stmt = $pdo->prepare("DELETE FROM notifications WHERE notification_id = ?");
                $stmt->execute([$notifId]);
                echo json_encode(['status' => 'success', 'message' => 'Notification deleted']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Notification ID missing']);
            }
        } elseif ($action === 'delete_all') {
            $employeeId = $input['employee_id'] ?? 0;
            if ($employeeId) {
                $stmt = $pdo->prepare("DELETE FROM notifications WHERE employee_id = ?");
                $stmt->execute([$employeeId]);
                echo json_encode(['status' => 'success', 'message' => 'All notifications deleted']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Employee ID missing']);
            }
        } elseif ($action === 'send') {
            // New Action: Send Notification (DB + Push)
            $targetUserId = $input['target_user_id'] ?? 0;
            $message = $input['message'] ?? '';
            $link = $input['link_url'] ?? '';
            $title = $input['title'] ?? 'New Notification';
            $senderId = (isset($input['sender_id']) && $input['sender_id'] > 0) ? $input['sender_id'] : null;

            if ($targetUserId && $message) {
                // 0. Get branch_id for target user
                $branchId = 1; // Default
                $stmt = $pdo->prepare("SELECT branch_id FROM employees WHERE employee_id = ?");
                $stmt->execute([$targetUserId]);
                $userBranch = $stmt->fetchColumn();
                if ($userBranch) $branchId = $userBranch;

                // 1. Insert into DB
                $stmt = $pdo->prepare("INSERT INTO notifications (employee_id, message, link_url, created_by_employee_id, branch_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())");
                $stmt->execute([$targetUserId, $message, $link, $senderId, $branchId]);
                
                // 2. Send Push
                $pushSent = sendDetailsNotification($targetUserId, $title, $message, ['link' => $link]);
                
                echo json_encode([
                    'status' => 'success', 
                    'message' => 'Notification sent',
                    'push_sent' => $pushSent
                ]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Missing target_user_id or message']);
            }
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
