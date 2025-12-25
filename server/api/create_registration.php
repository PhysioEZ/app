<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// DB Connection
$dbPath = __DIR__ . '/../../common/db.php';
if (file_exists($dbPath)) {
    require_once $dbPath;
} else {
    $dbPathUp = __DIR__ . '/../../../common/db.php';
    if (file_exists($dbPathUp)) {
        require_once $dbPathUp;
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database configuration not found."]);
        exit;
    }
}

$data = json_decode(file_get_contents("php://input"), true);
$pdo->beginTransaction();

try {
    // 1. Sanitization & Inputs
    $branch_id         = isset($data['branch_id']) ? (int)$data['branch_id'] : 1;
    $employee_id       = isset($data['employee_id']) ? (int)$data['employee_id'] : 1;
    $patient_name      = trim($data['patient_name'] ?? '');
    $phone             = trim($data['phone'] ?? '');
    $email             = trim($data['email'] ?? '');
    $gender            = $data['gender'] ?? '';
    $age               = trim($data['age'] ?? '');
    $chief_complaint   = trim($data['chief_complaint'] ?? '');
    $referralSource    = $data['referralSource'] ?? 'self';
    $referred_by       = trim($data['referred_by'] ?? '');
    $occupation        = trim($data['occupation'] ?? '');
    $address           = trim($data['address'] ?? '');
    $consultation_type = $data['consultation_type'] ?? 'in-clinic';
    $consultation_amt  = (float)($data['consultation_amount'] ?? 0);
    $payment_method    = $data['payment_method'] ?? 'cash';
    $remarks           = trim($data['remarks'] ?? '');
    $appointment_date  = $data['appointment_date'] ?? date('Y-m-d');
    
    if (empty($patient_name) || empty($phone) || empty($gender) || empty($age)) {
        throw new Exception("Please fill in all required fields: Name, Phone, Gender, and Age.");
    }

    // 2. Generate Patient UID
    $today = date('Y-m-d');
    // Ensure counter table exists or handle error silently? Assuming it exists as per reception logic.
    $pdo->exec("
        INSERT INTO daily_patient_counter (entry_date, counter) VALUES ('$today', 1)
        ON DUPLICATE KEY UPDATE counter = counter + 1
    ");
    $stmtCounter = $pdo->prepare("SELECT counter FROM daily_patient_counter WHERE entry_date = ?");
    $stmtCounter->execute([$today]);
    $serialNumber = $stmtCounter->fetchColumn();
    $patientUID = date('ymd') . $serialNumber;

    // 3. Create or Get Master Patient
    $stmtCheck = $pdo->prepare("SELECT master_patient_id FROM patient_master WHERE phone_number = ? LIMIT 1");
    $stmtCheck->execute([$phone]);
    $masterPatientId = $stmtCheck->fetchColumn();

    if (!$masterPatientId) {
        $stmtMaster = $pdo->prepare(
            "INSERT INTO patient_master (patient_uid, full_name, phone_number, gender, age, first_registered_branch_id)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmtMaster->execute([
            $patientUID, $patient_name, $phone, $gender, $age, $branch_id
        ]);
        $masterPatientId = $pdo->lastInsertId();
    }

    // 4. Create Registration
    $stmtReg = $pdo->prepare("
        INSERT INTO registration 
        (master_patient_id, branch_id, created_by_employee_id, patient_name, phone_number, email, gender, age, chief_complain, referralSource, reffered_by, occupation, address, consultation_type, appointment_date, appointment_time, consultation_amount, payment_method, remarks, status)
        VALUES
        (:master_patient_id, :branch_id, :created_by_employee_id, :patient_name, :phone, :email, :gender, :age, :chief_complain, :referralSource, :referred_by, :occupation, :address, :consultation_type, :appointment_date, :appointment_time, :consultation_amount, :payment_method, :remarks, 'Pending')
    ");
    
    $appointment_time = $data['appointment_time'] ?? date('H:i:s');

    $stmtReg->execute([
        ':master_patient_id'   => $masterPatientId,
        ':branch_id'           => $branch_id,
        ':created_by_employee_id' => $employee_id,
        ':patient_name'        => $patient_name,
        ':phone'               => $phone,
        ':email'               => $email,
        ':gender'              => $gender,
        ':age'                 => $age,
        ':chief_complain'      => $chief_complain,
        ':referralSource'      => $referralSource,
        ':referred_by'         => $referred_by,
        ':occupation'          => $occupation,
        ':address'             => $address,
        ':consultation_type'   => $consultation_type,
        ':appointment_date'    => $appointment_date,
        ':appointment_time'    => $appointment_time,
        ':consultation_amount' => $consultation_amt,
        ':payment_method'      => $payment_method,
        ':remarks'             => $remarks
    ]);
    $newRegistrationId = $pdo->lastInsertId();

    // 5. Photo Upload (Base64)
    if (!empty($data['patient_photo_data'])) {
        $imageData = $data['patient_photo_data'];
        if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
            $imageData = substr($imageData, strpos($imageData, ',') + 1);
            $type = strtolower($type[1]);
            if (in_array($type, [ 'jpg', 'jpeg', 'gif', 'png' ])) {
                $imageData = base64_decode($imageData);
                if ($imageData !== false) {
                    // Upload directory relative to this script
                    // app/server/api -> ../../../uploads/patient_photos/ ??
                    // reception/api/registration_submission.php used ../../uploads/patient_photos/ (relative to reception/api)
                    // If uploading to /srv/http/admin/uploads/patient_photos/
                    // From /srv/http/admin/app/server/api/ -> ../../../uploads/patient_photos/
                    $uploadDir = __DIR__ . '/../../../uploads/patient_photos/';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }
                    $fileName = "reg_{$newRegistrationId}_" . time() . ".{$type}";
                    if (file_put_contents($uploadDir . $fileName, $imageData)) {
                        $relativePath = 'uploads/patient_photos/' . $fileName; // Store relative to admin root
                        $stmtPhoto = $pdo->prepare("UPDATE registration SET patient_photo_path = ? WHERE registration_id = ?");
                        $stmtPhoto->execute([$relativePath, $newRegistrationId]);
                    }
                }
            }
        }
    }

    $pdo->commit();
    echo json_encode([
        "status" => "success",
        "message" => "Registration created successfully",
        "data" => [
            "registration_id" => $newRegistrationId,
            "patient_uid" => $patientUID
        ]
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
