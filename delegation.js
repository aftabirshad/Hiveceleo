// Delegation.js - Handles delegation data fetching and display
// Access API endpoints from script.js but use different variable names to avoid conflicts
let DELEGATION_API_URL = window.HIVE_API || 'https://api.hive.blog';
let DELEGATION_CDN_URL = window.HIVE_CDN || 'https://api.hive.blog';

// Store delegations data
let delegationsData = {
    incoming: [],
    outgoing: []
};

// Format delegation amount from vests to readable HP
function formatVestsToHP(vests, vestToHive) {
    if (!vests || !vestToHive) return '0.000';
    const vestsValue = parseFloat(vests.split(' ')[0]);
    const hpValue = vestsValue * vestToHive;
    return hpValue.toFixed(3);
}

// Format date to readable format
function formatDate(dateString) {
    const date = new Date(dateString + 'Z');
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Toggle delegation view
window.toggleDelegationView = function() {
    console.log('Toggle delegation view clicked');
    const delegationView = document.getElementById('delegationView');
    const balanceContainer = document.getElementById('balanceContainer');
    const detailedBalance = document.getElementById('detailedBalance');
    const toggleButton = document.getElementById('toggleDelegationBtn');
    
    // Check if delegation view is hidden
    if (delegationView.style.display === 'none' || !delegationView.style.display) {
        console.log('Showing delegation view');
        
        // Hide other views
        balanceContainer.classList.remove('active');
        balanceContainer.style.display = 'none';
        detailedBalance.classList.remove('active');
        detailedBalance.style.display = 'none';
        
        // Reset other toggle buttons
        document.getElementById('toggleBalanceBtn').textContent = 'Show Detailed Balance';
        
        // Show delegation view
        delegationView.style.display = 'block';
        setTimeout(() => {
            delegationView.classList.add('active');
        }, 10);
        
        // Get username and fetch data
        const username = document.getElementById('usernameInput').value.trim();
        if (username) {
            fetchDelegations(username);
        }
        
        toggleButton.textContent = 'Hide Delegations';
    } else {
        console.log('Hiding delegation view');
        
        // Hide delegation view
        delegationView.classList.remove('active');
        delegationView.style.display = 'none';
        
        // Show balance view
        balanceContainer.style.display = 'block';
        setTimeout(() => {
            balanceContainer.classList.add('active');
        }, 10);
        
        toggleButton.textContent = 'Show Delegations';
    }
};

// Deduplicate delegations based on delegator
function removeDuplicateDelegations(delegations) {
    const uniqueDelegations = [];
    const seen = new Set();
    
    delegations.forEach(delegation => {
        // For outgoing, key is delegatee
        // For incoming, key is delegator
        const key = delegation.delegator || delegation.delegatee;
        
        if (!seen.has(key)) {
            seen.add(key);
            uniqueDelegations.push(delegation);
        }
    });
    
    return uniqueDelegations;
}

// Fetch delegations data
async function fetchDelegations(username) {
    if (!username) {
        console.error('No username provided for delegation data');
        return;
    }
    
    try {
        // Show loading state
        const delegationContent = document.getElementById('delegationContent');
        delegationContent.innerHTML = '<div class="delegation-loading">Loading delegations data...</div>';
        
        // Get vest to hive conversion rate
        const globalData = await getGlobalDataForDelegation();
        const globals = globalData.result;
        const vestToHive = parseFloat(globals.total_vesting_fund_hive.split(' ')[0]) / 
                         parseFloat(globals.total_vesting_shares.split(' ')[0]);
        
        // Get outgoing delegations - these are easier to get
        const outgoingResponse = await fetch(`${DELEGATION_CDN_URL}`, {
            method: 'POST',
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_vesting_delegations',
                params: [username, '', 1000],
                id: 1
            })
        });
        const outgoingData = await outgoingResponse.json();
        delegationsData.outgoing = outgoingData.result || [];
        
        // Get account information to check if there are any received delegations
        const accountResponse = await fetch(`${DELEGATION_API_URL}`, {
            method: 'POST',
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_accounts',
                params: [[username]],
                id: 1
            })
        });
        const accountData = await accountResponse.json();
        
        // Try getting delegation history for incoming delegations
        try {
            const historyResponse = await fetch(`${DELEGATION_API_URL}`, {
                method: 'POST', 
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'condenser_api.get_account_history',
                    params: [username, -1, 1000],
                    id: 1
                })
            });
            
            const historyData = await historyResponse.json();
            if (historyData && historyData.result && Array.isArray(historyData.result)) {
                // Find delegation operations in the account history
                const delegationHistory = historyData.result.filter(item => 
                    item[1].op[0] === 'delegate_vesting_shares' && 
                    item[1].op[1].delegatee === username
                );
                
                // Extract unique delegators
                const uniqueDelegators = new Set();
                delegationHistory.forEach(item => {
                    uniqueDelegators.add(item[1].op[1].delegator);
                });
                
                console.log("Found potential delegators in history:", uniqueDelegators);

                // Check each potential delegator for active delegations
                if (uniqueDelegators.size > 0) {
                    const delegatorPromises = Array.from(uniqueDelegators).map(async delegator => {
                        try {
                            const delegationResponse = await fetch(`${DELEGATION_API_URL}`, {
                                method: 'POST',
                                body: JSON.stringify({
                                    jsonrpc: '2.0',
                                    method: 'condenser_api.get_vesting_delegations',
                                    params: [delegator, '', 100],
                                    id: 1
                                })
                            });
                            
                            const delegationData = await delegationResponse.json();
                            if (delegationData && delegationData.result) {
                                return delegationData.result.filter(d => d.delegatee === username);
                            }
                            return [];
                        } catch (e) {
                            console.error(`Error checking delegations for ${delegator}:`, e);
                            return [];
                        }
                    });
                    
                    const delegatorResults = await Promise.allSettled(delegatorPromises);
                    delegatorResults.forEach(result => {
                        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                            result.value.forEach(delegation => {
                                incomingDelegations.push(delegation);
                            });
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching account history:", error);
        }
        
        // Prepare to collect incoming delegations from various sources
        let incomingDelegations = [];
        let foundDelegators = false;
        
        if (accountData.result && accountData.result.length > 0) {
            const account = accountData.result[0];
            
            // Only proceed if there are received vesting shares
            if (account.received_vesting_shares && 
                parseFloat(account.received_vesting_shares) > 0) {
                
                console.log("Found received vesting shares:", account.received_vesting_shares);
                
                // Try approach 1: Get followers and check if they delegate
                try {
                    // First get all followers
                    const followResponse = await fetch(`${DELEGATION_API_URL}`, {
                        method: 'POST',
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'condenser_api.get_followers',
                            params: [username, null, 'blog', 1000],
                            id: 1
                        })
                    });
                    
                    const followData = await followResponse.json();
                    const followers = followData.result || [];
                    
                    if (followers.length > 0) {
                        console.log(`Got ${followers.length} followers to check for delegations`);
                        
                        // We'll check each follower for delegations to our user (up to 20 followers)
                        const followerBatch = followers.slice(0, 100);
                        const delegationPromises = followerBatch.map(async follower => {
                            try {
                                // Check if this follower delegates to our user
                                const delegationResponse = await fetch(`${DELEGATION_API_URL}`, {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        jsonrpc: '2.0',
                                        method: 'condenser_api.get_vesting_delegations',
                                        params: [follower.follower, '', 50],
                                        id: 1
                                    })
                                });
                                
                                const delegationData = await delegationResponse.json();
                                const delegations = delegationData.result || [];
                                
                                // Find any delegations to our target username
                                const matchingDelegations = delegations.filter(d => 
                                    d.delegatee === username
                                );
                                
                                return matchingDelegations;
                            } catch (e) {
                                console.error(`Error checking delegations for ${follower.follower}:`, e);
                                return [];
                            }
                        });
                        
                        // Wait for all delegation checks to complete
                        const delegationResults = await Promise.allSettled(delegationPromises);
                        
                        // Process the results
                        delegationResults.forEach(result => {
                            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                                result.value.forEach(delegation => {
                                    incomingDelegations.push(delegation);
                                });
                            }
                        });
                        
                        foundDelegators = incomingDelegations.length > 0;
                    }
                } catch (e) {
                    console.error("Error checking followers for delegations:", e);
                }
                
                // Approach 2: Try the Hive Blog API directly with recent accounts
                if (!foundDelegators) {
                    try {
                        // Get some recent accounts to check
                        const witnessResponse = await fetch(`${DELEGATION_API_URL}`, {
                            method: 'POST',
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'condenser_api.get_active_witnesses',
                                params: [],
                                id: 1
                            })
                        });
                        
                        const witnessData = await witnessResponse.json();
                        const witnesses = witnessData.result || [];
                        
                        // Check each witness for delegations (they often delegate)
                        if (witnesses.length > 0) {
                            console.log(`Got ${witnesses.length} witnesses to check for delegations`);
                            
                            // Take a subset to avoid overloading
                            const witnessBatch = witnesses.slice(0, 100);
                            
                            const witnessDelegationPromises = witnessBatch.map(async witness => {
                                try {
                                    const delegationResponse = await fetch(`${DELEGATION_API_URL}`, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            jsonrpc: '2.0',
                                            method: 'condenser_api.get_vesting_delegations',
                                            params: [witness, '', 100],
                                            id: 1
                                        })
                                    });
                                    
                                    const delegationData = await delegationResponse.json();
                                    const delegations = delegationData.result || [];
                                    
                                    return delegations.filter(d => d.delegatee === username);
                                } catch (e) {
                                    console.error(`Error checking delegations for witness ${witness}:`, e);
                                    return [];
                                }
                            });
                            
                            const witnessDelegationResults = await Promise.allSettled(witnessDelegationPromises);
                            
                            witnessDelegationResults.forEach(result => {
                                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                                    result.value.forEach(delegation => {
                                        incomingDelegations.push(delegation);
                                    });
                                }
                            });
                            
                            foundDelegators = incomingDelegations.length > 0;
                        }
                    } catch (e) {
                        console.error("Error checking witnesses for delegations:", e);
                    }
                }
                
                // If we still haven't found delegators, try a direct approach
                if (!foundDelegators) {
                    try {
                        // Try using the specific API endpoint for finding delegations by delegatee
                        const followersResponse = await fetch(`https://api.hive.blog/`, {
                            method: 'POST',
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'condenser_api.find_vesting_delegations',
                                params: {
                                    delegatee: username,
                                    limit: 10000
                                },
                                id: 1
                            })
                        });
                        
                        const followersData = await followersResponse.json();
                        
                        if (followersData && followersData.result && Array.isArray(followersData.result)) {
                            followersData.result.forEach(delegation => {
                                incomingDelegations.push({
                                    delegator: delegation.delegator,
                                    delegatee: username,
                                    vesting_shares: delegation.vesting_shares,
                                    delegation_date: delegation.min_delegation_time || new Date().toISOString().split('.')[0]
                                });
                            });
                            
                            foundDelegators = incomingDelegations.length > 0;
                        }
                    } catch (e) {
                        console.error("Error with find_vesting_delegations approach:", e);
                    }
                }
                
                // Try another direct approach with database_api if still not found
                if (!foundDelegators) {
                    try {
                        // Try using API.hive.blog with a specific approach
                        const followersResponse = await fetch(`https://api.hive.blog/`, {
                            method: 'POST',
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'database_api.list_vesting_delegations',
                                params: {
                                    start: [null, username],
                                    limit: 5000,
                                    order: 'by_delegation'
                                },
                                id: 1
                            })
                        });
                        
                        const followersData = await followersResponse.json();
                        
                        if (followersData && followersData.result && followersData.result.delegations) {
                            const delegations = followersData.result.delegations;
                            
                            delegations.forEach(delegation => {
                                if (delegation.delegatee === username) {
                                    incomingDelegations.push({
                                        delegator: delegation.delegator,
                                        delegatee: delegation.delegatee,
                                        vesting_shares: delegation.vesting_shares,
                                        delegation_date: delegation.min_delegation_time
                                    });
                                }
                            });
                            
                            foundDelegators = incomingDelegations.length > 0;
                        }
                    } catch (e) {
                        console.error("Error with direct API approach:", e);
                    }
                }
                
                // If we still don't have any incoming delegations but know they exist,
                // create specific entries for known delegators or a placeholder
                if (incomingDelegations.length === 0) {
                    const receivedAmount = account.received_vesting_shares;
                    
                    // Add entry with total amount
                    incomingDelegations.push({
                        delegator: 'Total Incoming Delegations',
                        vesting_shares: receivedAmount,
                        delegation_date: new Date().toISOString().split('.')[0]
                    });
                }
            }
        }
        
        // Final cleanup to remove any duplicates
        delegationsData.incoming = removeDuplicateDelegations(incomingDelegations);
        
        // Update UI
        updateDelegationUI(delegationsData, vestToHive, username.toLowerCase());
        
    } catch (error) {
        console.error('Error fetching delegations:', error);
        const delegationContent = document.getElementById('delegationContent');
        delegationContent.innerHTML = '<div class="delegation-error">Error loading delegations. Please try again.</div>';
    }
}

