// ========================================
// MAIN APPLICATION LOGIC
// Handles UI updates, charts, and event handling
// ========================================

const App = (function() {
    // Private variables
    let currentFilter = 'all';
    let categoryChart = null;
    let transactions = [];
    
    // DOM Elements
    const elements = {
        balanceDisplay: document.getElementById('balanceDisplay'),
        totalIncome: document.getElementById('totalIncome'),
        totalExpense: document.getElementById('totalExpense'),
        savingsRate: document.getElementById('savingsRate'),
        transactionList: document.getElementById('transactionList'),
        smartAdvice: document.getElementById('smartAdvice'),
        tipText: document.getElementById('tipText'),
        categoryChart: document.getElementById('categoryChart'),
        txForm: document.getElementById('txForm'),
        resetBtn: document.getElementById('resetDemoBtn')
    };
    // Currency configuration
let currentCurrency = 'ZAR'; // Default to South African Rand
const currencySymbols = {
    ZAR: { symbol: 'R', locale: 'en-ZA', name: 'South African Rand' },
    USD: { symbol: '$', locale: 'en-US', name: 'US Dollar' },
    EUR: { symbol: '€', locale: 'de-DE', name: 'Euro' },
    GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound' }
};

// Update formatCurrency function to use dynamic currency
function formatCurrency(amount) {
    const currency = currencySymbols[currentCurrency];
    try {
        return new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currentCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch(e) {
        // Fallback formatting
        return `${currency.symbol}${amount.toFixed(2)}`;
    }
}

// Function to change currency
function changeCurrency(currencyCode) {
    if (currencySymbols[currencyCode]) {
        currentCurrency = currencyCode;
        refreshData(); // Refresh all displays with new currency
        localStorage.setItem('preferredCurrency', currencyCode);
        
        // Show notification
        showNotification(`Currency changed to ${currencySymbols[currencyCode].name} (${currencySymbols[currencyCode].symbol})`);
    }
}

// Simple notification function
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }, 100);
}
function init() {
    // Load saved currency preference
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency && currencySymbols[savedCurrency]) {
        currentCurrency = savedCurrency;
        document.getElementById('currencySelect').value = savedCurrency;
    }
    
    transactions = Storage.loadData();
    setupEventListeners();
    refreshData();
    
    console.log('SmartBudget Tracker initialized - Ready for Azure deployment');
}
// Currency selector listener
const currencySelect = document.getElementById('currencySelect');
if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
        changeCurrency(e.target.value);
    });
}
// South African payday checker (typically 25th or last weekday)
function checkPayday() {
    const today = new Date();
    const day = today.getDate();
    const isPayday = (day === 25) || (day === new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate());
    
    if (isPayday) {
        showNotification("🎉 It's payday! Consider allocating funds to savings first!");
    }
}

