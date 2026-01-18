<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

require_once '../../common/db.php';
require_once '../../common/utils.php';

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
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
