<?php
// ========================================
// AZURE SQL DATABASE HANDLER
// ========================================

class Database {
    private $connection;
    
    public function __construct($config) {
        try {
            $dsn = "sqlsrv:Server={$config['host']},{$config['port']};Database={$config['database']}";
            $this->connection = new PDO($dsn, $config['username'], $config['password']);
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->initializeTables();
        } catch (PDOException $e) {
            // Fallback to local SQLite for development
            $this->connection = new PDO('sqlite:../data/budget.db');
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->initializeTables();
        }
    }
    
    private function initializeTables() {
        // Users table
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        // Transactions table
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                description VARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                category VARCHAR(50) NOT NULL,
                type VARCHAR(10) NOT NULL,
                transaction_date DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ");
    }
    
    public function registerUser($username, $password) {
        // Check if user exists
        $stmt = $this->connection->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        
        if ($stmt->fetch()) {
            return ['error' => 'Username already exists'];
        }
        
        // Hash password
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert user
        $stmt = $this->connection->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
        
        if ($stmt->execute([$username, $passwordHash])) {
            return ['success' => true, 'message' => 'Registration successful'];
        } else {
            return ['error' => 'Registration failed'];
        }
    }
    
    public function loginUser($username, $password) {
        $stmt = $this->connection->prepare("SELECT id, password_hash FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            return ['success' => true, 'user_id' => $user['id']];
        } else {
            return ['error' => 'Invalid username or password'];
        }
    }
    
    public function saveTransaction($userId, $transaction) {
        $stmt = $this->connection->prepare("
            INSERT INTO transactions (user_id, description, amount, category, type, transaction_date)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        return $stmt->execute([
            $userId,
            $transaction['description'],
            $transaction['amount'],
            $transaction['category'],
            $transaction['type'],
            $transaction['date']
        ]);
    }
    
    public function getTransactions($userId) {
        $stmt = $this->connection->prepare("
            SELECT description, amount, category, type, transaction_date as date
            FROM transactions
            WHERE user_id = ?
            ORDER BY transaction_date DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>