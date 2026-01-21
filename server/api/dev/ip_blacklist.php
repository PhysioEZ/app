<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../common/db.php';

$action = $_POST['action'] ?? $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'list_blocked':
            // Get all blocked IPs
            $stmt = $pdo->query("
                SELECT ip_address, reason, blocked_at, blocked_by 
                FROM blocked_ips 
                ORDER BY blocked_at DESC
            ");
            
            $blocked = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'status' => 'success',
                'blocked_ips' => $blocked,
                'count' => count($blocked)
            ]);
            break;
            
        case 'block_ip':
            $ip = $_POST['ip'] ?? '';
            $reason = $_POST['reason'] ?? 'Blocked from Traffic Tracker';
            $blockedBy = $_POST['blocked_by'] ?? 'admin';
            
            if (empty($ip)) {
                throw new Exception('IP address is required');
            }
            
            // Validate IP format
            if (!filter_var($ip, FILTER_VALIDATE_IP)) {
                throw new Exception('Invalid IP address format');
            }
            
            // Check if already blocked
            $check = $pdo->prepare("SELECT COUNT(*) FROM blocked_ips WHERE ip_address = ?");
            $check->execute([$ip]);
            if ($check->fetchColumn() > 0) {
                throw new Exception('IP is already blocked');
            }
            
            // Block the IP
            $stmt = $pdo->prepare("
                INSERT INTO blocked_ips (ip_address, reason, blocked_by, blocked_at) 
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$ip, $reason, $blockedBy]);
            
            echo json_encode([
                'status' => 'success',
                'message' => "IP $ip has been blocked"
            ]);
            break;
            
        case 'unblock_ip':
            $ip = $_POST['ip'] ?? '';
            
            if (empty($ip)) {
                throw new Exception('IP address is required');
            }
            
            // Unblock the IP
            $stmt = $pdo->prepare("DELETE FROM blocked_ips WHERE ip_address = ?");
            $stmt->execute([$ip]);
            
            if ($stmt->rowCount() === 0) {
                throw new Exception('IP was not blocked');
            }
            
            echo json_encode([
                'status' => 'success',
                'message' => "IP $ip has been unblocked"
            ]);
            break;
            
        case 'check_ip':
            $ip = $_GET['ip'] ?? '';
            
            if (empty($ip)) {
                throw new Exception('IP address is required');
            }
            
            $stmt = $pdo->prepare("SELECT * FROM blocked_ips WHERE ip_address = ?");
            $stmt->execute([$ip]);
            $blocked = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'status' => 'success',
                'is_blocked' => $blocked !== false,
                'details' => $blocked ?: null
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
