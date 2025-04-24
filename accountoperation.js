// AccountOperation.js - Handles fetching and displaying account operations
let ACCOUNT_OP_API_URL = window.HIVE_API || 'https://api.hive.blog';
let ACCOUNT_OP_CDN_URL = window.HIVE_CDN || 'https://api.hive.blog';

// Store operations data
let operationsData = [];
let currentDisplayDay = 'all';  // Default to show all 7 days
let currentTypeFilter = 'all';  // Default to show all operation types
let currentUser = ''; // Current username being displayed

// Toggle account operations view
window.toggleAccountOperationsView = function() {
    console.log('Toggle account operations view clicked');
    const accountOpView = document.getElementById('accountOperationsView');
    const balanceContainer = document.getElementById('balanceContainer');
    const detailedBalance = document.getElementById('detailedBalance');
    const delegationView = document.getElementById('delegationView');
    const toggleButton = document.getElementById('toggleAccountOpBtn');
    
    // Check if account operations view is hidden
    if (accountOpView.style.display === 'none' || !accountOpView.style.display) {
        console.log('Showing account operations view');
        
        // Hide other views
        balanceContainer.classList.remove('active');
        balanceContainer.style.display = 'none';
        detailedBalance.classList.remove('active');
        detailedBalance.style.display = 'none';
        if (delegationView) {
            delegationView.classList.remove('active');
            delegationView.style.display = 'none';
        }
        
        // Reset other toggle buttons
        document.getElementById('toggleBalanceBtn').textContent = 'Show Detailed Balance';
        if (document.getElementById('toggleDelegationBtn')) {
            document.getElementById('toggleDelegationBtn').textContent = 'Show Delegations';
        }
        
        // Show account operations view
        accountOpView.style.display = 'block';
        setTimeout(() => {
            accountOpView.classList.add('active');
        }, 10);
        
        // Get username and fetch data
        const username = document.getElementById('usernameInput').value.trim();
        if (username) {
            fetchAccountOperations(username);
        }
        
        toggleButton.textContent = 'Hide Account Operations';
    } else {
        console.log('Hiding account operations view');
        
        // Hide account operations view
        accountOpView.classList.remove('active');
        accountOpView.style.display = 'none';
        
        // Show balance view
        balanceContainer.style.display = 'block';
        setTimeout(() => {
            balanceContainer.classList.add('active');
        }, 10);
        
        toggleButton.textContent = 'Show Account Operations';
    }
};

