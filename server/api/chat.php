<?php
// /srv/http/admin/mobile/api/chat.php

declare(strict_types=1);
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Adjust paths to common files - New location is /admin/mobile/api
require_once '../../common/db.php';
require_once '../../common/config.php'; 

// Adjust paths to common files

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ---------------------------------------------------------
// Authentication / Identification
// ---------------------------------------------------------
// We try to get IDs from Session first, then from Request (for API usage)
$currentEmployeeId = $_SESSION['employee_id'] ?? $_REQUEST['employee_id'] ?? $_REQUEST['user_id'] ?? null;

// Enforce Branch ID from DB to ensure data isolation (fixes cross-branch view issue)
if ($currentEmployeeId) {
    try {
        $stmtB = $pdo->prepare("SELECT branch_id FROM employees WHERE employee_id = ?");
        $stmtB->execute([$currentEmployeeId]);
        $dbBranchId = $stmtB->fetchColumn();
        if ($dbBranchId) {
            $branchId = $dbBranchId; // Override request/session with authoritative DB value
        }
    } catch (Exception $e) {
        // Fallback or log if needed
    }
}
// Fallback if DB lookup failed
if (!isset($branchId)) {
    $branchId = $_SESSION['branch_id'] ?? $_REQUEST['branch_id'] ?? null;
}

if (!$currentEmployeeId || !$branchId) {
    // Attempt fallback query if we only have user_id but need branch info
    // (Optional, dependent on implementation. For now, require sending both or having session)
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing employee_id or branch_id']);
    exit;
}

$action = $_REQUEST['action'] ?? '';

// ---------------------------------------------------------
// Encryption Helpers (Ported from legacy chat_api.php)
// ---------------------------------------------------------
const ENCRYPTION_METHOD = 'aes-256-cbc';

function encryptMessage(string $plaintext, string $key): string
{
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length(ENCRYPTION_METHOD));
    $ciphertext = openssl_encrypt($plaintext, ENCRYPTION_METHOD, $key, 0, $iv);
    // Combine IV and ciphertext
    return base64_encode($iv) . ':' . base64_encode($ciphertext);
}

function decryptMessage(string $payload, string $key)
{
    // Check if payload contains colon
    if (strpos($payload, ':') === false) return $payload; // Return original if not formatted
    
    list($iv_b64, $ciphertext_b64) = explode(':', $payload, 2);
    if (!$iv_b64 || !$ciphertext_b64) {
        return false;
    }
    $iv = base64_decode($iv_b64);
    $ciphertext = base64_decode($ciphertext_b64);
    return openssl_decrypt($ciphertext, ENCRYPTION_METHOD, $key, 0, $iv);
}

// Ensure encryption key exists
if (!defined('CHAT_ENCRYPTION_KEY')) {
    define('CHAT_ENCRYPTION_KEY', 'default_secret_key_if_missing'); 
}

