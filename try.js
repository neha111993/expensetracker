// --- INITIALIZATION ---
const form = document.getElementById('expenseForm');
const submitBtn = document.getElementById('submitBtn');
const incomeInput = document.getElementById('monthlyIncome');
const expenseBody = document.getElementById('expenseBody');

let editIndex = -1; // -1 means we are adding new, not editing

window.onload = () => {
    const savedName = localStorage.getItem('userName');
    const nameHeading = document.querySelector('.heading h2'); // Targets the <h2> in your header
    
    if (savedName && nameHeading) {
        nameHeading.innerText = `Hi ${savedName}`;
    }
    document.getElementById('Summary').style.display = "flex";
    const savedIncome = localStorage.getItem('userIncome');
    if (savedIncome) incomeInput.value = savedIncome;
    updateBalance();
    showSummaries();
    showReminders();
    checkDueReminders();
};

// --- 0. INCOME & BALANCE ---
function saveIncome() {
    localStorage.setItem('userIncome', incomeInput.value);
    updateBalance();
}

function updateBalance() {
    const income = parseFloat(localStorage.getItem('userIncome')) || 0;
    const expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');
    const totalSpent = expenses.reduce((sum, ex) => sum + parseFloat(ex.amount), 0);
    const balance = income - totalSpent;

    const balanceDiv = document.getElementById('balanceDisplay');
    const color = balance >= 0 ? 'chartreuse' : '#ff4444';
    
    balanceDiv.innerHTML = `
        <div style="background: rgb(8, 77, 80); padding: 15px; border-radius: 8px; margin-top:10px; color: white;">
            <p>Total Income: ₹${income}</p>
            <p>Total Expenses: ₹${totalSpent}</p>
            <hr>
            <p style="color:${color}; font-size: 1.2rem; font-weight: bold;">
                Remaining Balance: ₹${balance.toFixed(2)}
            </p>
        </div>`;
}

// --- 1. FORM VALIDATION ---
form.addEventListener('input', () => {
    const category = document.getElementById('category').value;
    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;
    submitBtn.disabled = !(category !== "" && amount > 0 && date !== "");
});

