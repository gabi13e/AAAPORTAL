// ============================================
// GOOGLE SHEETS CONFIGURATION
// ============================================

const GOOGLE_SHEETS_CONFIG = {
    SHEET_ID: '1lQdjiJva9PDbCP-6zaoIix0Nls2QFXIX2rHo10iQlHo',  
    API_KEY: 'AIzaSyBWZvwamQd4a112gPHiBEb1ciJ9WDfOH2I',
    MEMBERSHIP_SHEET:   'MEMBERSHIP FEE',
    SCHOLARS_DAY_SHEET: "SCHOLAR'S DAY FEE",
    CELL_RANGE: 'A:H'
};

// ============================================
// DATABASE (Loaded from Google Sheets)
// ============================================

let membershipStudents = [];
let scholarsDayStudents = [];
let students = []; // combined / used for admin table
let isLoading = false;

// ============================================
// DOM ELEMENTS
// ============================================

let heroSection, adminSection, adminBtn, backToHome, homeBtn;
let searchInput, searchBtn, searchResults, studentInfo;
let studentForm, studentsTable, cancelEdit;

// ============================================
// AUTHENTICATION
// ============================================

function checkAuthentication() {
    const session = localStorage.getItem('adminSession') || sessionStorage.getItem('adminSession');
    if (session) {
        try {
            const data = JSON.parse(session);
            return data.isLoggedIn === true;
        } catch (e) { return false; }
    }
    return false;
}

function logout() {
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminSession');
    showStudentView();
    showToast('Logged out successfully', '#3b82f6');
}

// ============================================
// GOOGLE SHEETS API
// ============================================

async function fetchSheet(sheetName) {
    // Wrap sheet name in single quotes if it contains spaces or apostrophes
    // For the Sheets API, apostrophes in sheet names must be escaped as ''
    const escapedName = sheetName.replace(/'/g, "''");
    const range = `'${escapedName}'!${GOOGLE_SHEETS_CONFIG.CELL_RANGE}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.SHEET_ID}/values/${encodeURIComponent(range)}?key=${GOOGLE_SHEETS_CONFIG.API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
    }
    return response.json();
}

function parseRows(data, feeLabel) {
    if (!data.values || data.values.length < 2) return [];
    return data.values.slice(1)
        .filter(row => row[0])
        .map(row => ({
            idNumber:       (row[0] || '').trim(),
            receiptNumber:  (row[1] || 'N/A').trim(),
            lastName:       (row[2] || '').trim(),
            firstName:      (row[3] || '').trim(),
            date:           (row[4] || 'N/A').trim(),
            scholarshipType:(row[5] || 'N/A').trim(),
            fee:            (row[6] || 'N/A').trim(),
            feeLabel:       feeLabel
        }));
}

async function loadStudentsFromSheets() {
    isLoading = true;
    showToast('Loading student data...', '#3b82f6', 99999);

    try {
        const [memData, sdData] = await Promise.all([
            fetchSheet(GOOGLE_SHEETS_CONFIG.MEMBERSHIP_SHEET),
            fetchSheet(GOOGLE_SHEETS_CONFIG.SCHOLARS_DAY_SHEET)
        ]);

        membershipStudents  = parseRows(memData,  'Membership Fee');
        scholarsDayStudents = parseRows(sdData,   "Scholar's Day Fee");
        students = [...membershipStudents, ...scholarsDayStudents];

        console.log(`✅ Loaded ${membershipStudents.length} membership + ${scholarsDayStudents.length} scholar's day records`);
        hideToast();

        if (adminSection && adminSection.style.display !== 'none') {
            renderStudentsTable();
        }
        return true;
    } catch (error) {
        console.error('❌ Error loading from Google Sheets:', error.message);
        console.error('Full error:', error);
        loadSampleData();
        hideToast();
        showToast(`Connection error: ${error.message}`, '#ef4444', 7000);
        return false;
    } finally {
        isLoading = false;
    }
}

