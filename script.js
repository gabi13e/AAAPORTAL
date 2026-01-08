// ============================================
// GOOGLE SHEETS CONFIGURATION
// ============================================

const GOOGLE_SHEETS_CONFIG = {
    SHEET_ID: '1T5JvxVPCYId0Gz6NBY-C6oUTY_M_JjQk-aJD1Jt0ReM',  
    API_KEY: 'AIzaSyBzGsup0tLQeMo91mCUXgDKsZ1lRl6pZ-E',
    SHEET_NAME: 'OVERALL LIST',
    RANGE: 'OVERALL LIST!A:E'  
};

// ============================================
// DATABASE (Loaded from Google Sheets)
// ============================================

let students = [];
let isLoading = false;

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function checkAuthentication() {
    const session = localStorage.getItem('adminSession') || sessionStorage.getItem('adminSession');
    
    if (session) {
        try {
            const data = JSON.parse(session);
            return data.isLoggedIn === true;
        } catch (e) {
            return false;
        }
    }
    return false;
}

function logout() {
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminSession');
    showStudentView();
    showLogoutMessage();
}

function showLogoutMessage() {
    const message = document.createElement('div');
    message.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up';
    message.innerHTML = `
        <div class="flex items-center space-x-3">
            <span>✓</span>
            <span>Logged out successfully</span>
        </div>
    `;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
}

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
                    orNumber: (row[2] || 'N/A').trim(),
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
        { firstName: 'Juan', lastName: 'Dela Cruz', fullName: 'Juan Dela Cruz', orNumber: 'OR-001', date: '2025-01-01', scholarshipType: 'Academic Scholar', status: 'Paid' },
        { firstName: 'Maria', lastName: 'Santos', fullName: 'Maria Santos', orNumber: 'OR-002', date: '2025-01-02', scholarshipType: 'Sports Scholar', status: 'Paid' },
        { firstName: 'Pedro', lastName: 'Garcia', fullName: 'Pedro Garcia', orNumber: 'OR-003', date: '2025-01-03', scholarshipType: 'Academic Scholar', status: 'Paid' },
        { firstName: 'Ana', lastName: 'Reyes', fullName: 'Ana Reyes', orNumber: 'OR-004', date: '2025-01-04', scholarshipType: 'Arts Scholar', status: 'Paid' },
        { firstName: 'Carlos', lastName: 'Mendoza', fullName: 'Carlos Mendoza', orNumber: 'OR-005', date: '2025-01-05', scholarshipType: 'Academic Scholar', status: 'Paid' },
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
    // Check authentication
    if (!checkAuthentication()) {
        window.location.href = 'login.html';
        return;
    }

    heroSection.style.display = 'none';
    adminSection.classList.remove('hidden');
    renderStudentsTable();
    addLogoutButton();
}

function showStudentView() {
    adminSection.classList.add('hidden');
    heroSection.style.display = 'block';
    searchResults.classList.add('hidden');
    clearForm();
}

function addLogoutButton() {
    // Check if logout button already exists
    if (document.getElementById('logoutBtn')) return;

    const backToHomeBtn = document.getElementById('backToHome');
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all';
    logoutBtn.innerHTML = '🚪 Logout';
    logoutBtn.addEventListener('click', logout);
    
    backToHomeBtn.parentElement.insertBefore(logoutBtn, backToHomeBtn.nextSibling);
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

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
        alert('Please enter your first name, last name, or OR number');
        return;
    }

    // Search by first name, last name, full name, or OR number
    const student = students.find(s => 
        s.firstName.toLowerCase().includes(query) || 
        s.lastName.toLowerCase().includes(query) ||
        s.fullName.toLowerCase().includes(query) ||
        s.orNumber.toLowerCase().includes(query)
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
                    <span class="text-green-700 font-mono text-sm bg-white px-3 py-1 rounded-lg shadow">${student.orNumber}</span>
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
            <p class="text-red-700 font-semibold text-lg">No record found with that name or OR number.</p>
            <p class="text-red-600 text-sm mt-2">Please check the spelling or try searching with your OR number.</p>
        </div>
    `;
    searchResults.classList.remove('hidden');
}

// ============================================
// ADMIN PANEL - TABLE RENDERING
// ============================================

let filteredStudents = [];

function renderStudentsTable(searchQuery = '') {
    // Filter students based on search query
    const studentsToDisplay = searchQuery 
        ? students.filter(s => 
            s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.orNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.scholarshipType.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : students;
    
    filteredStudents = studentsToDisplay;

    if (studentsToDisplay.length === 0) {
        studentsTable.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    <div class="text-4xl mb-2">🔍</div>
                    <p class="font-semibold">No students found</p>
                    <p class="text-sm">Try adjusting your search</p>
                </td>
            </tr>
        `;
        return;
    }

    studentsTable.innerHTML = studentsToDisplay.map((student, displayIndex) => {
        // Get the actual index in the original students array
        const actualIndex = students.indexOf(student);
        
        return `
            <tr class="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all">
                <td class="px-6 py-4 text-sm font-mono text-gray-900">${student.orNumber}</td>
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
                    <button onclick="editStudent(${actualIndex})" class="text-blue-600 hover:text-blue-800 font-semibold hover:underline transform hover:scale-110 transition-all">
                        ✏️ Edit
                    </button>
                    <button onclick="deleteStudent(${actualIndex})" class="text-red-600 hover:text-red-800 font-semibold hover:underline transform hover:scale-110 transition-all">
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function performAdminSearch() {
    const searchQuery = document.getElementById('adminSearchInput').value;
    renderStudentsTable(searchQuery);
}

// ============================================
// ADMIN PANEL - CRUD OPERATIONS
// ============================================

function saveStudent(e) {
    e.preventDefault();
    
    const editId = document.getElementById('editId').value;
    
    // Try both orNumber and receiptNo for backwards compatibility
    const orNumberElement = document.getElementById('orNumber') || document.getElementById('receiptNo');
    
    const student = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        fullName: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`.trim(),
        orNumber: orNumberElement ? orNumberElement.value : 'N/A',
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
    
    // Try both orNumber and receiptNo for backwards compatibility
    const orNumberElement = document.getElementById('orNumber') || document.getElementById('receiptNo');
    if (orNumberElement) {
        orNumberElement.value = student.orNumber;
    }
    
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

adminBtn.addEventListener('click', () => {
    // Redirect to login page instead of showing admin directly
    window.location.href = 'login.html';
});

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
    
    // Check if admin parameter is in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
        if (checkAuthentication()) {
            showAdminPanel();
        } else {
            window.location.href = 'login.html';
        }
    }
    
    console.log('📊 Attempting to connect to Google Sheets...');
    
    const success = await loadStudentsFromSheets();
    
    if (success) {
        console.log('✅ Google Sheets connection successful!');
    } else {
        console.log('⚠️ Using sample data. Check console for errors.');
    }
    
    console.log('📝 Total students loaded:', students.length);
});