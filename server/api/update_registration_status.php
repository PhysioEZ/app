<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../common/db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['registration_id']) || !isset($data['status'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing parameters"]);
    exit;
}

$registrationId = (int)$data['registration_id'];
$status = $data['status'];
$validStatuses = ['Pending', 'Consulted', 'Cancelled', 'Closed']; 

// Use 'Closed' if 'Consulted' maps to it, but user asked for 'Consulted'.
// I will store 'Consulted' if the DB ENUM/varchar allows it. 
// Assuming varchar(50) or similar.

try {
    $stmt = $pdo->prepare("UPDATE registration SET status = ? WHERE registration_id = ?");
    $stmt->execute([$status, $registrationId]);

    echo json_encode(["status" => "success", "message" => "Status updated successfully"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