// --- 2. SUBMIT / UPDATE LOGIC ---
form.onsubmit = (e) => {
    e.preventDefault();
    
    const newExpense = {
        category: document.getElementById('category').value,
        amount: parseFloat(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        desc: document.getElementById('description').value || 'N/A',
        isReminder: document.getElementById('reminderCheckbox').checked
    };

    let expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');

    if (editIndex === -1) {
        // ADD NEW
        expenses.push(newExpense);
    } else {
        // UPDATE EXISTING
        expenses[editIndex] = newExpense;
        editIndex = -1; // Reset edit mode
        submitBtn.innerText = "Submit";
    }

    localStorage.setItem('myExpenses', JSON.stringify(expenses));
    form.reset();
    submitBtn.disabled = true;
    updateBalance();
    showSummaries();
    showReminders();
    alert("Record Saved!");
};
// --- 3. YEARLY EARNINGS & SAVINGS LOGIC ---
function calculateYearlyEarnings() {
    const expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');
    const monthlyIncome = parseFloat(localStorage.getItem('userIncome')) || 0;
    
    // Group everything by month first
    const monthlyData = expenses.reduce((acc, ex) => {
        const date = new Date(ex.date);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = 0;
        acc[monthYear] += parseFloat(ex.amount);
        return acc;
    }, {});

    let totalYearlySavings = 0;
    const monthsActive = Object.keys(monthlyData).length || 1;
    
    // Total Savings = (Income * Number of Months) - Total Expenses
    const totalYearlyIncome = monthlyIncome * monthsActive;
    const totalYearlyExpenses = expenses.reduce((sum, ex) => sum + ex.amount, 0);
    totalYearlySavings = totalYearlyIncome - totalYearlyExpenses;

    const yearlyDiv = document.getElementById('yearlySummary');
    yearlyDiv.innerHTML = `
        <div style="background: #1b5e20; color: white; padding: 15px; border-radius: 8px; text-align: center;">
            <p>Total Yearly Earnings: ₹${totalYearlyIncome}</p>
            <p>Total Yearly Expenses: ₹${totalYearlyExpenses}</p>
            <h3 style="color: chartreuse;">Total Net Savings: ₹${totalYearlySavings.toFixed(2)}</h3>
        </div>
    `;
}

// --- 4. REMINDER DISPLAY LOGIC ---
function showReminders() {
    const expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');
    const reminderList = document.getElementById('reminderList');
    
    const reminders = expenses.map((ex, index) => ({...ex, originalIndex: index}))
    .filter(ex => ex.isReminder);

    if (reminders.length === 0) {
        reminderList.innerHTML = "<p style='color:blue; text-align:center;'>No recurring reminders set.</p>";
        return;
    }

    reminderList.innerHTML = reminders.map(rem => `
        <div style="background: #4a148c; color: white; padding: 10px; border-radius: 5px; margin-bottom: 5px; display: flex; justify-content: space-between;">
            <span><i class="fa-solid fa-bell"></i> ${rem.category} (${rem.desc})</span>
            <span style="color: #ea80fc;">₹${rem.amount} due monthly</span>
            <button onclick="removeReminderTag(${rem.originalIndex})" style="background:none; border:none; color: #ff8a80; cursor:pointer; font-size: 1.1rem;" title="Stop Reminder">
                <i class="fa-solid fa-bell-slash"></i>
            </button>
        </div>
    `).join('');
}
function removeReminderTag(index) {
    let expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');
    expenses[index].isReminder = false; // Turn off the flag
    localStorage.setItem('myExpenses', JSON.stringify(expenses));
    
    showReminders(); // Refresh the reminder tab
    alert("Reminder turned off for this item.");
}

// --- 5. EDIT & DELETE ---
function editExpense(index) {
    const expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');
    const item = expenses[index];

    // 1. Fill the form with existing data
    document.getElementById('category').value = item.category;
    document.getElementById('amount').value = item.amount;
    document.getElementById('date').value = item.date;
    document.getElementById('description').value = item.desc;

    // 2. Prepare UI for editing
    editIndex = index;
    submitBtn.innerText = "Update Expense";
    submitBtn.disabled = false;

    // 3. Switch to Entries tab so user sees the form
    const entriesTabBtn = document.querySelector('button[onclick*="enteries"]');
    openTab({ currentTarget: entriesTabBtn }, 'enteries');
}

function deleteExpense(index) {
    if(!confirm("Are you sure you want to delete this?")) return;
    let expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');
    expenses.splice(index, 1);
    localStorage.setItem('myExpenses', JSON.stringify(expenses));
    showSummaries();
    updateBalance();
}

// --- 6. RENDER & FILTER ---
function showSummaries() {
    const expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');
    expenseBody.innerHTML = "";

    expenses.forEach((ex, index) => {
        const row = `
            <tr>
                <td style="padding: 8px; border: 1px solid cadetblue; text-align: center;">${ex.date}</td>
                <td style="padding: 8px; border: 1px solid cadetblue;">${ex.category}</td>
                <td style="padding: 8px; border: 1px solid cadetblue;">${ex.desc}</td>
                <td style="padding: 8px; border: 1px solid cadetblue; text-align: center;">₹${ex.amount}</td>
                <td style="padding: 8px; border: 1px solid cadetblue; text-align: center;">
                    <button onclick="editExpense(${index})" style="background:none; border:none; color:lightblue; cursor:pointer; margin-right:10px;">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteExpense(${index})" style="background:none; border:none; color:orange; cursor:pointer;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        expenseBody.innerHTML += row;
    });
}

function filterTable() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const rows = expenseBody.getElementsByTagName('tr');

    for (let row of rows) {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(input) ? "" : "none";
    }
}

// --- 7. TOGGLE TABLE ---
function openTab(evt, tabName) {
    const contents = document.getElementsByClassName("tab-content");
    for (let content of contents) content.style.display = "none";

    const links = document.getElementsByClassName("btn1");
    for (let link of links) link.classList.remove("active");

    document.getElementById(tabName).style.display = "flex";
    if (tabName === 'spendings')  showByTime();
        if (tabName === 'stats') {
        showReminders();
        calculateYearlyEarnings();
        showCategoryBreakdown();
    }
    if(evt) evt.currentTarget.classList.add("active");
}
// --- 8. TIME BASED SPENDING LOGIC ---
function showByTime() {
    const expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');
    const container = document.getElementById('timeSummaryDisplay');
    
    if (expenses.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:white;'>No data available to calculate trends.</p>";
        return;
    }

    // Group expenses by Month-Year (e.g., "February 2026")
    const monthlyTotals = expenses.reduce((acc, ex) => {
        const date = new Date(ex.date);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        if (!acc[monthYear]) {
            acc[monthYear] = 0;
        }
        acc[monthYear] += parseFloat(ex.amount);
        return acc;
    }, {});

    // Generate HTML cards for each month
    let html = "";
    for (const [month, total] of Object.entries(monthlyTotals)) {
        html += `
            <div style="background: rgb(8, 77, 80); color: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 5px solid chartreuse; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold; font-size: 1.1rem;">${month}</span>
                <span style="color: chartreuse; font-size: 1.2rem;">₹${total.toFixed(2)}</span>
            </div>
        `;
    }
    container.innerHTML = html;
}
// --- 9. TIME BASED SPENDING LOGIC WITH PROGRESS BAR ---
function showByTime() {
    const expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');
    const income = parseFloat(localStorage.getItem('userIncome')) || 0;
    const container = document.getElementById('timeSummaryDisplay');
    
    if (expenses.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:white;'>No data available to calculate trends.</p>";
        return;
    }

    // Group expenses by Month-Year
    const monthlyTotals = expenses.reduce((acc, ex) => {
        const date = new Date(ex.date);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = 0;
        acc[monthYear] += parseFloat(ex.amount);
        return acc;
    }, {});

    let html = "";
    for (const [month, total] of Object.entries(monthlyTotals)) {
        // Calculate percentage of income spent
        const percentage = income > 0 ? Math.min((total / income) * 100, 100) : 0;
        const barColor = percentage > 90 ? '#ff4444' : (percentage > 70 ? '#ffbb33' : 'chartreuse');

        html += `
            <div style="background: rgb(8, 77, 80); color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #795548;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: bold;">${month}</span>
                    <span>₹${total.toFixed(2)}</span>
                </div>
                
                <div style="width: 100%; background-color: cadetblue; border-radius: 10px; height: 12px; overflow: hidden;">
                    <div style="width: ${percentage}%; background-color: ${barColor}; height: 100%; transition: width 0.5s ease-in-out;"></div>
                </div>
                
                <p style="font-size: 0.8rem; margin-top: 5px; color: ${barColor};">
                    ${percentage.toFixed(1)}% of monthly income spent
                </p>
            </div>
        `;
    }
    container.innerHTML = html;
}

// --- 10. BROWSER NOTIFICATION LOGIC ---
function requestNotificationPermission() {
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

function triggerReminderNotification(category, amount) {
    if (Notification.permission === "granted") {
        new Notification("Expense Reminder!", {
            body: `Don't forget to pay ₹${amount} for ${category} today!`,
            icon: "https://cdn-icons-png.flaticon.com/512/1827/1827347.png" 
        });
    }
}

