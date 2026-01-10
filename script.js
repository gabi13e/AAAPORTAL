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
        alert('Please enter your first name, last name, or OR number');
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

function displayMultipleMatches(matches) {
    studentInfo.innerHTML = `
        <div style="animation: fadeIn 0.4s ease;">
            <div style="background: #fef3c7; border: 3px solid #fbbf24; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <span style="font-size: 2rem; margin-right: 12px;">🔍</span>
                    <div>
                        <h3 style="font-size: 1.25rem; font-weight: 700; color: #92400e;">Multiple Records Found</h3>
                        <p style="color: #b45309; font-size: 0.875rem;">Found ${matches.length} students matching your search</p>
                    </div>
                </div>
                <p style="color: #b45309; margin-bottom: 16px; font-weight: 600;">Please select your record below:</p>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${matches.map((student) => {
                        const studentIndex = students.indexOf(student);
                        return `
                            <button onclick="selectStudent(${studentIndex})" 
                                    style="width: 100%; text-align: left; background: white; border: 2px solid #fbbf24; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.3s;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                    <div style="font-weight: 700; color: #111827; font-size: 1.125rem;">${student.fullName}</div>
                                    <span style="font-size: 0.75rem; font-family: monospace; background: #fef3c7; padding: 4px 8px; border-radius: 4px; border: 1px solid #fbbf24;">${student.orNumber}</span>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.875rem; color: #4b5563;">
                                    <div><span style="font-weight: 600;">Date:</span> ${student.date}</div>
                                    <div><span style="font-weight: 600;">Scholarship:</span> ${student.scholarshipType}</div>
                                </div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    searchResults.classList.remove('hidden');
    searchResults.style.display = 'block';
}

window.selectStudent = function(index) {
    displayStudentInfo(students[index]);
};

function displayStudentInfo(student) {
    studentInfo.innerHTML = `
        <div style="animation: fadeIn 0.4s ease;">
            <div style="background: linear-gradient(to bottom right, #d1fae5, #a7f3d0); border-radius: 16px; padding: 24px; border: 3px solid #10b981; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 2px solid #6ee7b7; margin-bottom: 16px;">
                    <span style="font-weight: 700; color: #374151; font-size: 1.125rem; display: flex; align-items: center;">
                        <span style="font-size: 2rem; margin-right: 12px;">✓</span>
                        Payment Verified
                    </span>
                    <span style="color: #065f46; font-family: monospace; font-size: 0.875rem; background: white; padding: 6px 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${student.orNumber}</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <span style="font-size: 0.875rem; color: #4b5563; font-weight: 600;">First Name</span>
                        <div style="color: #111827; font-weight: 700; font-size: 1.125rem;">${student.firstName}</div>
                    </div>
                    <div>
                        <span style="font-size: 0.875rem; color: #4b5563; font-weight: 600;">Last Name</span>
                        <div style="color: #111827; font-weight: 700; font-size: 1.125rem;">${student.lastName}</div>
                    </div>
                </div>
                <div style="background: white; border-radius: 12px; padding: 16px; border: 2px solid #6ee7b7; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.875rem; color: #4b5563; font-weight: 600;">Scholarship Type</span>
                        <span style="color: #111827; font-weight: 700;">${student.scholarshipType}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.875rem; color: #4b5563; font-weight: 600;">Payment Date</span>
                        <span style="color: #111827; font-weight: 700; font-size: 1.125rem;">${student.date}</span>
                    </div>
                </div>
                <div style="background: #d1fae5; border-radius: 12px; padding: 16px; border: 3px solid #10b981; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #374151; font-size: 1.125rem;">Payment Status</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 2rem;">✓</span>
                            <span style="padding: 12px 24px; border-radius: 9999px; font-weight: 700; color: #065f46; background: white; border: 2px solid #10b981; font-size: 1.125rem;">PAID</span>
                        </div>
                    </div>
                    <p style="font-size: 0.875rem; color: #065f46; margin-top: 12px; text-align: center; font-weight: 600;">
                        🎉 Your contribution has been successfully received. Thank you!
                    </p>
                </div>
            </div>
        </div>
    `;
    searchResults.classList.remove('hidden');
    searchResults.style.display = 'block';
}

function displayNoResults() {
    studentInfo.innerHTML = `
        <div style="background: #fee2e2; border: 3px solid #fca5a5; border-radius: 12px; padding: 24px; text-align: center; animation: fadeIn 0.4s ease; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="color: #dc2626; font-size: 3rem; margin-bottom: 12px;">✗</div>
            <p style="color: #b91c1c; font-weight: 700; font-size: 1.125rem;">No record found with that name or OR number.</p>
            <p style="color: #dc2626; font-size: 0.875rem; margin-top: 8px;">Please check the spelling or try searching with your OR number.</p>
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