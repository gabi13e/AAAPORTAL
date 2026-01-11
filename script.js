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
// DOM ELEMENTS (Will be initialized after DOM loads)
// ============================================

let heroSection;
let adminSection;
let adminBtn;
let backToHome;
let searchInput;
let searchBtn;
let searchResults;
let studentInfo;
let studentForm;
let studentsTable;
let cancelEdit;

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
    message.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;';
    message.innerHTML = '<div style="display: flex; align-items: center; gap: 12px;"><span>✓</span><span>Logged out successfully</span></div>';
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
}

// ============================================
// GOOGLE SHEETS API FUNCTIONS
// ============================================

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
            students = data.values.slice(1)
                .filter(row => row[0] || row[1])
                .map(row => ({
                    firstName: (row[0] || '').trim(),
                    lastName: (row[1] || '').trim(),
                    fullName: `${(row[0] || '').trim()} ${(row[1] || '').trim()}`.trim(),
                    orNumber: (row[2] || 'N/A').trim(),
                    date: (row[3] || 'N/A').trim(),
                    scholarshipType: (row[4] || 'N/A').trim(),
                    status: 'Paid'
                }));
            
            console.log('✅ Successfully loaded', students.length, 'students from Google Sheets');
            hideLoadingMessage();
            
            if (adminSection && !adminSection.classList.contains('hidden')) {
                renderStudentsTable();
            }
            
            return true;
        } else {
            throw new Error('No data found in sheet');
        }
    } catch (error) {
        console.error('❌ Error loading from Google Sheets:', error);
        loadSampleData();
        showErrorMessage('Could not connect to Google Sheets. Using sample data.');
        return false;
    } finally {
        isLoading = false;
    }
}

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
// NAVIGATION FUNCTIONS
// ============================================

function showAdminPanel() {
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
    if (searchResults) {
        searchResults.classList.add('hidden');
        searchResults.style.display = 'none';
    }
    clearForm();
}

