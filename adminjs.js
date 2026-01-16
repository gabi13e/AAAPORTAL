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
// STATE MANAGEMENT
// ============================================

let students = [];
let editingIndex = -1;
let deleteIndex = -1;

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
    // Stats
    totalStudents: document.getElementById('totalStudents'),
    paidStudents: document.getElementById('paidStudents'),
    scholarshipTypes: document.getElementById('scholarshipTypes'),
    recentPayments: document.getElementById('recentPayments'),

    // Form
    studentForm: document.getElementById('studentForm'),
    formTitle: document.getElementById('formTitle'),
    submitBtnText: document.getElementById('submitBtnText'),
    editIndex: document.getElementById('editIndex'),
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    orNumber: document.getElementById('orNumber'),
    paymentDate: document.getElementById('paymentDate'),
    scholarshipType: document.getElementById('scholarshipType'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),

    // Search
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),

    // Table
    tableBody: document.getElementById('tableBody'),
    emptyState: document.getElementById('emptyState'),

    // Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteMessage: document.getElementById('deleteMessage'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),

    // Navigation
    logoutBtn: document.getElementById('logoutBtn'),
    backToPortalBtn: document.getElementById('backToPortalBtn'),
    refreshBtn: document.getElementById('refreshBtn'),

    // Toast
    toast: document.getElementById('toast')
};

// ============================================
// AUTHENTICATION
// ============================================

function checkAuthentication() {
    const session = localStorage.getItem('adminSession') || sessionStorage.getItem('adminSession');
    
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        const data = JSON.parse(session);
        if (data.isLoggedIn !== true) {
            window.location.href = 'login.html';
            return false;
        }
    } catch (e) {
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

function logout() {
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminSession');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// ============================================
// GOOGLE SHEETS API
// ============================================

async function loadStudentsFromSheets() {
    showToast('Loading student data...', 'info');

    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.SHEET_ID}/values/${GOOGLE_SHEETS_CONFIG.RANGE}?key=${GOOGLE_SHEETS_CONFIG.API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            students = data.values.slice(1)
                .filter(row => row[0] || row[1])
                .map(row => ({
                    firstName: (row[0] || '').trim(),
                    lastName: (row[1] || '').trim(),
                    orNumber: (row[2] || 'N/A').trim(),
                    date: (row[3] || 'N/A').trim(),
                    scholarshipType: (row[4] || 'N/A').trim(),
                    status: 'Paid'
                }));
            
            showToast(`Loaded ${students.length} students successfully`, 'success');
            updateStatistics();
            renderTable();
            return true;
        } else {
            throw new Error('No data found in sheet');
        }
    } catch (error) {
        console.error('Error loading from Google Sheets:', error);
        loadSampleData();
        showToast('Using sample data (Google Sheets unavailable)', 'warning');
        return false;
    }
}

function loadSampleData() {
    students = [
        { firstName: 'Juan', lastName: 'Dela Cruz', orNumber: 'OR-001', date: '2025-01-15', scholarshipType: 'Academic Scholar', status: 'Paid' },
        { firstName: 'Maria', lastName: 'Santos', orNumber: 'OR-002', date: '2025-01-14', scholarshipType: 'Sports Scholar', status: 'Paid' },
        { firstName: 'Pedro', lastName: 'Garcia', orNumber: 'OR-003', date: '2025-01-13', scholarshipType: 'Academic Scholar', status: 'Paid' },
        { firstName: 'Ana', lastName: 'Reyes', orNumber: 'OR-004', date: '2025-01-12', scholarshipType: 'Arts Scholar', status: 'Paid' },
        { firstName: 'Carlos', lastName: 'Mendoza', orNumber: 'OR-005', date: '2025-01-11', scholarshipType: 'Academic Scholar', status: 'Paid' },
    ];
    updateStatistics();
    renderTable();
}

// ============================================
// STATISTICS
// ============================================