// Filter operations by specific day
window.filterOperationsByDay = function(day) {
    currentDisplayDay = day;
    
    // Update active button state
    const dayButtons = document.querySelectorAll('.account-op-day-button');
    dayButtons.forEach(button => {
        if (button.getAttribute('data-day') === day) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Re-render the operations with the filter
    updateAccountOpUI(operationsData, currentUser);
};

// Filter operations by type
window.filterOperationsByType = function(type) {
    currentTypeFilter = type;
    
    // Update active button state
    const typeButtons = document.querySelectorAll('.account-op-type-button');
    typeButtons.forEach(button => {
        if (button.getAttribute('data-type') === type) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Re-render the operations with the filter
    updateAccountOpUI(operationsData, currentUser);
};

// Toggle filter dropdown
window.toggleFilterDropdown = function() {
    const dropdown = document.getElementById('account-op-filter-dropdown');
    if (dropdown) {
        if (dropdown.style.display === 'none' || !dropdown.style.display) {
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    }
};

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
    const dropdown = document.getElementById('account-op-filter-dropdown');
    const filterBtn = document.getElementById('account-op-filter-btn');
    
    if (dropdown && filterBtn && !dropdown.contains(event.target) && !filterBtn.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

// Fetch account operations
async function fetchAccountOperations(username) {
    if (!username) {
        console.error('No username provided for account operations');
        return;
    }
    
    currentUser = username.toLowerCase();
    
    try {
        // Show loading state
        const accountOpContent = document.getElementById('accountOpContent');
        accountOpContent.innerHTML = '<div class="account-op-loading">Loading account operations...</div>';
        
        // Fetch account history
        const historyResponse = await fetch(`${ACCOUNT_OP_CDN_URL}`, {
            method: 'POST',
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_account_history',
                params: [username, -1, 1000],
                id: 1
            })
        });
        
        const historyData = await historyResponse.json();
        
        if (!historyData.result || !Array.isArray(historyData.result)) {
            throw new Error('Invalid account history data');
        }
        
        // Process operations data
        operationsData = historyData.result.map(item => {
            return {
                trxId: item[1].trx_id,
                block: item[1].block,
                timestamp: new Date(item[1].timestamp + 'Z'),
                opType: item[1].op[0],
                opData: item[1].op[1]
            };
        });
        
        // Sort by timestamp (newest first)
        operationsData.sort((a, b) => b.timestamp - a.timestamp);
        
        // Filter for only operations in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        operationsData = operationsData.filter(op => op.timestamp >= sevenDaysAgo);
        
        // Reset current display day to all
        currentDisplayDay = 'all';
        
        // Update UI
        updateAccountOpUI(operationsData, username);
        
    } catch (error) {
        console.error('Error fetching account operations:', error);
        const accountOpContent = document.getElementById('accountOpContent');
        accountOpContent.innerHTML = '<div class="account-op-error">Error loading account operations. Please try again.</div>';
    }
}

// Generate date buttons for the last 7 days
function generateDateButtons() {
    // Generate dates for last 7 days
    const dayLabels = ['Today', 'Yesterday'];
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        let label;
        if (i < 2) {
            label = dayLabels[i];
        } else {
            // Format as "Jul 20", "Jul 19", etc.
            label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        
        dates.push({
            date: date,
            label: label,
            value: i === 0 ? 'today' : 
                  i === 1 ? 'yesterday' : 
                  `day-${i}`
        });
    }
    
    let html = `
    <div class="account-op-days">
        <button class="account-op-day-button active" data-day="all" onclick="filterOperationsByDay('all')">All (7 days)</button>`;
    
    dates.forEach(dateObj => {
        html += `
        <button class="account-op-day-button" data-day="${dateObj.value}" onclick="filterOperationsByDay('${dateObj.value}')">${dateObj.label}</button>`;
    });
    
    html += `</div>`;
    
    return html;
}

// Generate operation type filter buttons
function generateTypeFilterButtons() {
    const filterTypes = [
        { label: 'All', value: 'all' },
        { label: 'In & Out', value: 'inout' },
        { label: 'In', value: 'in' },
        { label: 'Out', value: 'out' },
        { label: 'Comments', value: 'comments' },
        { label: 'Comments & Votes', value: 'comments_votes' },
        { label: 'Custom JSON', value: 'custom_json' },
        { label: 'Delegations', value: 'delegations' },
        { label: 'Downvotes (Flags)', value: 'downvotes' },
        { label: 'Escrow Related', value: 'escrow' },
        { label: 'Market Orders', value: 'market' },
        { label: 'Rewards', value: 'rewards' },
        { label: 'SPS Related', value: 'sps' }
    ];
    
    let html = `
    <div class="account-op-type-filters">
        <div class="account-op-filter-header">
            <button id="account-op-filter-btn" class="account-op-filter-button" onclick="toggleFilterDropdown()">
                Filter <span class="filter-icon">⚙️</span>
            </button>
            ${currentTypeFilter !== 'all' ? `<span class="active-filter-badge">Filter: ${filterTypes.find(f => f.value === currentTypeFilter)?.label || currentTypeFilter}</span>` : ''}
        </div>
        <div id="account-op-filter-dropdown" class="account-op-filter-dropdown" style="display:none">
            <div class="account-op-type-buttons">`;
    
    filterTypes.forEach(type => {
        html += `
            <button class="account-op-type-button ${type.value === currentTypeFilter ? 'active' : ''}" 
                    data-type="${type.value}" 
                    onclick="filterOperationsByType('${type.value}'); toggleFilterDropdown();">
                ${type.label}
            </button>`;
    });
    
    html += `
            </div>
        </div>
    </div>`;
    
    return html;
}

// Format friendly date
function formatOperationDate(date) {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
                    
    const isYesterday = date.getDate() === yesterday.getDate() && 
                        date.getMonth() === yesterday.getMonth() && 
                        date.getFullYear() === yesterday.getFullYear();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    // For other dates in the last 7 days
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Get day value for filtering
function getDayValueForDate(date) {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
                    
    const isYesterday = date.getDate() === yesterday.getDate() && 
                        date.getMonth() === yesterday.getMonth() && 
                        date.getFullYear() === yesterday.getFullYear();
    
    if (isToday) return 'today';
    if (isYesterday) return 'yesterday';
    
    // Calculate how many days ago
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `day-${diffDays}`;
}

// Format time
function formatOperationTime(date) {
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Toggle operation details
window.toggleOperationDetails = function(opId) {
    const detailsElement = document.getElementById(`op-details-${opId}`);
    if (detailsElement) {
        if (detailsElement.style.display === 'none' || !detailsElement.style.display) {
            detailsElement.style.display = 'block';
        } else {
            detailsElement.style.display = 'none';
        }
    }
};

// Determine if operation is incoming or outgoing
function getOperationDirection(op, username) {
    username = username.toLowerCase();
    
    switch (op.opType) {
        case 'transfer':
            return op.opData.to.toLowerCase() === username ? 'in' : 'out';
            
        case 'vote':
            return op.opData.voter.toLowerCase() === username ? 'out' : 'in';
            
        case 'comment':
            return op.opData.author.toLowerCase() === username ? 'out' : 'in';
            
        case 'claim_reward_balance':
            return 'in';
            
        case 'delegate_vesting_shares':
            return op.opData.delegator.toLowerCase() === username ? 'out' : 'in';
            
        case 'account_witness_vote':
            return 'out';
            
        case 'curation_reward':
        case 'author_reward':
        case 'producer_reward':
            return 'in';
            
        default:
            return 'neutral';
    }
}

// Get operation category for filtering
function getOperationCategory(op) {
    switch (op.opType) {
        case 'transfer':
            return ['transfer'];
            
        case 'vote':
            return ['vote', op.opData.weight < 0 ? 'downvotes' : 'votes'];
            
        case 'comment':
            return ['comments', 'content'];
            
        case 'claim_reward_balance':
            return ['rewards'];
            
        case 'delegate_vesting_shares':
            return ['delegations'];
            
        case 'account_witness_vote':
            return ['witness', 'governance'];
            
        case 'custom_json':
            return ['custom_json'];
            
        case 'limit_order_create':
        case 'limit_order_cancel':
            return ['market'];
            
        case 'escrow_transfer':
        case 'escrow_approve':
        case 'escrow_dispute':
        case 'escrow_release':
            return ['escrow'];
            
        case 'curation_reward':
        case 'author_reward':
        case 'producer_reward':
            return ['rewards'];
            
        default:
            // Check for SPS related operations
            if (op.opType.includes('sps') || 
                (op.opType === 'transfer' && 
                 (op.opData.memo && op.opData.memo.includes('SPS')))) {
                return ['sps'];
            }
            return ['other'];
    }
}

// Check if operation matches the selected filter
function operationMatchesFilter(op, username, filterType) {
    if (filterType === 'all') return true;
    
    const direction = getOperationDirection(op, username);
    const categories = getOperationCategory(op);
    
    switch (filterType) {
        case 'inout':
            return direction === 'in' || direction === 'out';
        case 'in':
            return direction === 'in';
        case 'out':
            return direction === 'out';
        case 'comments':
            return categories.includes('comments');
        case 'comments_votes':
            return categories.includes('comments') || categories.includes('vote');
        case 'custom_json':
            return categories.includes('custom_json');
        case 'delegations':
            return categories.includes('delegations');
        case 'downvotes':
            return categories.includes('downvotes');
        case 'escrow':
            return categories.includes('escrow');
        case 'market':
            return categories.includes('market');
        case 'rewards':
            return categories.includes('rewards');
        case 'sps':
            return categories.includes('sps');
        default:
            return true;
    }
}

// Get operation indicator icon
function getOperationIcon(op, username) {
    username = username.toLowerCase();
    const direction = getOperationDirection(op, username);
    let color = '#e2a3f8'; // Default pink for most operations
    let icon = '';
    
    // Determine icon based on operation type and direction
    if (op.opType === 'vote') {
        const weight = parseInt(op.opData.weight);
        const isIncoming = op.opData.voter.toLowerCase() !== username;
        
        // Set color based on vote weight, regardless of direction
        color = weight > 0 ? '#4ade80' : '#f87171'; // Green for upvotes, red for downvotes
        
        if (isIncoming) {
            // Incoming votes - symbol points toward user (left)
            icon = '◀'; // Enhanced left triangle arrow
        } else {
            // Outgoing votes - symbol points away from user (right)
            icon = '▶'; // Enhanced right triangle arrow
        }
    } else if (op.opType === 'transfer') {
        if (direction === 'in') {
            // Incoming transfers - symbol points toward user (left)
            icon = '◀'; // Enhanced left triangle arrow
            color = '#4ade80'; // Green
        } else {
            // Outgoing transfers - symbol points away from user (right)
            icon = '▶'; // Enhanced right triangle arrow
            color = '#f87171'; // Red
        }
    } else {
        // For other operations
        if (direction === 'in') {
            icon = '◀'; // Enhanced left triangle arrow
        } else if (direction === 'out') {
            icon = '▶'; // Enhanced right triangle arrow
        } else {
            icon = '◆'; // Diamond for neutral operations
        }
        
        // Special colors for rewards
        if (op.opType === 'claim_reward_balance' || 
            op.opType === 'curation_reward' || 
            op.opType === 'author_reward') {
            color = '#facc15'; // Yellow for rewards
        }
    }
    
    return `<span class="op-direction-icon" style="color: ${color}; font-size: 22px; font-weight: bold; text-shadow: 1px 1px 1px rgba(0,0,0,0.1);">${icon}</span>`;
}

// Get operation description with clickable links
function getOperationDescription(op) {
    switch (op.opType) {
        case 'transfer':
            return `Transferred ${op.opData.amount} to <a href="#" onclick="document.getElementById('usernameInput').value='${op.opData.to}';searchUser();return false;">@${op.opData.to}</a>`;
        
        case 'vote':
            const weight = parseFloat(op.opData.weight) / 100;
            const postUrl = `https://hive.blog/@${op.opData.author}/${op.opData.permlink}`;
            return `Voted <span style="font-weight:bold;">${weight.toFixed(2)}%</span> on <a href="${postUrl}" target="_blank">@${op.opData.author}/${op.opData.permlink}</a>`;
        
        case 'comment':
            if (!op.opData.parent_author) {
                const postUrl = `https://hive.blog/@${op.opData.author}/${op.opData.permlink}`;
                // Use title if available, otherwise use truncated permlink
                let postTitle = op.opData.title || op.opData.permlink;
                if (postTitle.length > 30) {
                    postTitle = postTitle.substring(0, 30) + '...';
                }
                return `Created a post: <a href="${postUrl}" target="_blank">${postTitle}</a>`;
            } else {
                const commentUrl = `https://hive.blog/@${op.opData.parent_author}/${op.opData.parent_permlink}#@${op.opData.author}/${op.opData.permlink}`;
                // Truncate long parent permlinks
                const shortParentPermlink = op.opData.parent_permlink.length > 20 ? 
                    op.opData.parent_permlink.substring(0, 20) + '...' : 
                    op.opData.parent_permlink;
                return `Commented on <a href="${commentUrl}" target="_blank">@${op.opData.parent_author}/${shortParentPermlink}</a>`;
            }
        
        case 'claim_reward_balance':
            return `Claimed rewards: ${op.opData.reward_hive || op.opData.reward_steem || ''} ${op.opData.reward_hbd || op.opData.reward_sbd || ''} ${op.opData.reward_vests || ''}`;
        
        case 'delegate_vesting_shares':
            return `Delegated ${op.opData.vesting_shares} to <a href="#" onclick="document.getElementById('usernameInput').value='${op.opData.delegatee}';searchUser();return false;">@${op.opData.delegatee}</a>`;
        
        case 'account_witness_vote':
            const approve = op.opData.approve ? 'Approved' : 'Unapproved';
            return `${approve} witness <a href="#" onclick="document.getElementById('usernameInput').value='${op.opData.witness}';searchUser();return false;">@${op.opData.witness}</a>`;
        
        default:
            return `${op.opType} operation`;
    }
}

// Get operation details for expanded view
function getOperationDetails(op) {
    let details = '<table class="op-details-table">';
    
    // Common details
    details += `<tr><td>Transaction ID</td><td><a href="https://hiveblocks.com/tx/${op.trxId}" target="_blank">${op.trxId}</a></td></tr>`;
    details += `<tr><td>Block</td><td><a href="https://hiveblocks.com/b/${op.block}" target="_blank">${op.block}</a></td></tr>`;
    
    // Operation-specific details
    switch (op.opType) {
        case 'transfer':
            details += `<tr><td>From</td><td>@${op.opData.from}</td></tr>`;
            details += `<tr><td>To</td><td>@${op.opData.to}</td></tr>`;
            details += `<tr><td>Amount</td><td>${op.opData.amount}</td></tr>`;
            if (op.opData.memo) {
                details += `<tr><td>Memo</td><td>${op.opData.memo}</td></tr>`;
            }
            break;
            
        case 'vote':
            details += `<tr><td>Voter</td><td>@${op.opData.voter}</td></tr>`;
            details += `<tr><td>Author</td><td>@${op.opData.author}</td></tr>`;
            details += `<tr><td>Weight</td><td>${(parseFloat(op.opData.weight) / 100).toFixed(2)}%</td></tr>`;
            details += `<tr><td>Post</td><td><a href="https://hive.blog/@${op.opData.author}/${op.opData.permlink}" target="_blank">View Post</a></td></tr>`;
            if (op.opData.permlink) {
                details += `<tr><td>Permlink</td><td><a href="https://hive.blog/@${op.opData.author}/${op.opData.permlink}" target="_blank">${op.opData.permlink}</a></td></tr>`;
            }
            break;
            
        case 'comment':
            details += `<tr><td>Author</td><td>@${op.opData.author}</td></tr>`;
            if (op.opData.parent_author) {
                details += `<tr><td>Replying to</td><td>@${op.opData.parent_author}</td></tr>`;
                details += `<tr><td>Link</td><td><a href="https://hive.blog/@${op.opData.parent_author}/${op.opData.parent_permlink}#@${op.opData.author}/${op.opData.permlink}" target="_blank">View Comment</a></td></tr>`;
                if (op.opData.permlink) {
                    details += `<tr><td>Permlink</td><td><a href="https://hive.blog/@${op.opData.author}/${op.opData.permlink}" target="_blank">${op.opData.permlink}</a></td></tr>`;
                }
            } else {
                if (op.opData.title) {
                    details += `<tr><td>Title</td><td>${op.opData.title}</td></tr>`;
                }
                details += `<tr><td>Link</td><td><a href="https://hive.blog/@${op.opData.author}/${op.opData.permlink}" target="_blank">View Post</a></td></tr>`;
                if (op.opData.permlink) {
                    details += `<tr><td>Permlink</td><td><a href="https://hive.blog/@${op.opData.author}/${op.opData.permlink}" target="_blank">${op.opData.permlink}</a></td></tr>`;
                }
            }
            break;
            
        case 'claim_reward_balance':
            if (op.opData.reward_hive || op.opData.reward_steem) {
                details += `<tr><td>HIVE</td><td>${op.opData.reward_hive || op.opData.reward_steem}</td></tr>`;
            }
            if (op.opData.reward_hbd || op.opData.reward_sbd) {
                details += `<tr><td>HBD</td><td>${op.opData.reward_hbd || op.opData.reward_sbd}</td></tr>`;
            }
            if (op.opData.reward_vests) {
                details += `<tr><td>VESTS</td><td>${op.opData.reward_vests}</td></tr>`;
            }
            break;
            
        case 'delegate_vesting_shares':
            details += `<tr><td>Delegator</td><td>@${op.opData.delegator}</td></tr>`;
            details += `<tr><td>Delegatee</td><td>@${op.opData.delegatee}</td></tr>`;
            details += `<tr><td>Amount</td><td>${op.opData.vesting_shares}</td></tr>`;
            break;
            
        default:
            // For other operation types, just list all properties
            Object.keys(op.opData).forEach(key => {
                let value = op.opData[key];
                
                // Make permlinks clickable
                if (key === 'permlink' && op.opData.author) {
                    value = `<a href="https://hive.blog/@${op.opData.author}/${op.opData.permlink}" target="_blank">${op.opData.permlink}</a>`;
                }
                
                details += `<tr><td>${key}</td><td>${value}</td></tr>`;
            });
    }
    
    details += '</table>';
    return details;
}

// Group operations by date
function groupOperationsByDate(operations) {
    const groups = {};
    
    operations.forEach(op => {
        const dateKey = formatOperationDate(op.timestamp);
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(op);
    });
    
    return groups;
}

// Update account operations UI
function updateAccountOpUI(operations, username) {
    const accountOpContent = document.getElementById('accountOpContent');
    
    // Apply day filter if not showing all days
    let filteredOperations = operations;
    if (currentDisplayDay !== 'all') {
        filteredOperations = operations.filter(op => getDayValueForDate(op.timestamp) === currentDisplayDay);
    }
    
    // Apply type filter if not showing all types
    if (currentTypeFilter !== 'all') {
        filteredOperations = filteredOperations.filter(op => 
            operationMatchesFilter(op, username, currentTypeFilter)
        );
    }
    
    const groupedOperations = groupOperationsByDate(filteredOperations);
    
    // Generate filter buttons
    const dateButtons = generateDateButtons();
    const typeFilterButtons = generateTypeFilterButtons();
    
    let html = `
    <div class="account-op-summary">
        <h3>Account Activity for @${username}</h3>
        <p>Last 7 days activity - ${filteredOperations.length} operations</p>
    </div>
    <div class="account-op-controls">
        ${dateButtons}
        ${typeFilterButtons}
    </div>`;
    
    // Operations by date
    const dateKeys = Object.keys(groupedOperations);
    
    if (dateKeys.length === 0) {
        html += `
        <div class="account-op-empty">
            <p>No operations found for the selected filters.</p>
        </div>`;
    } else {
        dateKeys.forEach(dateKey => {
            const dateOperations = groupedOperations[dateKey];
            
            html += `
            <div class="account-op-date-section">
                <h3 class="account-op-date">${dateKey}</h3>
                <div class="account-op-list">`;
            
            dateOperations.forEach((op, index) => {
                const opTime = formatOperationTime(op.timestamp);
                const opDescription = getOperationDescription(op);
                const opId = `${dateKey.replace(/\s/g, '')}-${index}`;
                const opIcon = getOperationIcon(op, username);
                
                html += `
                <div class="account-op-item">
                    <div class="account-op-icon">${opIcon}</div>
                    <div class="account-op-time">${opTime}</div>
                    <div class="account-op-type">${op.opType}</div>
                    <div class="account-op-description">${opDescription}</div>
                    <div class="account-op-expand">
                        <button onclick="toggleOperationDetails('${opId}')" class="op-expand-btn">
                            Details
                        </button>
                    </div>
                    <div id="op-details-${opId}" class="op-details" style="display: none;">
                        ${getOperationDetails(op)}
                    </div>
                </div>`;
            });
            
            html += `
                </div>
            </div>`;
        });
    }
    
    // Update the DOM
    accountOpContent.innerHTML = html;
    
    // Set active buttons
    const dayButtons = document.querySelectorAll('.account-op-day-button');
    dayButtons.forEach(button => {
        if (button.getAttribute('data-day') === currentDisplayDay) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    const typeButtons = document.querySelectorAll('.account-op-type-button');
    typeButtons.forEach(button => {
        if (button.getAttribute('data-type') === currentTypeFilter) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Initialize account operations view on DOM load
document.addEventListener('DOMContentLoaded', function() {
    console.log('AccountOperation.js loaded');
    
    // Create account operations view container if it doesn't exist
    if (!document.getElementById('accountOperationsView')) {
        const statsContainer = document.getElementById('statsContainer');
        const accountOpView = document.createElement('div');
        accountOpView.id = 'accountOperationsView';
        accountOpView.className = 'account-op-container';
        accountOpView.style.display = 'none';
        
        accountOpView.innerHTML = `
            <h2 class="account-op-title">Account Operations</h2>
            <div id="accountOpContent" class="account-op-content">
                <div class="account-op-loading">Please search for a user first</div>
            </div>
        `;
        
        // Add to the page
        if (statsContainer) {
            // Insert before the footer
            const footer = statsContainer.querySelector('.footer');
            statsContainer.insertBefore(accountOpView, footer);
        }
    }
    
    // Create account operations button if it doesn't exist
    if (!document.getElementById('toggleAccountOpBtn')) {
        const balanceToggle = document.querySelector('.balance-toggle');
        if (balanceToggle) {
            const accountOpBtn = document.createElement('button');
            accountOpBtn.id = 'toggleAccountOpBtn';
            accountOpBtn.className = 'toggle-button';
            accountOpBtn.setAttribute('onclick', 'toggleAccountOperationsView()');
            accountOpBtn.textContent = 'Show Account Operations';
            
            balanceToggle.appendChild(accountOpBtn);
        }
    }
}); 