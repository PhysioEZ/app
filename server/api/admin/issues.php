<?php
declare(strict_types=1);

ini_set('display_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../../common/db.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

if (empty($action)) {
    $action = $input['action'] ?? '';
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

    } elseif ($action === 'report_issue') {
        // Handle both JSON and FormData
        $userId = $_POST['user_id'] ?? $input['user_id'] ?? 0;
        $description = $_POST['description'] ?? $input['description'] ?? '';

        if (empty($description)) throw new Exception("Description is required");

        $pdo->beginTransaction();

        // Get branch_id
        $stmtB = $pdo->prepare("SELECT branch_id FROM employees WHERE employee_id = ?");
        $stmtB->execute([$userId]);
        $branchId = $stmtB->fetchColumn() ?: 1;

        $stmt = $pdo->prepare("
            INSERT INTO system_issues (branch_id, reported_by, description, status, release_schedule)
            VALUES (?, ?, ?, 'pending', 'next_release')
        ");
        $stmt->execute([$branchId, $userId, $description]);
        $issueId = $pdo->lastInsertId();

        // Handle File Uploads
        if (isset($_FILES['images'])) {
            $uploadDir = '../../../../uploads/issues/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

            foreach ($_FILES['images']['tmp_name'] as $key => $tmpName) {
                if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {
                    $name = $_FILES['images']['name'][$key];
                    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                    $newFileName = 'issue_' . $issueId . '_' . uniqid() . '.' . $ext;
                    $dest = $uploadDir . $newFileName;

                    if (move_uploaded_file($tmpName, $dest)) {
                        $stmtImg = $pdo->prepare("INSERT INTO issue_attachments (issue_id, file_path) VALUES (?, ?)");
                        $stmtImg->execute([$issueId, 'uploads/issues/' . $newFileName]);
                    }
                }
            }
        }

        $pdo->commit();
        echo json_encode(['status' => 'success']);

    } elseif ($action === 'update_issue') {
        $issueId = $input['issue_id'] ?? 0;
        $userId = $input['user_id'] ?? 0; // Added user_id to verification
        $status = $input['status'] ?? '';
        $adminResponse = $input['admin_response'] ?? '';
        $releaseSchedule = $input['release_schedule'] ?? '';

        if (!$issueId) throw new Exception("Issue ID required");

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

        echo json_encode(['status' => 'success']);

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
