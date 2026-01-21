<?php
declare(strict_types=1);

ini_set('display_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../../common/db.php';
require_once '../../../common/logger.php';
require_once '../../../common/push_utils.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

if (empty($action)) {
    $action = $input['action'] ?? $_POST['action'] ?? '';
}

try {
    if ($action === 'fetch_issues') {
        $userId = $_GET['user_id'] ?? 0;
        $status = $_GET['status'] ?? 'all';
        $search = $_GET['search'] ?? '';

        // Check if user is developer (Must have 'Developer' job title)
        $stmtUser = $pdo->prepare("
            SELECT r.role_name, e.employee_id, e.job_title
            FROM employees e
            JOIN roles r ON e.role_id = r.role_id
            WHERE e.employee_id = ?
        ");
        $stmtUser->execute([$userId]);
        $user = $stmtUser->fetch();
        
        $isDeveloper = ($user && strtolower(trim($user['job_title'] ?? '')) === 'developer');

        $where = "1=1";
        $params = [];

        if ($status !== 'all') {
            $where .= " AND s.status = :status";
            $params[':status'] = $status;
        }

        if (!empty($search)) {
            $where .= " AND (s.description LIKE :search OR b.branch_name LIKE :search2 OR e.first_name LIKE :search3 OR e.last_name LIKE :search4)";
            $params[':search'] = "%$search%";
            $params[':search2'] = "%$search%";
            $params[':search3'] = "%$search%";
            $params[':search4'] = "%$search%";
        }
        
        $sql = "
            SELECT 
                s.*, 
                b.branch_name, 
                CONCAT(e.first_name, ' ', e.last_name) as reported_by_name
            FROM system_issues s
            LEFT JOIN branches b ON s.branch_id = b.branch_id
            LEFT JOIN employees e ON s.reported_by = e.employee_id
            WHERE $where
            ORDER BY s.created_at DESC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $issues = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch attachments for each issue
        foreach ($issues as &$issue) {
            $stmtAtt = $pdo->prepare("SELECT file_path FROM issue_attachments WHERE issue_id = ?");
            $stmtAtt->execute([$issue['issue_id']]);
            $issue['attachments'] = $stmtAtt->fetchAll(PDO::FETCH_COLUMN);
        }

        echo json_encode(['status' => 'success', 'data' => $issues, 'is_developer' => $isDeveloper]);

    } elseif ($action === 'update_issue') {
        // Handle both JSON and FormData
        $issueId = $_POST['issue_id'] ?? $input['issue_id'] ?? 0;
        $userId = $_POST['user_id'] ?? $input['user_id'] ?? 0;
        $status = $_POST['status'] ?? $input['status'] ?? '';
        $adminResponse = $_POST['admin_response'] ?? $input['admin_response'] ?? '';
        $releaseSchedule = $_POST['release_schedule'] ?? $input['release_schedule'] ?? '';

        if (!$issueId) throw new Exception("Issue ID required");

        // Fetch original issue to know who to notify
        $stmtOrig = $pdo->prepare("SELECT reported_by, branch_id FROM system_issues WHERE issue_id = ?");
        $stmtOrig->execute([$issueId]);
        $orig = $stmtOrig->fetch();

        // Verify again that this user is a developer
        $stmtV = $pdo->prepare("SELECT job_title FROM employees WHERE employee_id = ?");
        $stmtV->execute([$userId]);
        $jt = $stmtV->fetchColumn();
        if (strtolower(trim($jt ?: '')) !== 'developer') {
            throw new Exception("Unauthorized: Only developers can update issues");
        }

        $stmt = $pdo->prepare("
            UPDATE system_issues 
            SET status = ?, admin_response = ?, release_schedule = ?, updated_at = NOW()
            WHERE issue_id = ?
        ");
        $stmt->execute([$status, $adminResponse, $releaseSchedule, $issueId]);

        // Handle File Uploads (Developer Attachments)
        if (isset($_FILES['images'])) {
            $uploadDir = '../../../../uploads/issues/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

            foreach ($_FILES['images']['tmp_name'] as $key => $tmpName) {
                if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {
                    $name = $_FILES['images']['name'][$key];
                    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                    $newFileName = 'dev_reply_' . $issueId . '_' . uniqid() . '.' . $ext;
                    $dest = $uploadDir . $newFileName;

                    if (move_uploaded_file($tmpName, $dest)) {
                        $stmtImg = $pdo->prepare("INSERT INTO issue_attachments (issue_id, file_path) VALUES (?, ?)");
                        $stmtImg->execute([$issueId, 'uploads/issues/' . $newFileName]);
                    }
                }
            }
        }

        // --- Notification Logic for Original Reporter ---
        if ($orig && $orig['reported_by']) {
            try {
                $reporterId = (int)$orig['reported_by'];
                $branchId = (int)$orig['branch_id'];
                $statusStr = str_replace('_', ' ', ucfirst($status));
                $notifMsg = "Your Issue #$issueId has been updated to '$statusStr'";
                if ($adminResponse) $notifMsg .= ": " . (strlen($adminResponse) > 50 ? substr($adminResponse, 0, 47) . '...' : $adminResponse);

                // 1. DB Notification
                $stNotif = $pdo->prepare("INSERT INTO notifications (employee_id, branch_id, message, link_url, created_by_employee_id, created_at) VALUES (?, ?, ?, 'support', ?, NOW())");
                $stNotif->execute([$reporterId, $branchId, $notifMsg, $userId]);

                // 2. Push Notification
                sendDetailsNotification($reporterId, "Issue Updated", $notifMsg, ['link' => 'support'], $pdo);
            } catch (Exception $e) {
                error_log("Dev Issue Update Notification Error: " . $e->getMessage());
            }
        }

        echo json_encode(['status' => 'success']);

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
