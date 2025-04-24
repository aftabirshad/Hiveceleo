// Make sure we have access to API endpoints from script.js
let HIVE_API = window.HIVE_API;
if (!HIVE_API) {
    HIVE_API = 'https://api.hive.blog';
    console.warn('HIVE_API not found in global scope, using default API endpoint');
}

// Reference to getGlobalData function from script.js
async function getGlobalDataForBalance() {
    try {
        // First try to use the function from script.js
        if (typeof window.getGlobalData === 'function') {
            const globalData = await window.getGlobalData();
            return globalData;
        }
        
        // Fallback implementation if getGlobalData is not available
        console.warn('getGlobalData not found in global scope, using fallback implementation');
        
        const globalData = await fetch(HIVE_API, {
            method: 'POST',
            body: JSON.stringify({
                "jsonrpc": "2.0",
                "method": "condenser_api.get_dynamic_global_properties",
                "id": 1
            })
        }).then(r => r.json());
        
        return globalData;
    } catch (error) {
        console.error('Error fetching global data:', error);
        // Return a safe fallback object with empty properties
        return { 
            result: { 
                total_vesting_shares: '0 VESTS',
                total_vesting_fund_hive: '0 HIVE' 
            } 
        };
    }
}

// When the DOM content is loaded, initialize our balance view
document.addEventListener('DOMContentLoaded', function() {
    console.log('Balance.js DOM content loaded');
    
    // Make sure detailed balance is initially hidden
    const detailedBalance = document.getElementById('detailedBalance');
    if (detailedBalance) {
        detailedBalance.style.display = 'none';
        detailedBalance.classList.remove('active');
    }
    
    console.log('Balance module initialized');
}); 