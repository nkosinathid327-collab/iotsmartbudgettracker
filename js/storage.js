// ========================================
// STORAGE MODULE - Data Management & Security
// Handles localStorage operations with encryption simulation
// ========================================

const Storage = (function() {
    // Private variables
    const STORAGE_KEY = 'smartBudgetTracker';
    let transactions = [];
    
    // Simple encryption simulation (in production, use proper encryption)
    function simpleEncrypt(data) {
        // In a real app, implement proper encryption
        // For demo, we'll just encode
        return btoa(JSON.stringify(data));
    }
    
    function simpleDecrypt(encryptedData) {
        try {
            return JSON.parse(atob(encryptedData));
        } catch(e) {
            return null;
        }
    }
    
    // Load data from localStorage
    function loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const decrypted = simpleDecrypt(stored);
                if (decrypted && Array.isArray(decrypted)) {
                    transactions = decrypted;
                } else {
                    transactions = [];
                }
            } catch(e) {
                console.error('Error loading data:', e);
                transactions = [];
            }
        } else {
            // Initialize with sample data
            transactions = getSampleData();
        }
        return transactions;
    }
    
    // Sample data for demonstration
    function getSampleData() {
    const now = new Date();
    return [
        {
            id: Date.now() + 1,
            description: "Monthly Salary",
            amount: 25000,  
            category: "Salary",
            type: "income",
            date: now.toISOString()
        },
        {
            id: Date.now() + 2,
            description: "Grocery Shopping",
            amount: 850.75, 
            category: "Food",
            type: "expense",
            date: now.toISOString()
        },
        {
            id: Date.now() + 3,
            description: "Netflix Subscription",
            amount: 159.99, 
            category: "Entertainment",
            type: "expense",
            date: now.toISOString()
        },
        {
            id: Date.now() + 4,
            description: "Uber Ride",
            amount: 125.50, 
            category: "Transport",
            type: "expense",
            date: now.toISOString()
        }
    ];
}
    
    // Save data to localStorage
    function saveData() {
        const encrypted = simpleEncrypt(transactions);
        localStorage.setItem(STORAGE_KEY, encrypted);
    }
    
    // Get all transactions
    function getTransactions() {
        return [...transactions];
    }
    
    // Add new transaction
    function addTransaction(transaction) {
        const newTransaction = {
            id: Date.now(),
            ...transaction,
            date: new Date().toISOString()
        };
        transactions.unshift(newTransaction);
        saveData();
        return newTransaction;
    }
    
    // Delete transaction
    function deleteTransaction(id) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        return true;
    }
    
    // Update transaction
    function updateTransaction(id, updatedData) {
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updatedData };
            saveData();
            return true;
        }
        return false;
    }
    
    // Clear all data
    function clearAllData() {
        transactions = [];
        saveData();
    }
    
    // Reset to sample data
    function resetToSample() {
        transactions = getSampleData();
        saveData();
    }
    
    // Export for Azure SQL integration (future use)
    async function syncWithCloud() {
        // Placeholder for Azure SQL sync
        console.log('Ready for Azure SQL integration');
        // In production, implement fetch to PHP API
        /*
        try {
            const response = await fetch('php/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'sync', data: transactions })
            });
            return await response.json();
        } catch(e) {
            console.error('Sync failed:', e);
        }
        */
    }
    
    // Public API
    return {
        loadData,
        saveData,
        getTransactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        clearAllData,
        resetToSample,
        syncWithCloud
    };
})();