// ---------------------------------------------------------
// Action: Get Users (Contacts)
// ---------------------------------------------------------
if ($action === 'users') {
    try {
        // 1. Get this branch's admin_employee_id
        $stmtAdmin = $pdo->prepare("SELECT admin_employee_id FROM branches WHERE branch_id = ?");
        $stmtAdmin->execute([$branchId]);
        $branchAdminId = $stmtAdmin->fetchColumn();

        // 2. Check if current user IS an admin (manages branches)
        $stmtManagedBranches = $pdo->prepare("SELECT branch_id FROM branches WHERE admin_employee_id = ?");
        $stmtManagedBranches->execute([$currentEmployeeId]);
        $managedBranches = $stmtManagedBranches->fetchAll(PDO::FETCH_COLUMN);

        $users = [];

        if (!empty($managedBranches)) {
            // ADMIN VIEW: Show all employees from branches they manage
            $placeholders = implode(',', array_fill(0, count($managedBranches), '?'));
            $stmt = $pdo->prepare(
                "SELECT
                    e.employee_id as id,
                    CONCAT(e.first_name, ' (', b.branch_name, ')') as username,
                    r.role_name as role,
                    (SELECT COUNT(*) 
                     FROM chat_messages cm 
                     WHERE cm.sender_employee_id = e.employee_id 
                       AND cm.receiver_employee_id = ? 
                       AND cm.is_read = 0) as unread_count
                FROM employees e
                JOIN roles r ON e.role_id = r.role_id
                JOIN branches b ON e.branch_id = b.branch_id
                WHERE e.branch_id IN ($placeholders) 
                  AND e.employee_id != ?
                  AND e.is_active = 1
                ORDER BY unread_count DESC, b.branch_name ASC, e.first_name ASC"
            );
            $params = array_merge([$currentEmployeeId], $managedBranches, [$currentEmployeeId]);
            $stmt->execute($params);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            // EMPLOYEE VIEW: Show same-branch employees + branch admin
            $stmt = $pdo->prepare(
                "SELECT
                    e.employee_id as id,
                    e.first_name as username,
                    r.role_name as role,
                    (SELECT COUNT(*) 
                     FROM chat_messages cm 
                     WHERE cm.sender_employee_id = e.employee_id 
                       AND cm.receiver_employee_id = :current_employee_id_sub 
                       AND cm.is_read = 0) as unread_count
                FROM employees e
                JOIN roles r ON e.role_id = r.role_id
                WHERE (e.branch_id = :branch_id OR e.employee_id = :admin_id)
                  AND e.employee_id != :current_employee_id_main 
                  AND e.is_active = 1
                ORDER BY unread_count DESC, e.first_name ASC"
            );
            $stmt->execute([
                ':branch_id' => $branchId, 
                ':admin_id' => $branchAdminId ?: 0,
                ':current_employee_id_sub' => $currentEmployeeId,
                ':current_employee_id_main' => $currentEmployeeId
            ]);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode(['success' => true, 'users' => $users]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
    }
    exit;
}

// ---------------------------------------------------------
// Action: Fetch Messages (History)
// ---------------------------------------------------------
if ($action === 'fetch') {
    $partnerId = (int)($_REQUEST['partner_id'] ?? 0);

    if (empty($partnerId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing partner ID']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $stmtFetch = $pdo->prepare(
            "SELECT message_id, sender_employee_id, message_type, message_text, created_at, is_read 
             FROM chat_messages
             WHERE (sender_employee_id = ? AND receiver_employee_id = ?)
                OR (sender_employee_id = ? AND receiver_employee_id = ?)
             ORDER BY created_at ASC"
        );

        $stmtFetch->execute([$currentEmployeeId, $partnerId, $partnerId, $currentEmployeeId]);
        $messages = $stmtFetch->fetchAll(PDO::FETCH_ASSOC);

        // Decrypt
        $decryptedMessages = array_map(function ($msg) use ($currentEmployeeId) {
            if ($msg['message_type'] === 'text') {
                $decrypted = decryptMessage($msg['message_text'], CHAT_ENCRYPTION_KEY);
                // Fallback if decryption fails
                $msg['message_text'] = $decrypted !== false ? $decrypted : $msg['message_text'];
            }
            $msg['is_sender'] = (int)($msg['sender_employee_id'] ?? 0) == (int)$currentEmployeeId;
            
            // Fix Timezone: DB is UTC, convert to Asia/Kolkata
            if (!empty($msg['created_at'])) {
                try {
                    $dt = new DateTime($msg['created_at'], new DateTimeZone('UTC'));
                    $dt->setTimezone(new DateTimeZone('Asia/Kolkata'));
                    $msg['created_at'] = $dt->format('c');
                } catch (Exception $e) {}
            }
            
            return $msg;
        }, $messages);

        // Mark as read
        $stmtUpdate = $pdo->prepare(
            "UPDATE chat_messages SET is_read = 1 
             WHERE sender_employee_id = ? AND receiver_employee_id = ? AND is_read = 0"
        );
        $stmtUpdate->execute([$partnerId, $currentEmployeeId]);

        $pdo->commit();

        echo json_encode(['success' => true, 'messages' => $decryptedMessages]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// ---------------------------------------------------------
// Action: Send Message
// ---------------------------------------------------------
if ($action === 'send') {
    try {
        $receiverId = (int)($_POST['receiver_id'] ?? 0);
        $messageText = trim($_POST['message_text'] ?? '');
        
        // TODO: Handle File Upload if needed (omitted for now for simplicity, can be added later)
        // For now, text only.

        if (empty($receiverId)) {
            throw new Exception('Missing receiver ID.');
        }

        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../../uploads/chat_uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $file = $_FILES['file'];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $filename = uniqid('chat_', true) . '.' . $ext;
            $targetPath = $uploadDir . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                $messageType = in_array($ext, ['jpg','jpeg','png','gif','webp']) ? 'image' : 
                               (in_array($ext, ['pdf']) ? 'pdf' : 'doc');
                // Path consistent with previous 404 logs observation
                $messageContent = 'admin/uploads/chat_uploads/' . $filename;
            } else {
                throw new Exception('Failed to move uploaded file.');
            }
        } elseif (!empty($messageText)) {
            $messageType = 'text';
            $messageContent = encryptMessage($messageText, CHAT_ENCRYPTION_KEY);
        } else {
            throw new Exception('Message or File required.');
        }

        $stmt = $pdo->prepare(
            "INSERT INTO chat_messages (sender_employee_id, receiver_employee_id, message_type, message_text) VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([$currentEmployeeId, $receiverId, $messageType, $messageContent]);

        // Notification Logic
        $senderName = 'Colleague'; // Fallback
        // Ideally fetch sender name, but keeping it simple. Notification system handles display.
        $notificationMessage = "New message";

        $linkUrl = "chat_with_employee_id:" . $currentEmployeeId;

        $stmt_notif = $pdo->prepare(
            "INSERT INTO notifications (employee_id, created_by_employee_id, branch_id, message, link_url) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt_notif->execute([$receiverId, $currentEmployeeId, $branchId, $notificationMessage, $linkUrl]);

        echo json_encode(['success' => true]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Send Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
