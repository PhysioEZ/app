<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../common/db.php';

$branchId = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : 1;
$response = [
    "status" => "success",
    "data" => [
        "referrers" => [],
        "paymentMethods" => [],
        "chiefComplaints" => [],
        "referralSources" => [],
        "consultationTypes" => [],
        // Extras
        "testTypes" => [],
        "limbTypes" => [],
        "staffMembers" => []
    ]
];

try {
    // 1. Referrers (Distinct names from multiple tables)
    $stmtReferrers = $pdo->query("
        (SELECT DISTINCT reffered_by FROM registration WHERE branch_id = {$branchId} AND reffered_by IS NOT NULL AND reffered_by != '')
        UNION
        (SELECT DISTINCT reffered_by FROM test_inquiry WHERE branch_id = {$branchId} AND reffered_by IS NOT NULL AND reffered_by != '')
        UNION
        (SELECT DISTINCT referred_by FROM tests WHERE branch_id = {$branchId} AND referred_by IS NOT NULL AND referred_by != '')
        ORDER BY reffered_by ASC
    ");
    $response['data']['referrers'] = $stmtReferrers->fetchAll(PDO::FETCH_COLUMN);

    // 2. Payment Methods
    $stmtPM = $pdo->prepare("SELECT method_code, method_name FROM payment_methods WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmtPM->execute([$branchId]);
    $response['data']['paymentMethods'] = $stmtPM->fetchAll(PDO::FETCH_ASSOC);

    // 3. Chief Complaints
    $stmtCC = $pdo->prepare("SELECT complaint_code, complaint_name FROM chief_complaints WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmtCC->execute([$branchId]);
    $response['data']['chiefComplaints'] = $stmtCC->fetchAll(PDO::FETCH_ASSOC);

    // 4. Referral Sources
    $stmtRS = $pdo->prepare("SELECT source_code, source_name FROM referral_sources WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmtRS->execute([$branchId]);
    $response['data']['referralSources'] = $stmtRS->fetchAll(PDO::FETCH_ASSOC);

    // 5. Consultation Types
    $stmtCT = $pdo->prepare("SELECT consultation_code, consultation_name FROM consultation_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmtCT->execute([$branchId]);
    $response['data']['consultationTypes'] = $stmtCT->fetchAll(PDO::FETCH_ASSOC);

    // 6. Test Types
    $stmtTT = $pdo->prepare("SELECT test_code, test_name, default_cost, requires_limb_selection FROM test_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmtTT->execute([$branchId]);
    $response['data']['testTypes'] = $stmtTT->fetchAll(PDO::FETCH_ASSOC);

    // 7. Limb Types
    $stmtLT = $pdo->prepare("SELECT limb_code, limb_name FROM limb_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmtLT->execute([$branchId]);
    $response['data']['limbTypes'] = $stmtLT->fetchAll(PDO::FETCH_ASSOC);
    
    // 8. Staff Members
    $stmtStaff = $pdo->prepare("SELECT staff_id, staff_name, job_title FROM test_staff WHERE branch_id = ? AND is_active = 1 ORDER BY display_order, staff_name");
    $stmtStaff->execute([$branchId]);
    $response['data']['staffMembers'] = $stmtStaff->fetchAll(PDO::FETCH_ASSOC);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    exit;
}

echo json_encode($response);
