<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

require_once '../../common/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Helper to get branch_id
$branchId = $_GET['branch_id'] ?? $_POST['branch_id'] ?? 1;

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $issueId = $_GET['id'] ?? null;

        if ($issueId) {
            // --- DETAILS ---
            $stmt = $pdo->prepare("
                SELECT 
                    issue_id, description, status, release_schedule, 
                    release_date, admin_response, created_at, reported_by
                FROM system_issues 
                WHERE issue_id = :issue_id AND branch_id = :branch_id
            ");
            $stmt->execute([':issue_id' => $issueId, ':branch_id' => $branchId]);
            $issue = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$issue) {
                echo json_encode(['status' => 'error', 'message' => 'Issue not found']);
                exit;
            }

            // Attachments
            $stmtImg = $pdo->prepare("SELECT file_path FROM issue_attachments WHERE issue_id = :issue_id");
            $stmtImg->execute([':issue_id' => $issueId]);
            $attachments = $stmtImg->fetchAll(PDO::FETCH_COLUMN);

            echo json_encode([
                'status' => 'success',
                'data' => [
                    'issue' => $issue,
                    'attachments' => $attachments
                ]
            ]);

        } else {
            // --- LIST & STATS ---
            $stmt = $pdo->prepare("
                SELECT issue_id, description, status, release_schedule, created_at, admin_response
                FROM system_issues
                WHERE branch_id = :branch_id
                ORDER BY created_at DESC
            ");
            $stmt->execute([':branch_id' => $branchId]);
            $issues = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $totalIssues = count($issues);
            $pendingIssues = count(array_filter($issues, fn($i) => $i['status'] === 'pending'));
            $inProgressIssues = count(array_filter($issues, fn($i) => $i['status'] === 'in_progress'));
            $completedIssues = count(array_filter($issues, fn($i) => in_array($i['status'], ['completed', 'resolved'])));

            echo json_encode([
                'status' => 'success',
                'stats' => [
                    'total' => $totalIssues,
                    'in_progress' => $inProgressIssues,
                    'pending' => $pendingIssues,
                    'completed' => $completedIssues
                ],
                'data' => $issues
            ]);
        }
    } 
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // --- SUBMIT ---
        $description = trim($_POST['description'] ?? '');
        $userId = $_POST['user_id'] ?? 0;

        if (empty($description)) {
            echo json_encode(['status' => 'error', 'message' => 'Description is required']);
            exit;
        }

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO system_issues (branch_id, reported_by, description, status, release_schedule, created_at)
            VALUES (:branch_id, :reported_by, :description, 'pending', 'next_release', NOW())
        ");
        $stmt->execute([
            ':branch_id' => $branchId,
            ':reported_by' => $userId,
            ':description' => $description
        ]);
        $issueId = $pdo->lastInsertId();

        // Files
        if (isset($_FILES['images'])) {
            $uploadDir = '../../uploads/issues/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

            $files = $_FILES['images'];
            // Normalize files array logic (handling single or multiple)
            // But $_FILES['images']['name'] is usually array if multiple
            $fileCount = is_array($files['name']) ? count($files['name']) : 1;
            
            for ($i = 0; $i < $fileCount; $i++) {
                $name = is_array($files['name']) ? $files['name'][$i] : $files['name'];
                $tmpName = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
                $error = is_array($files['error']) ? $files['error'][$i] : $files['error'];

                if ($error === UPLOAD_ERR_OK && $name) {
                    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                    if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                        $newFileName = $issueId . '_' . uniqid() . '.' . $ext;
                        if (move_uploaded_file($tmpName, $uploadDir . $newFileName)) {
                            $stmtImg = $pdo->prepare("INSERT INTO issue_attachments (issue_id, file_path) VALUES (?, ?)");
                            $stmtImg->execute([$issueId, 'uploads/issues/' . $newFileName]);
                        }
                    }
                }
            }
        }

        $pdo->commit();
        echo json_encode(['status' => 'success', 'message' => 'Issue submitted successfully']);
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