// Update delegation UI
function updateDelegationUI(data, vestToHive, currentUser) {
    const delegationContent = document.getElementById('delegationContent');
    let html = '';
    
    // Summary section
    const totalIncoming = data.incoming.length;
    const totalOutgoing = data.outgoing.length;
    
    // Calculate total delegation amounts
    let totalIncomingVests = 0;
    let totalOutgoingVests = 0;
    
    data.incoming.forEach(del => {
        totalIncomingVests += parseFloat(del.vesting_shares.split(' ')[0]);
    });
    
    data.outgoing.forEach(del => {
        totalOutgoingVests += parseFloat(del.vesting_shares.split(' ')[0]);
    });
    
    const totalIncomingHP = (totalIncomingVests * vestToHive).toFixed(3);
    const totalOutgoingHP = (totalOutgoingVests * vestToHive).toFixed(3);
    
    // Check if we have total delegations entry
    const hasTotalDelegations = data.incoming.some(del => del.delegator === 'Total Incoming Delegations');
    
    // Build HTML
    html += `
    <div class="delegation-summary">
        <div class="delegation-totals">
            <div class="delegation-total incoming">
                <h3>Total Incoming</h3>
                <p>${hasTotalDelegations ? "Has delegations" : totalIncoming} delegations</p>
                <p>${totalIncomingHP} HP</p>
                ${hasTotalDelegations ? '<p class="delegation-note">* See details below</p>' : ''}
            </div>
            <div class="delegation-total outgoing">
                <h3>Total Outgoing</h3>
                <p>${totalOutgoing} delegations</p>
                <p>${totalOutgoingHP} HP</p>
            </div>
        </div>
    </div>`;
    
    // Incoming delegations section
    html += `
    <div class="delegation-section">
        <h3>Incoming Delegations</h3>
        ${totalIncoming === 0 ? '<p class="no-delegations">No incoming delegations</p>' : ''}
        ${hasTotalDelegations ? '<p class="delegation-api-note">Note: Due to API limitations, only the total received delegation amount is shown. Individual delegators cannot be identified.</p>' : ''}
        ${totalIncoming > 0 ? '<div class="delegation-list">' : ''}`;
    
    // Sort by amount
    data.incoming.sort((a, b) => {
        return parseFloat(b.vesting_shares) - parseFloat(a.vesting_shares);
    });
    
    // List incoming delegations
    data.incoming.forEach(del => {
        const hpAmount = formatVestsToHP(del.vesting_shares, vestToHive);
        const isTotal = del.delegator === 'Total Incoming Delegations';
        
        html += `
        <div class="delegation-item ${isTotal ? 'total-delegator' : ''}">
            <div class="delegation-user">${del.delegator}</div>
            <div class="delegation-amount">${hpAmount} HP</div>
        </div>`;
    });
    
    if (totalIncoming > 0) {
        html += '</div>';
    }
    
    // Outgoing delegations section
    html += `
    </div>
    <div class="delegation-section">
        <h3>Outgoing Delegations</h3>
        ${totalOutgoing === 0 ? '<p class="no-delegations">No outgoing delegations</p>' : ''}
        ${totalOutgoing > 0 ? '<div class="delegation-list">' : ''}`;
    
    // Sort by amount
    data.outgoing.sort((a, b) => {
        return parseFloat(b.vesting_shares) - parseFloat(a.vesting_shares);
    });
    
    // List outgoing delegations
    data.outgoing.forEach(del => {
        const hpAmount = formatVestsToHP(del.vesting_shares, vestToHive);
        html += `
        <div class="delegation-item">
            <div class="delegation-user">${del.delegatee}</div>
            <div class="delegation-amount">${hpAmount} HP</div>
        </div>`;
    });
    
    if (totalOutgoing > 0) {
        html += '</div>';
    }
    
    html += '</div>';
    
    // Update the DOM
    delegationContent.innerHTML = html;
}