function loadSampleData() {
    membershipStudents = [
        { idNumber:'2023-001', receiptNumber:'1', lastName:'Dela Cruz', firstName:'Juan', date:'2025-01-01', scholarshipType:'Academic Scholar', fee:'25', feeLabel:'Membership Fee' },
        { idNumber:'2023-002', receiptNumber:'2', lastName:'Santos',    firstName:'Maria',date:'2025-01-02', scholarshipType:'Sports Scholar',    fee:'25', feeLabel:'Membership Fee' },
    ];
    scholarsDayStudents = [
        { idNumber:'2023-001', receiptNumber:'5', lastName:'Dela Cruz', firstName:'Juan', date:'2025-02-10', scholarshipType:'Academic Scholar', fee:'50', feeLabel:"Scholar's Day Fee" },
    ];
    students = [...membershipStudents, ...scholarsDayStudents];
}

// ============================================
// NAVIGATION
// ============================================

function showAdminPanel() {
    if (!checkAuthentication()) { window.location.href = 'login.html'; return; }
    heroSection.style.display = 'none';
    adminSection.style.display = 'block';
    renderStudentsTable();
    addLogoutButton();
}

function showStudentView() {
    adminSection.style.display = 'none';
    heroSection.style.display = 'block';
    if (searchResults) {
        searchResults.style.display = 'none';
    }
    clearForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addLogoutButton() {
    if (document.getElementById('logoutBtn')) return;
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'nav-btn';
    logoutBtn.style.cssText = 'background:#dc2626;color:#fff;margin-left:12px;';
    logoutBtn.innerHTML = '🚪 Logout';
    logoutBtn.addEventListener('click', logout);
    backToHome.parentElement.insertBefore(logoutBtn, backToHome.nextSibling);
}

// ============================================
// TOAST HELPERS
// ============================================

let toastEl = null;
let toastTimer = null;

function showToast(message, color = '#3b82f6', duration = 3000) {
    hideToast();
    toastEl = document.createElement('div');
    toastEl.id = 'toastMessage';
    toastEl.style.cssText = `position:fixed;top:20px;right:20px;background:${color};color:#fff;padding:16px 24px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.15);z-index:10000;font-weight:600;`;
    toastEl.textContent = message;
    document.body.appendChild(toastEl);
    if (duration < 99999) {
        toastTimer = setTimeout(hideToast, duration);
    }
}

function hideToast() {
    if (toastTimer) clearTimeout(toastTimer);
    if (toastEl) { toastEl.remove(); toastEl = null; }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function performSearch() {
    if (!searchInput) return;

    const query = searchInput.value.trim();

    if (!query) {
        customAlert('Please enter your ID Number to search.', 'warning');
        return;
    }

    // Validate: only allow ID number searches (digits, dashes)
    // Accept anything that looks like an ID number
    const queryLower = query.toLowerCase();

    // Find all matching records across BOTH sheets by ID number only
    const memMatches = membershipStudents.filter(s => s.idNumber.toLowerCase() === queryLower);
    const sdMatches  = scholarsDayStudents.filter(s => s.idNumber.toLowerCase() === queryLower);

    // Show button loading state
    searchBtn.innerHTML = `<span>Searching...</span>`;
    searchBtn.disabled = true;

    setTimeout(() => {
        searchBtn.innerHTML = `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <span>Search Payment</span>`;
        searchBtn.disabled = false;

        if (memMatches.length === 0 && sdMatches.length === 0) {
            displayNoResults(query);
        } else {
            displayStudentInfo(query, memMatches, sdMatches);
        }
    }, 300);
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

function displayStudentInfo(idNumber, memMatches, sdMatches) {

    // Use the ID number exactly as stored in the sheet (preserves dashes)
    const displayId = (memMatches[0] || sdMatches[0])?.idNumber || idNumber;

    // Build fee card rows
    const buildRows = (matches, feeLabel, borderColor, bgColor, textColor) => {
        if (matches.length === 0) return '';
        return matches.map(m => `
            <div style="background:${bgColor};border:2px solid ${borderColor};border-radius:16px;padding:20px;margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
                    <span style="font-weight:800;color:${textColor};font-size:1.05rem;">${feeLabel}</span>
                    <span style="font-family:monospace;font-weight:700;background:#fff;padding:6px 14px;border-radius:10px;border:2px solid ${borderColor};color:${textColor};font-size:0.9rem;">
                        Receipt #${m.receiptNumber}
                    </span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div>
                        <div style="font-size:0.8rem;font-weight:600;color:${textColor};opacity:0.7;margin-bottom:2px;">Date</div>
                        <div style="font-weight:700;color:${textColor};">${m.date}</div>
                    </div>
                    <div>
                        <div style="font-size:0.8rem;font-weight:600;color:${textColor};opacity:0.7;margin-bottom:2px;">Scholarship Type</div>
                        <div style="font-weight:700;color:${textColor};">${m.scholarshipType}</div>
                    </div>
                    <div>
                        <div style="font-size:0.8rem;font-weight:600;color:${textColor};opacity:0.7;margin-bottom:2px;">Amount Paid</div>
                        <div style="font-weight:800;color:${textColor};font-size:1.1rem;">₱ ${m.fee}</div>
                    </div>
                    <div>
                        <div style="font-size:0.8rem;font-weight:600;color:${textColor};opacity:0.7;margin-bottom:2px;">Status</div>
                        <div style="font-weight:800;color:${textColor};">✓ PAID</div>
                    </div>
                </div>
            </div>
        `).join('');
    };

    const membershipHTML  = buildRows(memMatches, 'Membership Fee',    '#2563EB', '#EFF6FF', '#1E3A8A');
    const scholarsDayHTML = buildRows(sdMatches,  "Scholar's Day Fee", '#DC2626', '#FEF2F2', '#7F1D1D');

    // Not-paid placeholder cards
    const memNotPaid = `
        <div style="background:#EFF6FF;border:2px dashed #2563EB;border-radius:16px;padding:20px;margin-bottom:12px;text-align:center;">
            <div style="font-size:1.5rem;margin-bottom:6px;"></div>
            <div style="font-weight:800;color:#1E3A8A;margin-bottom:4px;">Membership Fee</div>
            <div style="color:#3B82F6;font-size:0.9rem;">No payment record found</div>
        </div>`;
    const sdNotPaid = `
        <div style="background:#FEF2F2;border:2px dashed #DC2626;border-radius:16px;padding:20px;margin-bottom:12px;text-align:center;">
            <div style="font-size:1.5rem;margin-bottom:6px;"></div>
            <div style="font-weight:800;color:#7F1D1D;margin-bottom:4px;">Scholar's Day Fee</div>
            <div style="color:#EF4444;font-size:0.9rem;">No payment record found</div>
        </div>`;

    // Determine overall status
    const bothPaid   = memMatches.length > 0 && sdMatches.length > 0;
    const partialPaid = (memMatches.length > 0) !== (sdMatches.length > 0); // XOR — only one paid
    const missingFee  = memMatches.length === 0
        ? 'Membership Fee'
        : "Scholar's Day Fee";

    const overallStatusCard = bothPaid ? `
        <div class="payment-status-card">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <span class="payment-status-label">Overall Status</span>
                <div class="payment-status-badge-wrapper">
                    <div class="payment-status-checkmark">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:20px;height:20px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <div class="payment-status-badge">FULLY PAID</div>
                </div>
            </div>
            <div class="payment-success-message" style="margin-top:12px;">
                <p>🎉 All contributions have been successfully received. Thank you!</p>
            </div>
        </div>
    ` : `
        <div style="background:#FFFBEB;border:3px solid #F59E0B;border-radius:20px;padding:24px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
                <span style="font-weight:800;color:#92400E;font-size:1.1rem;">Overall Status</span>
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:1.3rem;">⚠️</span>
                    <span style="background:#FEF3C7;border:2px solid #F59E0B;padding:10px 22px;border-radius:999px;font-weight:800;color:#92400E;font-size:1rem;">INCOMPLETE</span>
                </div>
            </div>
            <div style="background:#FEF3C7;border-radius:12px;padding:14px;text-align:center;">
                <p style="font-size:0.9rem;color:#92400E;font-weight:600;margin:0;">
                    ⚠️ <strong>${missingFee}</strong> has not been paid yet. Please settle your remaining balance.
                </p>
            </div>
        </div>
    `;

    studentInfo.innerHTML = `
        <div class="payment-verified-container">
            <!-- Header -->
            <div class="payment-verified-header">
                <div class="payment-verified-badge">
                    <div class="payment-verified-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:24px;height:24px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <span>Record Found</span>
                </div>
                <div class="payment-receipt-number">ID: ${displayId}</div>
            </div>

            <!-- Fee Records -->
            <div style="margin-bottom:16px;">
                <div style="font-weight:700;color:#065F46;margin-bottom:12px;font-size:0.95rem;">📋 Payment Records</div>
                ${membershipHTML  || memNotPaid}
                ${scholarsDayHTML || sdNotPaid}
            </div>

            <!-- Overall Status -->
            ${overallStatusCard}
        </div>
    `;

    searchResults.style.display = 'block';
    searchResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function displayNoResults(query) {
    studentInfo.innerHTML = `
        <div class="no-results-container">
            <div class="no-results-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:48px;height:48px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </div>
            <p class="no-results-title">No record found for ID: "${query}"</p>
            <p class="no-results-description">Please double-check your ID Number and try again.</p>
        </div>
    `;
    searchResults.style.display = 'block';
}

// ============================================
// ADMIN PANEL FUNCTIONS
// ============================================

function renderStudentsTable(searchQuery = '') {
    const query = searchQuery.toLowerCase();
    const toDisplay = query
        ? students.filter(s =>
            s.idNumber.toLowerCase().includes(query) ||
            s.lastName.toLowerCase().includes(query) ||
            s.firstName.toLowerCase().includes(query) ||
            s.receiptNumber.toLowerCase().includes(query) ||
            s.scholarshipType.toLowerCase().includes(query) ||
            s.feeLabel.toLowerCase().includes(query)
          )
        : students;

    if (toDisplay.length === 0) {
        studentsTable.innerHTML = `
            <tr><td colspan="8" style="padding:32px;text-align:center;color:#6b7280;">
                <div style="font-size:2rem;margin-bottom:8px;">🔍</div>
                <p style="font-weight:700;">No records found</p>
            </td></tr>`;
        return;
    }

    studentsTable.innerHTML = toDisplay.map((s) => {
        const idx = students.indexOf(s);
        const sheetTag = s.feeLabel === 'Membership Fee'
            ? `<span style="background:#EFF6FF;color:#1E3A8A;padding:2px 8px;border-radius:6px;font-size:0.75rem;font-weight:700;border:1px solid #2563EB;">MEM</span>`
            : `<span style="background:#FEF2F2;color:#7F1D1D;padding:2px 8px;border-radius:6px;font-size:0.75rem;font-weight:700;border:1px solid #DC2626;">SD</span>`;
        return `
            <tr>
                <td style="padding:16px 24px;">${s.idNumber}</td>
                <td style="padding:16px 24px;">${s.receiptNumber}</td>
                <td style="padding:16px 24px;">${s.lastName}</td>
                <td style="padding:16px 24px;">${s.firstName}</td>
                <td style="padding:16px 24px;">${s.date}</td>
                <td style="padding:16px 24px;">${s.scholarshipType}</td>
                <td style="padding:16px 24px;">${sheetTag} ₱${s.fee}</td>
                <td style="padding:16px 24px;">
                    <span style="padding:4px 12px;border-radius:9999px;font-size:0.75rem;font-weight:700;background:#d1fae5;color:#065f46;border:2px solid #10b981;">✓ PAID</span>
                </td>
            </tr>`;
    }).join('');
}

function clearForm() {
    if (studentForm) {
        studentForm.reset();
        document.getElementById('editId').value = '';
        if (cancelEdit) cancelEdit.classList.add('hidden');
    }
}

window.performSearch = performSearch;

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', async () => {
    heroSection    = document.getElementById('heroSection');
    adminSection   = document.getElementById('adminSection');
    adminBtn       = document.getElementById('adminBtn');
    backToHome     = document.getElementById('backToHome');
    homeBtn        = document.getElementById('homeBtn');
    searchInput    = document.getElementById('searchInput');
    searchBtn      = document.getElementById('searchBtn');
    searchResults  = document.getElementById('searchResults');
    studentInfo    = document.getElementById('studentInfo');
    studentForm    = document.getElementById('studentForm');
    studentsTable  = document.getElementById('studentsTable');
    cancelEdit     = document.getElementById('cancelEdit');

    // Update placeholder text
    if (searchInput) {
        searchInput.placeholder = 'Enter your ID Number (e.g. 2023-2445)...';
    }

    // Update search header text
    const searchHeaderP = document.querySelector('.search-header p');
    if (searchHeaderP) searchHeaderP.textContent = 'Enter your ID Number to check payment status';

    // Event listeners
    if (adminBtn)    adminBtn.addEventListener('click', () => window.location.href = 'login.html');
    if (backToHome)  backToHome.addEventListener('click', showStudentView);
    if (homeBtn)     homeBtn.addEventListener('click', showStudentView);

    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => { e.preventDefault(); performSearch(); });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); performSearch(); }
        });
    }

    if (studentForm) studentForm.addEventListener('submit', (e) => { e.preventDefault(); });
    if (cancelEdit)  cancelEdit.addEventListener('click', clearForm);

    // Admin search
    const adminSearchInput = document.getElementById('adminSearchInput');
    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', () => renderStudentsTable(adminSearchInput.value));
    }

    initScrollZoom();

    // Check for admin param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true' && checkAuthentication()) {
        showAdminPanel();
    }

    // Load data from both sheets
    await loadStudentsFromSheets();
});