function addLogoutButton() {
    if (document.getElementById('logoutBtn')) return;

    const backToHomeBtn = document.getElementById('backToHome');
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'nav-btn';
    logoutBtn.style.cssText = 'background: #dc2626; margin-left: 12px;';
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
    loadingDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;';
    loadingDiv.innerHTML = `<div style="display: flex; align-items: center; gap: 12px;"><span>⏳</span><span>${message}</span></div>`;
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
    errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;';
    errorDiv.innerHTML = `<div style="display: flex; align-items: center; gap: 12px;"><span>⚠️</span><span>${message}</span></div>`;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function performSearch() {
    console.log('🔍 performSearch called');
    
    if (!searchInput) {
        console.error('❌ searchInput element not found!');
        return;
    }
    
    const query = searchInput.value.toLowerCase().trim();
    console.log('Search query:', query);
    
    if (!query) {
        customAlert('Please enter your first name, last name, or OR number', 'warning');('Please enter your first name, last name, or OR number');
        return;
    }

    const matchingStudents = students.filter(s => 
        s.firstName.toLowerCase().includes(query) || 
        s.lastName.toLowerCase().includes(query) ||
        s.fullName.toLowerCase().includes(query) ||
        s.orNumber.toLowerCase().includes(query)
    );

    console.log('Found matches:', matchingStudents.length);

    if (matchingStudents.length === 1) {
        displayStudentInfo(matchingStudents[0]);
    } else if (matchingStudents.length > 1) {
        displayMultipleMatches(matchingStudents);
    } else {
        displayNoResults();
    }
}
// Make selectStudent globally accessible
window.selectStudent = function(index) {
    displayStudentInfo(students[index]);
};

// Updated displayMultipleMatches function
function displayMultipleMatches(matches) {
    studentInfo.innerHTML = `
        <div class="multiple-records-container">
            <div class="multiple-records-header">
                <div class="multiple-records-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 32px; height: 32px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                <div class="multiple-records-title">
                    <h3>Multiple Records Found</h3>
                    <p>Found ${matches.length} students matching your search</p>
                </div>
            </div>
            <p class="multiple-records-subtitle">Please select your record below:</p>
            <div>
                ${matches.map((student) => {
                    const studentIndex = students.indexOf(student);
                    return `
                        <button onclick="window.selectStudent(${studentIndex})" class="student-card-btn">
                            <div class="student-card-header">
                                <div class="student-card-name">${student.fullName}</div>
                                <div class="student-card-receipt">${student.orNumber}</div>
                            </div>
                            <div class="student-card-details">
                                <div class="student-card-detail-item">
                                    <span class="student-card-detail-label">Date</span>
                                    <span class="student-card-detail-value">${student.date}</span>
                                </div>
                                <div class="student-card-detail-item">
                                    <span class="student-card-detail-label">Scholarship</span>
                                    <span class="student-card-detail-value">${student.scholarshipType}</span>
                                </div>
                            </div>
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    searchResults.classList.remove('hidden');
    searchResults.style.display = 'block';
}

// Updated displayStudentInfo function
function displayStudentInfo(student) {
    studentInfo.innerHTML = `
        <div class="payment-verified-container">
            <div class="payment-verified-header">
                <div class="payment-verified-badge">
                    <div class="payment-verified-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 24px; height: 24px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <span>Payment Verified</span>
                </div>
                <div class="payment-receipt-number">${student.orNumber}</div>
            </div>
            
            <div class="payment-name-section">
                <div class="payment-name-item">
                    <span class="payment-name-label">First Name</span>
                    <div class="payment-name-value">${student.firstName}</div>
                </div>
                <div class="payment-name-item">
                    <span class="payment-name-label">Last Name</span>
                    <div class="payment-name-value">${student.lastName}</div>
                </div>
            </div>
            
            <div class="payment-details-card">
                <div class="payment-detail-row">
                    <span class="payment-detail-label">Scholarship Type</span>
                    <span class="payment-detail-value">${student.scholarshipType}</span>
                </div>
                <div class="payment-detail-row">
                    <span class="payment-detail-label">Payment Date</span>
                    <span class="payment-detail-value">${student.date}</span>
                </div>
            </div>
            
            <div class="payment-status-card">
                <div class="payment-status-row">
                    <span class="payment-status-label">Payment Status</span>
                    <div class="payment-status-badge-wrapper">
                        <div class="payment-status-checkmark">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <div class="payment-status-badge">PAID</div>
                    </div>
                </div>
                <div class="payment-success-message">
                    <p>🎉 Your contribution has been successfully received. Thank you!</p>
                </div>
            </div>
        </div>
    `;
    searchResults.classList.remove('hidden');
    searchResults.style.display = 'block';
}

// Updated displayNoResults function
function displayNoResults() {
    studentInfo.innerHTML = `
        <div class="no-results-container">
            <div class="no-results-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 48px; height: 48px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </div>
            <p class="no-results-title">No record found with that name or OR number.</p>
            <p class="no-results-description">Please check the spelling or try searching with your OR number.</p>
        </div>
    `;
    searchResults.classList.remove('hidden');
    searchResults.style.display = 'block';
}
// ============================================
// ADMIN PANEL FUNCTIONS
// ============================================

function renderStudentsTable(searchQuery = '') {
    const studentsToDisplay = searchQuery 
        ? students.filter(s => 
            s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.orNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.scholarshipType.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : students;

    if (studentsToDisplay.length === 0) {
        studentsTable.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 32px; text-align: center; color: #6b7280;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
                    <p style="font-weight: 700;">No students found</p>
                    <p style="font-size: 0.875rem;">Try adjusting your search</p>
                </td>
            </tr>
        `;
        return;
    }

    studentsTable.innerHTML = studentsToDisplay.map((student) => {
        const actualIndex = students.indexOf(student);
        
        return `
            <tr>
                <td style="padding: 16px 24px;">${student.orNumber}</td>
                <td style="padding: 16px 24px;">${student.firstName}</td>
                <td style="padding: 16px 24px;">${student.lastName}</td>
                <td style="padding: 16px 24px;">${student.date}</td>
                <td style="padding: 16px 24px;">${student.scholarshipType}</td>
                <td style="padding: 16px 24px;">
                    <span style="padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; background: #d1fae5; color: #065f46; border: 2px solid #10b981;">
                        ✓ PAID
                    </span>
                </td>
                <td style="padding: 16px 24px;">
                    <button onclick="editStudent(${actualIndex})" style="color: #2563eb; font-weight: 700; margin-right: 12px; cursor: pointer; background: none; border: none;">
                        ✏️ Edit
                    </button>
                    <button onclick="deleteStudent(${actualIndex})" style="color: #dc2626; font-weight: 700; cursor: pointer; background: none; border: none;">
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function saveStudent(e) {
    e.preventDefault();
    
    const editId = document.getElementById('editId').value;
    const receiptNo = document.getElementById('receiptNo');
    
    const student = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        fullName: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`.trim(),
        orNumber: receiptNo ? receiptNo.value : 'N/A',
        date: document.getElementById('date').value,
        scholarshipType: document.getElementById('scholarshipType').value,
        status: 'Paid'
    };

    if (editId !== '') {
        students[parseInt(editId)] = student;
        alert('✅ Student record updated!');
    } else {
        students.push(student);
        alert('✅ Student record added!');
    }

    clearForm();
    renderStudentsTable();
}

function editStudent(index) {
    const student = students[index];
    
    document.getElementById('editId').value = index;
    document.getElementById('firstName').value = student.firstName;
    document.getElementById('lastName').value = student.lastName;
    
    const receiptNo = document.getElementById('receiptNo');
    if (receiptNo) {
        receiptNo.value = student.orNumber;
    }
    
    document.getElementById('date').value = student.date;
    document.getElementById('scholarshipType').value = student.scholarshipType;
    
    cancelEdit.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteStudent(index) {
    const student = students[index];
    
    if (confirm(`⚠️ Are you sure you want to delete ${student.fullName}'s record?`)) {
        students.splice(index, 1);
        renderStudentsTable();
        alert('✅ Student record deleted!');
    }
}

function clearForm() {
    if (studentForm) {
        studentForm.reset();
        document.getElementById('editId').value = '';
        cancelEdit.classList.add('hidden');
    }
}

// Make functions available globally
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.performSearch = performSearch;

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Student Clearance System Starting...');
    
    // Initialize DOM elements
    heroSection = document.getElementById('heroSection');
    adminSection = document.getElementById('adminSection');
    adminBtn = document.getElementById('adminBtn');
    backToHome = document.getElementById('backToHome');
    searchInput = document.getElementById('searchInput');
    searchBtn = document.getElementById('searchBtn');
    searchResults = document.getElementById('searchResults');
    studentInfo = document.getElementById('studentInfo');
    studentForm = document.getElementById('studentForm');
    studentsTable = document.getElementById('studentsTable');
    cancelEdit = document.getElementById('cancelEdit');
    
    // Log element status
    console.log('Elements found:', {
        searchInput: !!searchInput,
        searchBtn: !!searchBtn,
        searchResults: !!searchResults,
        studentInfo: !!studentInfo
    });
    
    // Attach event listeners
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
    
    if (backToHome) {
        backToHome.addEventListener('click', showStudentView);
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Search button clicked!');
            performSearch();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('Enter pressed in search input');
                performSearch();
            }
        });
    }
    
    if (studentForm) {
        studentForm.addEventListener('submit', saveStudent);
    }
    
    if (cancelEdit) {
        cancelEdit.addEventListener('click', clearForm);
    }
    
    // Check for admin parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
        if (checkAuthentication()) {
            showAdminPanel();
        } else {
            window.location.href = 'login.html';
        }
    }
    
    // Load data
    console.log('📊 Attempting to connect to Google Sheets...');
    const success = await loadStudentsFromSheets();
    
    if (success) {
        console.log('✅ Google Sheets connection successful!');
    } else {
        console.log('⚠️ Using sample data.');
    }
    
    console.log('📝 Total students loaded:', students.length);
});