// Call this in init()
checkPayday();
// Basic SA tax brackets for 2024 (simplified)
function checkTaxImplications(annualIncome) {
    if (annualIncome > 237100) {
        return "⚠️ You may need to register for provisional tax";
    }
    return "✅ Your tax situation looks standard";
}
    
    
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2
    }).format(amount);
}
    
    // Helper: Escape HTML for security
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Calculate financial summaries
    function calculateSummaries() {
        let totalIncome = 0;
        let totalExpense = 0;
        
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else {
                totalExpense += transaction.amount;
            }
        });
        
        const balance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
        
        return {
            totalIncome,
            totalExpense,
            balance,
            savingsRate
        };
    }
    
    // Update stats display
    function updateStats() {
        const summaries = calculateSummaries();
        elements.balanceDisplay.textContent = formatCurrency(summaries.balance);
        elements.totalIncome.textContent = formatCurrency(summaries.totalIncome);
        elements.totalExpense.textContent = formatCurrency(summaries.totalExpense);
        elements.savingsRate.textContent = `${Math.round(summaries.savingsRate)}%`;
        
        // Update savings rate color
        if (summaries.savingsRate >= 20) {
            elements.savingsRate.style.color = '#27ae60';
        } else if (summaries.savingsRate >= 10) {
            elements.savingsRate.style.color = '#f39c12';
        } else {
            elements.savingsRate.style.color = '#e74c3c';
        }
    }
    
    // Render transaction list
    function renderTransactionList() {
        let filteredTransactions = transactions;
        
        if (currentFilter === 'income') {
            filteredTransactions = transactions.filter(t => t.type === 'income');
        } else if (currentFilter === 'expense') {
            filteredTransactions = transactions.filter(t => t.type === 'expense');
        }
        
        if (filteredTransactions.length === 0) {
            elements.transactionList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No transactions found</p>
                </div>
            `;
            return;
        }
        
        const html = filteredTransactions.map(transaction => `
            <div class="transaction-item" data-id="${transaction.id}">
                <div class="transaction-info">
                    <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                    <div class="transaction-category">
                        <i class="fas fa-tag"></i> ${escapeHtml(transaction.category)}
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type === 'income' ? 'income-amount' : 'expense-amount'}">
                    ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                </div>
                <button class="delete-btn" data-id="${transaction.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        elements.transactionList.innerHTML = html;
        
        // Attach delete events
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                deleteTransaction(id);
            });
        });
    }
    
    // Update category chart
    function updateChart() {
        const expenseByCategory = {};
        
        transactions
            .filter(t => t.type === 'expense')
            .forEach(transaction => {
                const category = transaction.category;
                if (!expenseByCategory[category]) {
                    expenseByCategory[category] = 0;
                }
                expenseByCategory[category] += transaction.amount;
            });
        
        const categories = Object.keys(expenseByCategory);
        const amounts = Object.values(expenseByCategory);
        
        const ctx = elements.categoryChart.getContext('2d');
        
        if (categoryChart) {
            categoryChart.destroy();
        }
        
        if (categories.length === 0) {
            // Show empty chart
            categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No Data'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#e0e0e0']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } else {
            const colors = [
                '#3498db', '#e74c3c', '#f39c12', '#27ae60',
                '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
            ];
            
            categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categories,
                    datasets: [{
                        data: amounts,
                        backgroundColor: colors.slice(0, categories.length),
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Generate AI insights
    function generateInsights() {
        const summaries = calculateSummaries();
        const { totalIncome, totalExpense, balance, savingsRate } = summaries;
        
        let insights = [];
        let tip = "";
        
        if (transactions.length === 0) {
            insights.push("🎯 Start by adding your first transaction to get personalized insights!");
            tip = "Add income and expenses to track your financial health";
        } else {
            // Balance insights
            if (balance < 0) {
                insights.push("⚠️ You're spending more than you earn! Consider reviewing your expenses.");
                tip = "Try to reduce non-essential spending this month";
            } else if (balance < 500) {
                insights.push("📊 Your balance is healthy but could be improved. Look for small savings opportunities.");
                tip = "Even saving $50/month adds up to $600/year!";
            } else {
                insights.push("🎉 Excellent job! You're maintaining a strong positive balance.");
                tip = "Consider investing your surplus for long-term growth";
            }
            
            // Savings rate insights
            if (savingsRate < 10) {
                insights.push("💡 Your savings rate is below 10%. Try following the 50/30/20 rule.");
            } else if (savingsRate > 30) {
                insights.push("🏆 Amazing savings discipline! You're building wealth effectively.");
            }
            
            // Category insights
            const expenses = transactions.filter(t => t.type === 'expense');
            if (expenses.length > 0) {
                const categoryTotals = {};
                expenses.forEach(exp => {
                    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
                });
                
                const topCategory = Object.entries(categoryTotals)
                    .sort((a, b) => b[1] - a[1])[0];
                
                if (topCategory) {
                    insights.push(`🔍 Your highest spending category is ${topCategory[0]} (${formatCurrency(topCategory[1])}). Consider setting a budget for it.`);
                }
            }
            
            // Spending trend insight
            if (expenses.length > 5) {
                const avgExpense = totalExpense / expenses.length;
                insights.push(`📈 Average transaction: ${formatCurrency(avgExpense)}. Review large purchases regularly.`);
            }
        }
        
        // Update UI
        elements.smartAdvice.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${insights.map(insight => `<div><i class="fas fa-chart-line"></i> ${insight}</div>`).join('')}
            </div>
        `;
        
        elements.tipText.textContent = tip;
    }
    
    // Delete transaction
    function deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            Storage.deleteTransaction(id);
            refreshData();
        }
    }
    
    // Add transaction
    function addTransaction(transactionData) {
        if (!transactionData.description.trim()) {
            alert('Please enter a description');
            return false;
        }
        
        if (transactionData.amount <= 0 || isNaN(transactionData.amount)) {
            alert('Please enter a valid amount greater than 0');
            return false;
        }
        
        Storage.addTransaction(transactionData);
        refreshData();
        return true;
    }
    
    // Reset all data
    function resetAllData() {
        if (confirm('⚠️ WARNING: This will delete ALL your data. This action cannot be undone. Continue?')) {
            Storage.clearAllData();
            refreshData();
        }
    }
    
    // Refresh all UI components
    function refreshData() {
        transactions = Storage.getTransactions();
        updateStats();
        renderTransactionList();
        updateChart();
        generateInsights();
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Form submission
        elements.txForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const description = document.getElementById('desc').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const type = document.getElementById('type').value;
            const category = document.getElementById('category').value;
            
            addTransaction({
                description,
                amount,
                type,
                category
            });
            
            elements.txForm.reset();
            document.getElementById('desc').focus();
        });
        
        // Reset button
        elements.resetBtn.addEventListener('click', resetAllData);
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTransactionList();
            });
        });
    }
    
    // Initialize app
    function init() {
        transactions = Storage.loadData();
        setupEventListeners();
        refreshData();
        
        // Auto-save indicator (optional)
        console.log('SmartBudget Tracker initialized - Ready for Azure deployment');
    }
    
    // Public API
    return {
        init,
        refreshData
    };
})();

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});