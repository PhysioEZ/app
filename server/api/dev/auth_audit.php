<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../common/db.php';

$action = $_GET['action'] ?? 'recent_logins';

try {
    switch ($action) {
        case 'recent_logins':
            // Get recent login attempts from audit_log
            $stmt = $pdo->query("
                SELECT 
                    log_id,
                    log_timestamp,
                    username,
                    employee_id,
                    action_type,
                    ip_address,
                    details_after
                FROM audit_log 
                WHERE action_type LIKE '%login%'
                ORDER BY log_timestamp DESC 
                LIMIT 100
            ");
            
            $logins = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse device info from details_after if available
            foreach ($logins as &$login) {
                if (!empty($login['details_after'])) {
                    $details = json_decode($login['details_after'], true);
                    $login['device_info'] = $details['device_info'] ?? null;
                    $login['user_agent'] = $details['user_agent'] ?? null;
                }
            }
            
            echo json_encode([
                'status' => 'success',
                'logins' => $logins,
                'count' => count($logins)
            ]);
            break;
            
        case 'login_stats':
            // Get login statistics
            $stats = [];
            
            // Total logins today
            $stmt = $pdo->query("
                SELECT COUNT(*) as count 
                FROM audit_log 
                WHERE action_type LIKE '%login%' 
                AND DATE(log_timestamp) = CURDATE()
            ");
            $stats['today'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Failed logins today
            $stmt = $pdo->query("
                SELECT COUNT(*) as count 
                FROM audit_log 
                WHERE action_type LIKE '%failed%login%' 
                AND DATE(log_timestamp) = CURDATE()
            ");
            $stats['failed_today'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Unique users today
            $stmt = $pdo->query("
                SELECT COUNT(DISTINCT username) as count 
                FROM audit_log 
                WHERE action_type LIKE '%login%' 
                AND DATE(log_timestamp) = CURDATE()
            ");
            $stats['unique_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Top IPs
            $stmt = $pdo->query("
                SELECT ip_address, COUNT(*) as count 
                FROM audit_log 
                WHERE action_type LIKE '%login%' 
                AND log_timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY ip_address 
                ORDER BY count DESC 
                LIMIT 10
            ");
            $stats['top_ips'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'status' => 'success',
                'stats' => $stats
            ]);
            break;
            
        case 'active_sessions':
            // Get currently active sessions (logged in within last hour)
            $stmt = $pdo->query("
                SELECT DISTINCT
                    username,
                    employee_id,
                    ip_address,
                    MAX(log_timestamp) as last_activity
                FROM audit_log 
                WHERE action_type LIKE '%login%'
                AND log_timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
                GROUP BY username, ip_address
                ORDER BY last_activity DESC
            ");
            
            $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'status' => 'success',
                'active_sessions' => $sessions,
                'count' => count($sessions)
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