function updateStatistics() {
    // Total students
    elements.totalStudents.textContent = students.length;

    // Paid students
    const paidCount = students.filter(s => s.status === 'Paid').length;
    elements.paidStudents.textContent = paidCount;

    // Unique scholarship types
    const uniqueTypes = new Set(students.map(s => s.scholarshipType));
    elements.scholarshipTypes.textContent = uniqueTypes.size;

    // Recent payments (this month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const recentCount = students.filter(s => {
        const date = new Date(s.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    elements.recentPayments.textContent = recentCount;
}

// ============================================
// TABLE RENDERING
// ============================================

function renderTable(searchQuery = '') {
    let filteredStudents = students;

    // Apply search filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredStudents = students.filter(s =>
            s.firstName.toLowerCase().includes(query) ||
            s.lastName.toLowerCase().includes(query) ||
            s.orNumber.toLowerCase().includes(query) ||
            s.scholarshipType.toLowerCase().includes(query)
        );
    }

    // Clear table
    elements.tableBody.innerHTML = '';

    // Show empty state if no results
    if (filteredStudents.length === 0) {
        elements.emptyState.style.display = 'block';
        return;
    } else {
        elements.emptyState.style.display = 'none';
    }

    // Populate table
    filteredStudents.forEach((student, displayIndex) => {
        const actualIndex = students.indexOf(student);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong>${student.orNumber}</strong></td>
            <td>${student.firstName}</td>
            <td>${student.lastName}</td>
            <td>${formatDate(student.date)}</td>
            <td>${student.scholarshipType}</td>
            <td>
                <span class="status-badge">
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                    ${student.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editStudent(${actualIndex})">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Edit
                    </button>
                    <button class="delete-btn" onclick="confirmDelete(${actualIndex})">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Delete
                    </button>
                </div>
            </td>
        `;
        
        elements.tableBody.appendChild(row);
    });
}

// ============================================
// FORM HANDLING
// ============================================

function handleFormSubmit(e) {
    e.preventDefault();

    const student = {
        firstName: elements.firstName.value.trim(),
        lastName: elements.lastName.value.trim(),
        orNumber: elements.orNumber.value.trim(),
        date: elements.paymentDate.value,
        scholarshipType: elements.scholarshipType.value.trim(),
        status: 'Paid'
    };

    if (editingIndex >= 0) {
        // Update existing student
        students[editingIndex] = student;
        showToast('Student updated successfully!', 'success');
        cancelEdit();
    } else {
        // Add new student
        students.push(student);
        showToast('Student added successfully!', 'success');
    }

    elements.studentForm.reset();
    updateStatistics();
    renderTable(elements.searchInput.value);
}

function editStudent(index) {
    editingIndex = index;
    const student = students[index];

    // Populate form
    elements.firstName.value = student.firstName;
    elements.lastName.value = student.lastName;
    elements.orNumber.value = student.orNumber;
    elements.paymentDate.value = student.date;
    elements.scholarshipType.value = student.scholarshipType;

    // Update UI
    elements.formTitle.textContent = 'Edit Student Record';
    elements.submitBtnText.textContent = 'Update Student';
    elements.cancelEditBtn.style.display = 'flex';

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    editingIndex = -1;
    elements.studentForm.reset();
    elements.formTitle.textContent = 'Add New Student';
    elements.submitBtnText.textContent = 'Save Student';
    elements.cancelEditBtn.style.display = 'none';
}

// ============================================
// DELETE HANDLING
// ============================================

function confirmDelete(index) {
    deleteIndex = index;
    const student = students[index];
    elements.deleteMessage.textContent = `Are you sure you want to delete ${student.firstName} ${student.lastName}'s record?`;
    elements.deleteModal.classList.add('active');
}

function deleteStudent() {
    if (deleteIndex >= 0) {
        const student = students[deleteIndex];
        students.splice(deleteIndex, 1);
        showToast(`${student.firstName} ${student.lastName} deleted successfully`, 'success');
        deleteIndex = -1;
        elements.deleteModal.classList.remove('active');
        updateStatistics();
        renderTable(elements.searchInput.value);
    }
}

function cancelDelete() {
    deleteIndex = -1;
    elements.deleteModal.classList.remove('active');
}

// ============================================
// SEARCH HANDLING
// ============================================

function handleSearch() {
    const query = elements.searchInput.value;
    renderTable(query);
}

function clearSearch() {
    elements.searchInput.value = '';
    renderTable();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
    if (!dateString || dateString === 'N/A') return 'N/A';
    
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ============================================
// EVENT LISTENERS
// ============================================

function initEventListeners() {
    // Form
    elements.studentForm.addEventListener('submit', handleFormSubmit);
    elements.cancelEditBtn.addEventListener('click', cancelEdit);

    // Search
    elements.searchInput.addEventListener('input', handleSearch);
    elements.clearSearchBtn.addEventListener('click', clearSearch);

    // Delete modal
    elements.confirmDeleteBtn.addEventListener('click', deleteStudent);
    elements.cancelDeleteBtn.addEventListener('click', cancelDelete);
    elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) {
            cancelDelete();
        }
    });

    // Navigation
    elements.logoutBtn.addEventListener('click', logout);
    elements.backToPortalBtn.addEventListener('click', () => {
        window.location.href = 'index.html?admin=true';
    });
    elements.refreshBtn.addEventListener('click', () => {
        loadStudentsFromSheets();
    });

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.deleteModal.classList.contains('active')) {
            cancelDelete();
        }
    });
}

// Make functions globally accessible
window.editStudent = editStudent;
window.confirmDelete = confirmDelete;

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    // Check authentication
    if (!checkAuthentication()) {
        return;
    }

    // Initialize event listeners
    initEventListeners();

    // Set default date to today
    elements.paymentDate.valueAsDate = new Date();

    // Load data
    await loadStudentsFromSheets();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);