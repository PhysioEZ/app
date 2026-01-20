<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../../common/db.php';

$action = $_GET['action'] ?? '';
$userId = $_GET['user_id'] ?? 0;

if ($action === 'retention_radar') {
    try {
        // Find accessible branches
        $stmtUser = $pdo->prepare("SELECT r.role_name FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.employee_id = ?");
        $stmtUser->execute([$userId]);
        $userRole = $stmtUser->fetchColumn();

        if ($userRole === 'superadmin') {
            $stmtB = $pdo->query("SELECT branch_id FROM branches");
            $branches = $stmtB->fetchAll(PDO::FETCH_COLUMN);
        } else {
            $stmtB = $pdo->prepare("SELECT branch_id FROM branches WHERE admin_employee_id = ? OR created_by = ?");
            $stmtB->execute([$userId, $userId]);
            $branches = $stmtB->fetchAll(PDO::FETCH_COLUMN);
        }

        if (empty($branches)) {
            echo json_encode(['status' => 'success', 'data' => []]);
            exit;
        }

        $placeholders = implode(',', array_fill(0, count($branches), '?'));

        // Query to find "At Risk" patients:
        // 1. Status is NOT in the active/completed lists (meaning they are effectively 'inactive')
        // 2. They have remaining days in their package OR they are pay-per-session with dues/history
        $sql = "
            SELECT 
                p.patient_id, 
                r.patient_name, 
                r.phone_number, 
                b.branch_name,
                p.treatment_type,
                p.treatment_days,
                p.status as current_status,
                (SELECT COUNT(*) FROM attendance a WHERE a.patient_id = p.patient_id AND a.status = 'present') as attended_days,
                (SELECT MAX(attendance_date) FROM attendance a WHERE a.patient_id = p.patient_id AND a.status = 'present') as last_visit_date
            FROM patients p
            JOIN registration r ON p.registration_id = r.registration_id
            JOIN branches b ON p.branch_id = b.branch_id
            WHERE p.branch_id IN ($placeholders)
            AND p.status NOT IN ('ongoing', 'active', 'p', 'partially_paid', 'discharged', 'completed', 'f', 'fully_paid')
            AND (
                (p.treatment_type = 'package' AND (SELECT COUNT(*) FROM attendance a WHERE a.patient_id = p.patient_id AND a.status = 'present') < COALESCE(p.treatment_days, 0))
                OR (p.treatment_type != 'package' AND p.status != 'completed')
            )
            HAVING last_visit_date IS NOT NULL
            ORDER BY last_visit_date DESC
            LIMIT 50
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($branches);
        $riskPatients = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate risk levels based on days since last visit
        foreach ($riskPatients as &$p) {
            $lastVisit = new DateTime($p['last_visit_date']);
            $today = new DateTime();
            $diff = $today->diff($lastVisit)->days;
            
            $p['days_absent'] = $diff;
            if ($diff > 14) {
                $p['risk_level'] = 'Critical';
                $p['risk_score'] = 3;
            } elseif ($diff > 7) {
                $p['risk_level'] = 'High';
                $p['risk_score'] = 2;
            } else {
                $p['risk_level'] = 'Medium'; // Likely just past the 3-day window
                $p['risk_score'] = 1;
            }
        }

        echo json_encode([
            'status' => 'success',
            'data' => $riskPatients
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} elseif ($action === 'referral_drift') {
    try {
        $sql = "
            SELECT 
                p.partner_id,
                p.name,
                p.phone,
                GREATEST(
                    COALESCE((SELECT MAX(created_at) FROM registration WHERE referral_partner_id = p.partner_id), '2000-01-01'),
                    COALESCE((SELECT MAX(created_at) FROM tests WHERE referral_partner_id = p.partner_id), '2000-01-01')
                ) as last_referral_date,
                (
                    (SELECT COUNT(*) FROM registration WHERE referral_partner_id = p.partner_id) +
                    (SELECT COUNT(*) FROM tests WHERE referral_partner_id = p.partner_id)
                ) as total_referrals
            FROM referral_partners p
            WHERE p.status = 'active'
            HAVING last_referral_date != '2000-01-01'
            AND DATEDIFF(CURRENT_DATE, last_referral_date) >= 10
            ORDER BY last_referral_date DESC
            LIMIT 50
        ";

        $stmt = $pdo->query($sql);
        $driftPartners = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($driftPartners as &$p) {
            $lastRef = new DateTime($p['last_referral_date']);
            $today = new DateTime();
            $diff = $today->diff($lastRef)->days;
            $p['days_since_referral'] = $diff;
            
            if ($diff > 30) {
                $p['drift_level'] = 'Critical';
            } elseif ($diff > 20) {
                $p['drift_level'] = 'High';
            } else {
                $p['drift_level'] = 'Cold';
            }
        }

        echo json_encode([
            'status' => 'success',
            'data' => $driftPartners
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