// ============================================
// SCROLL ZOOM EFFECT
// ============================================

function initScrollZoom() {
    const searchCard = document.querySelector('.search-card');
    if (!searchCard) return;

    window.addEventListener('scroll', () => {
        if (searchResults && searchResults.style.display === 'block') {
            searchCard.style.transform = 'scale(1)';
            searchCard.style.opacity   = '1';
            return;
        }
        const cardRect     = searchCard.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const cardCenter   = cardRect.top + cardRect.height / 2;
        const distFromCenter = Math.abs(cardCenter - windowHeight / 2);
        const maxDistance    = windowHeight / 2 + cardRect.height / 2;
        const ratio          = 1 - distFromCenter / maxDistance;

        if (cardRect.top < windowHeight && cardRect.bottom > 0) {
            searchCard.style.transform = `scale(${Math.max(0.95, Math.min(1.05, 0.95 + ratio * 0.1))})`;
            searchCard.style.opacity   = Math.max(0.7, Math.min(1, 0.7 + ratio * 0.3));
        } else {
            searchCard.style.transform = 'scale(0.95)';
            searchCard.style.opacity   = '0.7';
        }
    });
    window.dispatchEvent(new Event('scroll'));
}

// ============================================
// CUSTOM ALERT MODAL
// ============================================

function customAlert(message, type = 'info') {
    const existing = document.querySelector('.custom-modal-overlay');
    if (existing) existing.remove();

    const icons = {
        warning: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
        success: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
        error:   `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
        info:    `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
    };
    const titles = { warning:'Attention Required', success:'Success', error:'Error', info:'Information' };

    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
        <div class="custom-modal ${type}">
            <div class="custom-modal-icon">${icons[type] || icons.info}</div>
            <div class="custom-modal-content">
                <h3 class="custom-modal-title">${titles[type] || 'Notice'}</h3>
                <p class="custom-modal-message">${message}</p>
                <button class="custom-modal-button">OK</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.custom-modal-button').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
    });
}