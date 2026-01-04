// ============================================
// GOOGLE SHEETS CONFIGURATION
// ============================================

const GOOGLE_SHEETS_CONFIG = {
    SHEET_ID: '1T5JvxVPCYId0Gz6NBY-C6oUTY_M_JjQk-aJD1Jt0ReM',  // Get from URL - 44 characters long!
    API_KEY: 'AIzaSyBzGsup0tLQeMo91mCUXgDKsZ1lRl6pZ-E',
    SHEET_NAME: 'OVERALL LIST',
    RANGE: 'OVERALL LIST!A:E'  // Must match SHEET_NAME!
};

// ============================================
// DATABASE (Loaded from Google Sheets)
// ============================================

let students = [];
let isLoading = false;

// ============================================
// GOOGLE SHEETS API FUNCTIONS
// ============================================

// Load students from Google Sheets
async function loadStudentsFromSheets() {
    isLoading = true;
    showLoadingMessage('Loading student data...');
    
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.SHEET_ID}/values/${GOOGLE_SHEETS_CONFIG.RANGE}?key=${GOOGLE_SHEETS_CONFIG.API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            // Skip header row (index 0) and convert to objects
            students = data.values.slice(1)
                .filter(row => row[0] || row[1]) // Only include rows with a first or last name
                .map(row => ({
                    firstName: (row[0] || '').trim(),
                    lastName: (row[1] || '').trim(),
                    fullName: `${(row[0] || '').trim()} ${(row[1] || '').trim()}`.trim(),
                    receiptNo: (row[2] || 'N/A').trim(),
                    date: (row[3] || 'N/A').trim(),
                    scholarshipType: (row[4] || 'N/A').trim(),
                    status: 'Paid' // All students in the sheet are considered paid
                }));
            
            console.log('✅ Successfully loaded', students.length, 'students from Google Sheets');
            hideLoadingMessage();
            
            // Render table if in admin view
            if (!adminSection.classList.contains('hidden')) {
                renderStudentsTable();
            }
            
            return true;
        } else {
            throw new Error('No data found in sheet');
        }
    } catch (error) {
        console.error('❌ Error loading from Google Sheets:', error);
        loadSampleData();
        showErrorMessage('Could not connect to Google Sheets. Using sample data. Please check your configuration.');
        return false;
    } finally {
        isLoading = false;
    }
}

// Load sample data (fallback)
function loadSampleData() {
    students = [
        { firstName: 'Juan', lastName: 'Dela Cruz', fullName: 'Juan Dela Cruz', receiptNo: 'RCP-001', date: '2025-01-01', scholarshipType: 'Academic Scholar', status: 'Paid' },
        { firstName: 'Maria', lastName: 'Santos', fullName: 'Maria Santos', receiptNo: 'RCP-002', date: '2025-01-02', scholarshipType: 'Sports Scholar', status: 'Paid' },
        { firstName: 'Pedro', lastName: 'Garcia', fullName: 'Pedro Garcia', receiptNo: 'RCP-003', date: '2025-01-03', scholarshipType: 'Academic Scholar', status: 'Paid' },
        { firstName: 'Ana', lastName: 'Reyes', fullName: 'Ana Reyes', receiptNo: 'RCP-004', date: '2025-01-04', scholarshipType: 'Arts Scholar', status: 'Paid' },
        { firstName: 'Carlos', lastName: 'Mendoza', fullName: 'Carlos Mendoza', receiptNo: 'RCP-005', date: '2025-01-05', scholarshipType: 'Academic Scholar', status: 'Paid' },
    ];
    console.log('⚠️ Using sample data (5 students)');
}

// ============================================
// DOM ELEMENTS
// ============================================

const heroSection = document.getElementById('heroSection');
const adminSection = document.getElementById('adminSection');
const adminBtn = document.getElementById('adminBtn');
const backToHome = document.getElementById('backToHome');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const studentInfo = document.getElementById('studentInfo');
const studentForm = document.getElementById('studentForm');
const studentsTable = document.getElementById('studentsTable');
const cancelEdit = document.getElementById('cancelEdit');

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

function showAdminPanel() {
    heroSection.style.display = 'none';
    adminSection.classList.remove('hidden');
    renderStudentsTable();
    showSetupInstructions();
}

