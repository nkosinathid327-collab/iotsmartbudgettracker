<?php
// ========================================
// REST API FOR AZURE SQL INTEGRATION
// ========================================

$configReturn = require_once 'config.php';
require_once 'db.php';

if (!isset($config)) {
    $config = is_array($configReturn) ? $configReturn : [];
}

// Only accept POST requests for security
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get request body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['action'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit();
}

$action = $input['action'];
$database = new Database($config);
$response = [];

try {
    switch ($action) {
        case 'sync':
            // Sync local data to cloud
            if (isset($input['data']) && isset($_SESSION['user_id'])) {
                $userId = $_SESSION['user_id'];
                $transactions = $input['data'];
                
                foreach ($transactions as $transaction) {
                    $database->saveTransaction($userId, $transaction);
                }
                
                $response = ['success' => true, 'message' => 'Data synced successfully'];
            } else {
                $response = ['error' => 'Authentication required'];
            }
            break;
            
        case 'fetch':
            // Fetch data from cloud
            if (isset($_SESSION['user_id'])) {
                $userId = $_SESSION['user_id'];
                $transactions = $database->getTransactions($userId);
                $response = ['success' => true, 'data' => $transactions];
            } else {
                $response = ['error' => 'Authentication required'];
            }
            break;
            
        case 'register':
            // User registration
            if (isset($input['username']) && isset($input['password'])) {
                $result = $database->registerUser($input['username'], $input['password']);
                $response = $result;
            } else {
                $response = ['error' => 'Username and password required'];
            }
            break;
            
        case 'login':
            // User login
            if (isset($input['username']) && isset($input['password'])) {
                $result = $database->loginUser($input['username'], $input['password']);
                if ($result['success']) {
                    $_SESSION['user_id'] = $result['user_id'];
                    $_SESSION['username'] = $input['username'];
                }
                $response = $result;
            } else {
                $response = ['error' => 'Username and password required'];
            }
            break;
            
        case 'logout':
            session_destroy();
            $response = ['success' => true, 'message' => 'Logged out'];
            break;
            
        default:
            $response = ['error' => 'Invalid action'];
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = ['error' => 'Server error: ' . $e->getMessage()];
}

echo json_encode($response);
?>