// Call this on load to ask the user for permission once
requestNotificationPermission();

// --- 11. AUTOMATIC REMINDER CHECK ---
function checkDueReminders() {
    const expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');
    const today = new Date();
    const currentDay = today.getDate(); // e.g., 19

    expenses.forEach(ex => {
        if (ex.isReminder) {
            const expenseDate = new Date(ex.date);
            // If the day of the month matches today
            if (expenseDate.getDate() === currentDay) {
                triggerReminderNotification(ex.category, ex.amount);
            }
        }
    });
}

// --- 12. CATEGORY BREAKDOWN ---
function showCategoryBreakdown() {
    const expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');
    const chartDiv = document.getElementById('categoryChart');
    
    if (expenses.length === 0) {
        chartDiv.innerHTML = "<p style='text-align:center;'>No data for breakdown.</p>";
        return;
    }

    const totals = expenses.reduce((acc, ex) => {
        acc[ex.category] = (acc[ex.category] || 0) + parseFloat(ex.amount);
        return acc;
    }, {});

    const totalAll = Object.values(totals).reduce((a, b) => a + b, 0);

    let html = '<div style="display: grid; gap: 10px;">';
    for (const [cat, amt] of Object.entries(totals)) {
        const percent = ((amt / totalAll) * 100).toFixed(1);
        html += `
            <div style="background: #3e2723; padding: 10px; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${cat}</span>
                    <span>₹${amt.toFixed(2)} (${percent}%)</span>
                </div>
                <div style="width: 100%; background: #5d4037; height: 8px; border-radius: 4px;">
                    <div style="width: ${percent}%; background: chartreuse; height: 100%; border-radius: 4px;"></div>
                </div>
            </div>`;
    }
    chartDiv.innerHTML = html + '</div>';
}

// --- 13. DOWNLOAD PDF ---
async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const expenses = JSON.parse(localStorage.getItem('myExpenses') || '[]');
    const income = localStorage.getItem('userIncome') || '0';

    // Header
    doc.setFontSize(18);
    doc.text("Expense Tracker Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Monthly Income Setting: INR ${income}`, 14, 35);

    // Table
    const tableData = expenses.map(ex => [ex.date, ex.category, ex.desc, `INR ${ex.amount}`]);
    
    doc.autoTable({
        startY: 45,
        head: [['Date', 'Category', 'Description', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [46, 125, 50] } // Green theme
    });

    doc.save("Expense_Report.pdf");
}
function logoutUser() {
    // Clear user-specific data
    localStorage.removeItem('userName');
    
    // Optional: If you want to clear income/expenses on logout, uncomment below:
    // localStorage.clear(); 

    // Redirect back to login/signup page
    window.location.href = "index.html"; 
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}