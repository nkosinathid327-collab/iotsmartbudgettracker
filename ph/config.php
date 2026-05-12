<?php
// ========================================
// DATABASE CONFIGURATION FOR AZURE SQL
// ========================================

// Azure SQL Database configuration
$config = [
    'host' => getenv('AZURE_SQL_HOST') ?: 'your-server.database.windows.net',
    'username' => getenv('AZURE_SQL_USER') ?: 'your-username',
    'password' => getenv('AZURE_SQL_PASSWORD') ?: 'your-password',
    'database' => getenv('AZURE_SQL_DB') ?: 'budget_tracker',
    'port' => 1433
];

// Session security
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 1);

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS headers for API
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Rate limiting (simple implementation)
session_start();
if (!isset($_SESSION['api_requests'])) {
    $_SESSION['api_requests'] = 0;
    $_SESSION['api_last_reset'] = time();
}

if (time() - $_SESSION['api_last_reset'] > 60) {
    $_SESSION['api_requests'] = 0;
    $_SESSION['api_last_reset'] = time();
}

$_SESSION['api_requests']++;
if ($_SESSION['api_requests'] > 100) {
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit exceeded']);
    exit();
}
?>