// ======================================
// CONFIGURATION - EDIT THESE VALUES
// ======================================

// Your Google Sheet ID (extract from URL: docs.google.com/spreadsheets/d/[SHEET_ID]/edit)
const SHEET_ID = '1T5JvxVPCYId0Gz6NBY-C6oUTY_M_JjQk-aJD1Jt0ReM';

// Your sheet/tab name (default is 'Sheet1')
const SHEET_NAME = 'QuizBowl';

// Auto-refresh interval in milliseconds (30000 = 30 seconds)
const REFRESH_INTERVAL = 30000;

// ======================================
// DO NOT EDIT BELOW THIS LINE
// ======================================

let autoRefreshInterval = null;

// Load leaderboard on page load
document.addEventListener('DOMContentLoaded', function() {
    loadLeaderboard();
    startAutoRefresh();
});

// Function to load leaderboard from Google Sheets
async function loadLeaderboard() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const rankingsContainer = document.getElementById('rankingsContainer');
    const lastUpdated = document.getElementById('lastUpdated');
    const totalTeams = document.getElementById('totalTeams');
    
    // Show loading state
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    rankingsContainer.innerHTML = '';
    lastUpdated.style.display = 'none';
    
    // Validate Sheet ID
    if (!SHEET_ID || SHEET_ID === 'YOUR_SHEET_ID_HERE') {
        showError('Please configure your Google Sheet ID in script.js');
        return;
    }
    
    try {
        // Construct the Google Sheets API URL for CSV export
        const apiUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch data. Make sure the sheet is publicly accessible (Anyone with link can view).');
        }
        
        const csvText = await response.text();
        const contestants = parseCSV(csvText);
        
        if (contestants.length === 0) {
            showError('No data found in the sheet. Please check your sheet name and ensure it has data.');
            return;
        }
        
        // Sort contestants by score (highest first) and assign ranks
        const sortedContestants = sortAndRankTeams(contestants);
        
        // Display the leaderboard
        displayLeaderboard(sortedContestants);
        
        // Update statistics
        totalTeams.textContent = sortedContestants.length;
        
        // Update last updated time
        const now = new Date();
        lastUpdated.innerHTML = `<i>Last updated: ${now.toLocaleTimeString()}</i>`;
        lastUpdated.style.display = 'block';
        
        loadingState.style.display = 'none';
        
    } catch (error) {
        showError(`${error.message}`);
        console.error('Error:', error);
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const contestants = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = parseCSVLine(line);
        if (columns.length < 2) continue;

        const contestantName = columns[1]?.trim();
        const scholarshipProgram = columns[2]?.trim() || '';

        // OVERALL TOTAL is last column
        const scoreIndex = columns.length - 1;
        const score = Number(columns[scoreIndex]) || 0;

        if (contestantName) {
            contestants.push({
                contestantName,
                scholarshipProgram,
                score
            });
        }
    }

    return contestants;
}


// Parse a single CSV line (handles quotes)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result.map(item => item.replace(/^"|"$/g, ''));
}

// Function to sort contestants by score and assign ranks
function sortAndRankTeams(contestants) {
    const hasAnyScore = contestants.some(c => c.score > 0);

    if (!hasAnyScore) {
        // Alphabetical order when no one has scored yet
        contestants.sort((a, b) =>
            a.contestantName.localeCompare(b.contestantName)
        );

        contestants.forEach(c => c.rank = '-');
        return contestants;
    }

    // Normal ranking by score
    contestants.sort((a, b) => b.score - a.score);

    let currentRank = 1;
    for (let i = 0; i < contestants.length; i++) {
        if (i > 0 && contestants[i].score < contestants[i - 1].score) {
            currentRank = i + 1;
        }
        contestants[i].rank = currentRank;
    }

    return contestants;
}


// Function to display leaderboard
function displayLeaderboard(contestants) {
    const container = document.getElementById('rankingsContainer');
    container.innerHTML = '';
    
    // Create vertical container
    const verticalContainer = document.createElement('div');
    verticalContainer.className = 'rankings-container';
    
    contestants.forEach((contestant, index) => {
        const rankClass = `rank-${contestant.rank}`;
        // Only show trophy icons for ranks 1, 2, and 3
       const trophyIcon =
    contestant.score > 0
        ? contestant.rank === 1 ? '🥇'
        : contestant.rank === 2 ? '🥈'
        : contestant.rank === 3 ? '🥉'
        : ''
        : '';

        const rankItem = document.createElement('div');
        rankItem.className = `rank-item ${rankClass}`;
        rankItem.style.animationDelay = `${index * 0.05}s`;
        
        rankItem.innerHTML = `
            <div class="rank-number">
                ${trophyIcon ? `<div class="trophy-icon">${trophyIcon}</div>` : ''}
                <div>${contestant.rank}</div>
            </div>
            <div class="team-info">
                <div class="team-name">${contestant.contestantName}</div>
                ${contestant.scholarshipProgram ? `<div class="team-details">${contestant.scholarshipProgram}</div>` : ''}
            </div>
          <div class="score-badge">
    <div class="score-value">${contestant.score > 0 ? contestant.score : '—'}</div>
    <div class="score-label">PTS</div>
</div>


        `;
        
        verticalContainer.appendChild(rankItem);
    });
    
    container.appendChild(verticalContainer);
}

// Function to show error message
function showError(message) {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    errorMessage.textContent = message;
}

// Function to start auto-refresh
function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    autoRefreshInterval = setInterval(loadLeaderboard, REFRESH_INTERVAL);
}

// Clear auto-refresh on page unload
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});

const scoreBadge = rankItem.querySelector('.score-badge');

setTimeout(() => {
    scoreBadge.classList.add('score-update');
    setTimeout(() => scoreBadge.classList.remove('score-update'), 350);
}, 50);