// Custom Alert Function
function customAlert(message, type = 'info') {
    // Remove any existing modals
    const existingModal = document.querySelector('.custom-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Determine icon based on type
    let icon = '';
    let title = '';
    
    switch(type) {
        case 'warning':
            icon = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>`;
            title = 'Attention Required';
            break;
        case 'success':
            icon = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
            title = 'Success';
            break;
        case 'error':
            icon = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
            title = 'Error';
            break;
        default:
            icon = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
            title = 'Information';
    }
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    
    // Create modal
    overlay.innerHTML = `
        <div class="custom-modal ${type}">
            <div class="custom-modal-icon">
                ${icon}
            </div>
            <div class="custom-modal-content">
                <h3 class="custom-modal-title">${title}</h3>
                <p class="custom-modal-message">${message}</p>
                <button class="custom-modal-button">OK</button>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(overlay);
    
    // Close modal on button click
    const button = overlay.querySelector('.custom-modal-button');
    button.addEventListener('click', () => {
        overlay.remove();
    });
    
    // Close modal on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
    
    // Close modal on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Usage examples:
// customAlert('Please enter your first name, last name, or OR number', 'warning');
// customAlert('Student record added successfully!', 'success');
// customAlert('Failed to connect to server', 'error');
// customAlert('This is an informational message', 'info');

// Replace all alert() calls in your code with customAlert()
// Example in performSearch():
// OLD: alert('Please enter your first name, last name, or OR number');
// NEW: customAlert('Please enter your first name, last name, or OR number', 'warning');