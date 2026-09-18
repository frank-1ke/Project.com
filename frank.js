
// ==================== DATA MANAGEMENT ====================
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = null;

// Account Number Generator
function generateAccountNumber() {
    return 'ACC' + Date.now() + Math.floor(Math.random() * 1000);
}

// ==================== SCREEN NAVIGATION ====================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showWelcomeScreen() {
    showScreen('welcomeScreen');
    clearErrors();
}

function showLoginScreen() {
    showScreen('loginScreen');
    clearErrors();
}

function showSignUpScreen() {
    showScreen('signUpScreen');
    clearErrors();
}

function showDashboard() {
    showScreen('dashboardScreen');
    updateDashboard();
}

function showDepositScreen() {
    showScreen('depositScreen');
    clearErrors();
    document.getElementById('depositAmount').value = '';
}

function showWithdrawScreen() {
    showScreen('withdrawScreen');
    clearErrors();
    document.getElementById('withdrawAmount').value = '';
}

function showTransferScreen() {
    showScreen('transferScreen');
    clearErrors();
    document.getElementById('transferUsername').value = '';
    document.getElementById('transferAmount').value = '';
}

// ==================== AUTHENTICATION ====================
function signup() {
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const initialBalance = parseFloat(document.getElementById('signupInitialBalance').value) || 0;

    const errorElement = document.getElementById('signupError');

    // Validation
    if (!name || !username || !password) {
        showError(errorElement, 'All fields are required');
        return;
    }

    if (username.length < 3) {
        showError(errorElement, 'Username must be at least 3 characters');
        return;
    }

    if (password.length < 4) {
        showError(errorElement, 'Password must be at least 4 characters');
        return;
    }

    if (initialBalance < 0) {
        showError(errorElement, 'Balance cannot be negative');
        return;
    }

    if (users.find(user => user.username === username)) {
        showError(errorElement, 'Username already exists');
        return;
    }

    // Create user
    const newUser = {
        id: Date.now(),
        name: name,
        username: username,
        password: password,
        balance: initialBalance,
        accountNumber: generateAccountNumber(),
        transactions: []
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    showError(errorElement, '', false);
    alert('Account created successfully! Please login.');
    showLoginScreen();
}

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorElement = document.getElementById('loginError');

    // Validation
    if (!username || !password) {
        showError(errorElement, 'Username and password are required');
        return;
    }

    // Find user
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        showError(errorElement, 'Invalid username or password');
        return;
    }

    // Login successful
    currentUser = user;
    showError(errorElement, '', false);
    showDashboard();
}

function logout() {
    currentUser = null;
    showWelcomeScreen();
    clearInputs();
}

// ==================== TRANSACTIONS ====================
function processDeposit() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const errorElement = document.getElementById('depositError');

    if (!amount || amount <= 0) {
        showError(errorElement, 'Please enter a valid amount');
        return;
    }

    currentUser.balance += amount;
    addTransaction('Deposit', amount, 'deposit');
    updateUserData();
    showError(errorElement, '', false);
    alert(`Successfully deposited $${amount}`);
    showDashboard();
}

function processWithdraw() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const errorElement = document.getElementById('withdrawError');

    if (!amount || amount <= 0) {
        showError(errorElement, 'Please enter a valid amount');
        return;
    }

    if (amount > currentUser.balance) {
        showError(errorElement, 'Insufficient funds');
        return;
    }

    currentUser.balance -= amount;
    addTransaction('Withdrawal', amount, 'withdraw');
    updateUserData();
    showError(errorElement, '', false);
    alert(`Successfully withdrawn $${amount}`);
    showDashboard();
}

function processTransfer() {
    const recipientUsername = document.getElementById('transferUsername').value.trim();
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const errorElement = document.getElementById('transferError');

    if (!recipientUsername || !amount || amount <= 0) {
        showError(errorElement, 'Please fill all fields correctly');
        return;
    }

    if (recipientUsername === currentUser.username) {
        showError(errorElement, 'Cannot transfer to yourself');
        return;
    }

    const recipient = users.find(u => u.username === recipientUsername);

    if (!recipient) {
        showError(errorElement, 'Recipient not found');
        return;
    }

    if (amount > currentUser.balance) {
        showError(errorElement, 'Insufficient funds');
        return;
    }

    // Process transfer
    currentUser.balance -= amount;
    recipient.balance += amount;

    addTransaction(`Transfer to ${recipientUsername}`, amount, 'transfer');
    recipient.transactions.push({
        type: 'Transfer',
        description: `Transfer from ${currentUser.username}`,
        amount: amount,
        date: new Date().toLocaleString()
    });

    updateUserData();
    showError(errorElement, '', false);
    alert(`Successfully transferred $${amount} to ${recipientUsername}`);
    showDashboard();
}

function addTransaction(type, amount, category) {
    currentUser.transactions.unshift({
        type: type,
        description: type,
        amount: amount,
        date: new Date().toLocaleString(),
        category: category
    });
}

// ==================== UI UPDATES ====================
function updateDashboard() {
    if (!currentUser) return;

    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('accountNumber').textContent = currentUser.accountNumber;
    document.getElementById('balance').textContent = currentUser.balance.toFixed(2);

    updateTransactionHistory();
}

function updateTransactionHistory() {
    const transactionList = document.getElementById('transactionList');

    if (currentUser.transactions.length === 0) {
        transactionList.innerHTML = '<p class="no-transactions">No transactions yet</p>';
        return;
    }

    transactionList.innerHTML = currentUser.transactions.map(transaction => `
        <div class="transaction-item ${transaction.category}">
            <span class="type">${transaction.description}</span>
            <span class="amount">
                ${transaction.category === 'deposit' ? '+' : '-'}$${transaction.amount.toFixed(2)}
            </span>
            <span class="date">${transaction.date}</span>
        </div>
    `).join('');
}

// ==================== UTILITY FUNCTIONS ====================
function updateUserData() {
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    users[userIndex] = currentUser;
    localStorage.setItem('users', JSON.stringify(users));
}

function showError(element, message, show = true) {
    element.textContent = message;
    if (show) {
        element.classList.add('show');
    } else {
        element.classList.remove('show');
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
    });
}

function clearInputs() {
    document.querySelectorAll('.input-field').forEach(input => {
        input.value = '';
    });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Add demo account for testing
    if (users.length === 0) {
        users.push({
            id: 1,
            name: 'John Doe',
            username: 'john',
            password: '1234',
            balance: 5000,
            accountNumber: 'ACC123456789',
            transactions: [
                {
                    type: 'Initial Deposit',
                    description: 'Initial Deposit',
                    amount: 5000,
                    date: new Date().toLocaleString(),
                    category: 'deposit'
                }
            ]
        });
        localStorage.setItem('users', JSON.stringify(users));
    }
});