// Function to get global data for delegation calculations
async function getGlobalDataForDelegation() {
    try {
        // Try to use the function from script.js
        if (typeof window.getGlobalData === 'function') {
            const globalData = await window.getGlobalData();
            return globalData;
        }
        
        // Fallback implementation
        console.warn('getGlobalData not found in global scope, using fallback implementation');
        
        const globalData = await fetch(DELEGATION_API_URL, {
            method: 'POST',
            body: JSON.stringify({
                "jsonrpc": "2.0",
                "method": "condenser_api.get_dynamic_global_properties",
                "id": 1
            })
        }).then(r => r.json());
        
        return globalData;
    } catch (error) {
        console.error('Error fetching global data for delegations:', error);
        // Return safe fallback
        return {
            result: {
                total_vesting_shares: '0 VESTS',
                total_vesting_fund_hive: '0 HIVE'
            }
        };
    }
}

// Initialize delegations view on DOM load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Delegation.js loaded');
    
    // Create delegation view container if it doesn't exist
    if (!document.getElementById('delegationView')) {
        const statsContainer = document.getElementById('statsContainer');
        const delegationView = document.createElement('div');
        delegationView.id = 'delegationView';
        delegationView.className = 'delegation-container';
        delegationView.style.display = 'none';
        
        delegationView.innerHTML = `
            <h2 class="delegation-title">Delegation Status</h2>
            <div id="delegationContent" class="delegation-content">
                <div class="delegation-loading">Please search for a user first</div>
            </div>
        `;
        
        // Add to the page
        if (statsContainer) {
            // Insert before the footer
            const footer = statsContainer.querySelector('.footer');
            statsContainer.insertBefore(delegationView, footer);
        }
    }
    
    // Create delegation button if it doesn't exist
    if (!document.getElementById('toggleDelegationBtn')) {
        const balanceToggle = document.querySelector('.balance-toggle');
        if (balanceToggle) {
            const delegationBtn = document.createElement('button');
            delegationBtn.id = 'toggleDelegationBtn';
            delegationBtn.className = 'toggle-button';
            delegationBtn.setAttribute('onclick', 'toggleDelegationView()');
            delegationBtn.textContent = 'Show Delegations';
            
            balanceToggle.appendChild(delegationBtn);
        }
    }
}); 