function showStudentView() {
    adminSection.classList.add('hidden');
    heroSection.style.display = 'block';
    searchResults.classList.add('hidden');
    clearForm();
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

function showLoadingMessage(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingMessage';
    loadingDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up';
    loadingDiv.innerHTML = `
        <div class="flex items-center space-x-3">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

function hideLoadingMessage() {
    const loadingDiv = document.getElementById('loadingMessage');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up';
    errorDiv.innerHTML = `
        <div class="flex items-center space-x-3">
            <span>⚠️</span>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSetupInstructions() {
    const existingInstructions = document.getElementById('setupInstructions');
    if (existingInstructions) return;

    const instructionsDiv = document.createElement('div');
    instructionsDiv.id = 'setupInstructions';
    instructionsDiv.className = 'bg-yellow-50 border-3 border-yellow-300 rounded-2xl p-6 mb-6 shadow-lg';
    instructionsDiv.innerHTML = `
        <div class="flex items-start space-x-4">
            <div class="text-3xl">⚙️</div>
            <div class="flex-1">
                <h3 class="text-xl font-bold text-yellow-800 mb-3">Google Sheets Setup Instructions</h3>
                <div class="text-sm text-yellow-700 space-y-2">
                    <p><strong>Current Status:</strong> ${students.length > 5 ? '✅ Connected to Google Sheets' : '⚠️ Using sample data (Not connected)'}</p>
                    
                    <details class="mt-4">
                        <summary class="cursor-pointer font-bold text-blue-700 hover:text-blue-900">Click to view setup steps</summary>
                        <div class="mt-3 ml-4 space-y-2">
                            <p class="mt-3"><strong>Step 1: Create Google Sheet</strong></p>
                            <ul class="list-disc ml-6 space-y-1 text-xs">
                                <li>Go to Google Sheets and create a new spreadsheet</li>
                                <li>Keep the sheet tab name as "Sheet1" (or update SHEET_NAME in config)</li>
                                <li>Add headers in row 1: <strong>FIRST NAME | LAST NAME | RECEIPT NO | DATE | SCHOLARSHIP TYPE</strong></li>
                                <li>Add your scholar data starting from row 2</li>
                                <li>Example data: Juan | Dela Cruz | RCP-001 | 2025-01-01 | Academic Scholar</li>
                            </ul>
                            
                            <p class="mt-3"><strong>Step 2: Get Sheet ID</strong></p>
                            <ul class="list-disc ml-6 space-y-1 text-xs">
                                <li>From URL: docs.google.com/spreadsheets/d/<strong>[COPY_THIS_PART]</strong>/edit</li>
                            </ul>
                            
                            <p class="mt-3"><strong>Step 3: Enable Google Sheets API</strong></p>
                            <ul class="list-disc ml-6 space-y-1 text-xs">
                                <li>Go to Google Cloud Console (console.cloud.google.com)</li>
                                <li>Create new project or select existing</li>
                                <li>Enable "Google Sheets API"</li>
                                <li>Create Credentials → API Key</li>
                            </ul>
                            
                            <p class="mt-3"><strong>Step 4: Update Configuration</strong></p>
                            <ul class="list-disc ml-6 space-y-1 text-xs">
                                <li>Open script.js file</li>
                                <li>Replace SHEET_ID and API_KEY at the top (lines 7-8)</li>
                                <li>Make sure Sheet is set to "Anyone with link can view"</li>
                            </ul>
                            
                            <p class="mt-3 text-red-600"><strong>⚠️ Important:</strong> This setup only allows reading data. To enable add/edit/delete, OAuth2 authentication is required.</p>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    `;
    
    const adminContent = adminSection.querySelector('.container > .bg-white');
    adminContent.insertBefore(instructionsDiv, adminContent.children[1]);
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
        alert('Please enter your first name, last name, or receipt number');
        return;
    }

    // Search by first name, last name, full name, or receipt number
    const student = students.find(s => 
        s.firstName.toLowerCase().includes(query) || 
        s.lastName.toLowerCase().includes(query) ||
        s.fullName.toLowerCase().includes(query) ||
        s.receiptNo.toLowerCase().includes(query)
    );

    if (student) {
        displayStudentInfo(student);
    } else {
        displayNoResults();
    }
}

function displayStudentInfo(student) {
    // Since all students in the list are paid, always show "Paid" status
    const config = { 
        color: 'green', 
        icon: '✓', 
        bg: 'bg-green-50', 
        border: 'border-green-300', 
        text: 'text-green-800' 
    };

    studentInfo.innerHTML = `
        <div class="fade-in">
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-3 border-green-300 space-y-4 shadow-lg">
                <div class="flex justify-between items-center pb-3 border-b-2 border-green-200">
                    <span class="font-bold text-gray-700 text-lg flex items-center">
                        <span class="text-3xl mr-3">✓</span>
                        Payment Verified
                    </span>
                    <span class="text-green-700 font-mono text-sm bg-white px-3 py-1 rounded-lg shadow">${student.receiptNo}</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <span class="text-sm text-gray-600 font-medium">First Name</span>
                        <div class="text-gray-900 font-semibold text-lg">${student.firstName}</div>
                    </div>
                    <div>
                        <span class="text-sm text-gray-600 font-medium">Last Name</span>
                        <div class="text-gray-900 font-semibold text-lg">${student.lastName}</div>
                    </div>
                </div>
                <div class="bg-white rounded-lg p-4 border-2 border-green-200 shadow">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-600 font-medium">Scholarship Type</span>
                        <span class="text-gray-900 font-semibold">${student.scholarshipType}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 font-medium">Payment Date</span>
                        <span class="text-gray-900 font-bold text-lg">${student.date}</span>
                    </div>
                </div>
                <div class="${config.bg} rounded-lg p-4 border-3 ${config.border} shadow-lg">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-gray-700 text-lg">Payment Status</span>
                        <div class="flex items-center space-x-2">
                            <span class="text-3xl">${config.icon}</span>
                            <span class="px-6 py-3 rounded-full font-bold ${config.text} bg-white border-2 ${config.border} text-lg">
                                PAID
                            </span>
                        </div>
                    </div>
                    <p class="text-sm text-green-700 mt-3 text-center font-medium">
                        🎉 Your contribution has been successfully received. Thank you!
                    </p>
                </div>
            </div>
        </div>
    `;
    searchResults.classList.remove('hidden');
}

function displayNoResults() {
    studentInfo.innerHTML = `
        <div class="bg-red-50 border-3 border-red-200 rounded-lg p-6 text-center fade-in shadow-lg">
            <div class="text-red-600 text-5xl mb-3">✗</div>
            <p class="text-red-700 font-semibold text-lg">No record found with that name or receipt number.</p>
            <p class="text-red-600 text-sm mt-2">Please check the spelling or try searching with your receipt number.</p>
        </div>
    `;
    searchResults.classList.remove('hidden');
}

// ============================================
// ADMIN PANEL - TABLE RENDERING
// ============================================

function renderStudentsTable() {
    studentsTable.innerHTML = students.map((student, index) => {
        return `
            <tr class="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all">
                <td class="px-6 py-4 text-sm font-mono text-gray-900">${student.receiptNo}</td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">${student.firstName}</td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">${student.lastName}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${student.date}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${student.scholarshipType}</td>
                <td class="px-6 py-4 text-sm">
                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border-2 border-green-300">
                        ✓ PAID
                    </span>
                </td>
                <td class="px-6 py-4 text-sm space-x-3">
                    <button onclick="editStudent(${index})" class="text-blue-600 hover:text-blue-800 font-semibold hover:underline transform hover:scale-110 transition-all">
                        ✏️ Edit
                    </button>
                    <button onclick="deleteStudent(${index})" class="text-red-600 hover:text-red-800 font-semibold hover:underline transform hover:scale-110 transition-all">
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// ADMIN PANEL - CRUD OPERATIONS
// ============================================

function saveStudent(e) {
    e.preventDefault();
    
    const editId = document.getElementById('editId').value;
    const student = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        fullName: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`.trim(),
        receiptNo: document.getElementById('receiptNo').value,
        date: document.getElementById('date').value,
        scholarshipType: document.getElementById('scholarshipType').value,
        status: 'Paid' // Always set to Paid
    };

    if (editId !== '') {
        students[parseInt(editId)] = student;
        alert('✅ Student record updated!\n\n⚠️ Note: Changes are only saved in memory.\nTo persist data, you need to manually update Google Sheets or implement OAuth2 write access.');
    } else {
        students.push(student);
        alert('✅ Student record added!\n\n⚠️ Note: Changes are only saved in memory.\nTo persist data, you need to manually update Google Sheets or implement OAuth2 write access.');
    }

    clearForm();
    renderStudentsTable();
}

function editStudent(index) {
    const student = students[index];
    
    document.getElementById('editId').value = index;
    document.getElementById('firstName').value = student.firstName;
    document.getElementById('lastName').value = student.lastName;
    document.getElementById('receiptNo').value = student.receiptNo;
    document.getElementById('date').value = student.date;
    document.getElementById('scholarshipType').value = student.scholarshipType;
    
    cancelEdit.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteStudent(index) {
    const student = students[index];
    
    if (confirm(`⚠️ Are you sure you want to delete ${student.fullName}'s record?\n\nNote: This only removes from memory, not from Google Sheets.`)) {
        students.splice(index, 1);
        renderStudentsTable();
        alert('✅ Student record deleted from memory!');
    }
}

function clearForm() {
    studentForm.reset();
    document.getElementById('editId').value = '';
    cancelEdit.classList.add('hidden');
}

// ============================================
// EVENT LISTENERS
// ============================================

adminBtn.addEventListener('click', showAdminPanel);
backToHome.addEventListener('click', showStudentView);

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

studentForm.addEventListener('submit', saveStudent);
cancelEdit.addEventListener('click', clearForm);

// ============================================
// INITIALIZATION
// ============================================

window.editStudent = editStudent;
window.deleteStudent = deleteStudent;

// Load data on page load
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Student Clearance System Starting...');
    console.log('📊 Attempting to connect to Google Sheets...');
    
    const success = await loadStudentsFromSheets();
    
    if (success) {
        console.log('✅ Google Sheets connection successful!');
    } else {
        console.log('⚠️ Using sample data. Check console for errors.');
    }
    
    console.log('📝 Total students loaded:', students.length);
});