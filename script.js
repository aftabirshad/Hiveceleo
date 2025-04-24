// API endpoints
const HIVE_API = 'https://api.hive.blog';
const HIVE_CDN = 'https://api.hive.blog';

// Set your Hive username here for all stats
const username = "leo.voter";

// Cache system
const CACHE_DURATION = 60000; // 1 minute cache
const cache = {
    userData: {},
    globalData: null,
    globalDataTimestamp: 0,
    rewardFund: null,
    rewardFundTimestamp: 0
};

// Helper function to format numbers
function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

// Helper function to calculate reputation score
function calculateReputation(rep) {
    if (rep == 0) return 25;
    const neg = rep < 0;
    const repAbs = Math.abs(rep);
    let reputationLevel = Math.log10(repAbs);
    reputationLevel = Math.max(reputationLevel - 9, 0);
    if (neg) reputationLevel = -reputationLevel;
    const result = (reputationLevel * 9) + 25;
    return Math.max(1, Math.floor(result));
}

// Show/hide loading indicator
function setLoading(loading) {
    const loader = document.getElementById('searchLoader');
    const button = document.querySelector('button span');
    loader.style.display = loading ? 'block' : 'none';
    button.style.display = loading ? 'none' : 'block';
}

// Function to fetch cached global data or fetch new if needed
async function getGlobalData() {
    const now = Date.now();
    if (cache.globalData && now - cache.globalDataTimestamp < CACHE_DURATION) {
        return cache.globalData;
    }
    
    const globalData = await fetch(HIVE_API, {
        method: 'POST',
        body: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "condenser_api.get_dynamic_global_properties",
            "id": 1
        })
    }).then(r => r.json());
    
    cache.globalData = globalData;
    cache.globalDataTimestamp = now;
    return globalData;
}

// Function to fetch cached reward fund or fetch new if needed
async function getRewardFund() {
    const now = Date.now();
    if (cache.rewardFund && now - cache.rewardFundTimestamp < CACHE_DURATION) {
        return cache.rewardFund;
    }
    
    const rewardFund = await fetch(HIVE_API, {
        method: 'POST',
        body: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "condenser_api.get_reward_fund",
            "params": ["post"],
            "id": 1
        })
    }).then(r => r.json());
    
    cache.rewardFund = rewardFund;
    cache.rewardFundTimestamp = now;
    return rewardFund;
}

// Function to get vote value
async function getVoteValue(username) {
    try {
        // Check cache for user data
        const cacheTime = Date.now();
        if (cache.userData[username] && cacheTime - cache.userData[username].timestamp < CACHE_DURATION) {
            return cache.userData[username].voteData;
        }

        // 1. Get account data (voting_power and vesting_shares)
        const accountResponse = await fetch(HIVE_API, {
            method: 'POST',
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_accounts',
                params: [[username]],
                id: 1
            })
        });
        const accountData = await accountResponse.json();
        const account = accountData.result[0];

        // Calculate current voting power with regeneration
        const VOTE_REGENERATION_SECONDS = 432000;
        const currentTime = new Date().getTime();
        const lastVoteTime = new Date(account.last_vote_time + 'Z').getTime();
        const elapsedSeconds = (currentTime - lastVoteTime) / 1000;
        const regeneratedPower = Math.floor((elapsedSeconds * 10000) / VOTE_REGENERATION_SECONDS);
        let currentVotingPower = Math.min(10000, account.voting_power + regeneratedPower);

        // 2. Get reward fund data - use cached version
        const rewardFundData = await getRewardFund();
        const rewardFund = rewardFundData.result;

        // 3. Get dynamic global properties - use cached version
        const dgpoData = await getGlobalData();
        const dgpo = dgpoData.result;

        // Get current HBD price
        const priceResponse = await fetch(HIVE_API, {
            method: 'POST',
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_current_median_history_price',
                id: 1
            })
        });
        const priceData = await priceResponse.json();
        const price = priceData.result;

        // 4. Calculate vote value (official formula)
        // Get vesting shares
        const vestingShares = parseFloat(account.vesting_shares.split(' ')[0]);
        const receivedVestingShares = parseFloat(account.received_vesting_shares.split(' ')[0]);
        const delegatedVestingShares = parseFloat(account.delegated_vesting_shares.split(' ')[0]);
        const totalVests = vestingShares + receivedVestingShares - delegatedVestingShares;
        const finalVest = totalVests * 1e6;

        // Use 100% vote weight
        const voteWeight = 10000;
        // Voting power is out of 10000
        const power = (currentVotingPower * voteWeight / 10000) / 50;
        const rshares = power * finalVest / 10000;

        // Reward fund
        const rewardBalance = parseFloat(rewardFund.reward_balance.split(' ')[0]);
        const recentClaims = parseFloat(rewardFund.recent_claims);
        // HBD price
        const hbdMedianPrice = parseFloat(price.base.split(' ')[0]) / parseFloat(price.quote.split(' ')[0]);

        // Final estimate
        const voteValue = rshares / recentClaims * rewardBalance * hbdMedianPrice;

        // Helper to calculate vote amount for any voting power percent (1-100)
        function calcVoteAmountForPower(percent) {
            const vp = percent * 100; // convert percent (1-100) to Hive scale (100-10000)
            const voteWeight = 10000; // always 100% weight
            const power = (vp * voteWeight / 10000) / 50;
            const rshares = power * finalVest / 10000;
            return rshares / recentClaims * rewardBalance * hbdMedianPrice;
        }
        
        const voteData = {
            voteValue,
            votingPower: currentVotingPower / 100,
            calcVoteAmountForPower
        };
        
        // Store in cache
        cache.userData[username] = {
            voteData,
            timestamp: Date.now()
        };
        
        return voteData;

    } catch (error) {
        console.error('Error calculating vote value:', error);
        return { voteValue: 0, votingPower: 0 };
    }
}

async function fetchUserStats() {
    const username = document.getElementById('usernameInput').value.trim();

    if (!username) {
        alert('Please enter a username');
        return;
    }

    setLoading(true);

    try {
        // Reset the balance container
        const balanceContainer = document.getElementById('balanceContainer');
        if (balanceContainer) {
            balanceContainer.classList.remove('active');
            balanceContainer.style.display = 'none';
        }

        // Check if user data is in cache
        const cacheCheckTime = Date.now();
        if (cache.userData[username] && cacheCheckTime - cache.userData[username].timestamp < CACHE_DURATION) {
            // Use cached data and update UI
            updateUserInterface(cache.userData[username].fullData);
            
            // Also fetch balance data
            await fetchBalanceData(username);
            
            setLoading(false);
            return;
        }

        // Fetch global data and reward fund once and reuse
        const [globalData, rewardFund] = await Promise.all([
            getGlobalData(),
            getRewardFund()
        ]);

        // Fetch user-specific data in parallel
        const [accountData, reputationData, rcResponse] = await Promise.all([
            fetch(HIVE_API, {
                method: 'POST',
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "condenser_api.get_accounts",
                    "params": [[username]],
                    "id": 1
                })
            }).then(r => r.json()),

            // Get reputation from CDN API
            fetch(HIVE_CDN, {
                method: 'POST',
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "condenser_api.get_account_reputations",
                    "params": [username, 1],
                    "id": 1
                })
            }).then(r => r.json()),

            // Get RC status
            fetch(HIVE_API, {
                method: 'POST',
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "rc_api.find_rc_accounts",
                    "params": {"accounts": [username]},
                    "id": 1
                })
            }).then(r => r.json())
        ]);

        if (!accountData.result || accountData.result.length === 0) {
            throw new Error('User not found');
        }

        const account = accountData.result[0];
        const globals = globalData.result;

        // Get all required values for calculations
        const rewardBalance = parseFloat(rewardFund.result.reward_balance.split(' ')[0]);
        const recentClaims = parseFloat(rewardFund.result.recent_claims);
        const vestToHive = parseFloat(globals.total_vesting_fund_hive.split(' ')[0]) / 
                          parseFloat(globals.total_vesting_shares.split(' ')[0]);
        const myVestingShares = parseFloat(account.vesting_shares.split(' ')[0]);
        const myDelegatedShares = parseFloat(account.delegated_vesting_shares.split(' ')[0]);
        const myReceivedShares = parseFloat(account.received_vesting_shares.split(' ')[0]);
        
        // Calculate SP values
        const ownSP = myVestingShares * vestToHive;
        const delegatedSP = myDelegatedShares * vestToHive;
        const effectiveSP = (myVestingShares - myDelegatedShares + myReceivedShares) * vestToHive;
        
        // Get vote value using the dedicated function
        const voteValueResult = await getVoteValue(username);

        // Calculate reputation score
        let score = 25;
        if (reputationData.result && reputationData.result.length > 0) {
            score = calculateReputation(parseFloat(reputationData.result[0].reputation));
        } else {
            score = calculateReputation(parseInt(account.reputation));
        }

        const rcPercent = (parseFloat(rcResponse.result.rc_accounts[0].rc_manabar.current_mana) / 
                          parseFloat(rcResponse.result.rc_accounts[0].max_rc)) * 100;
        const rcMana = parseInt(rcResponse.result.rc_accounts[0].rc_manabar.current_mana);
                          
        // Get social stats from bridge API
        const socialResponse = await fetch(HIVE_CDN, {
            method: 'POST',
            body: JSON.stringify({
                "jsonrpc": "2.0",
                "method": "bridge.get_profile",
                "params": [username],
                "id": 1
            })
        });
        const socialData = await socialResponse.json();
        
        // Get vote statistics
        // Upvotes Given
        const votesGivenResponse = await fetch(HIVE_CDN, {
                method: 'POST',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                method: 'condenser_api.get_account_votes',
                params: [[username]],
                    id: 1
                })
            });
        const votesGivenData = await votesGivenResponse.json();
        let votesGiven = 0;
            if (votesGivenData.result && Array.isArray(votesGivenData.result)) {
            votesGiven = votesGivenData.result.filter(v => parseInt(v.percent) > 0).length;
        }
        
        // Upvotes Received - use a different API approach
        const votesReceivedResponse = await fetch(HIVE_CDN, {
                method: 'POST',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                method: 'condenser_api.get_blog',
                params: [username, 0, 50],
                    id: 1
                })
            });
        const votesReceivedData = await votesReceivedResponse.json();
        let votesReceived = 0;
        if (votesReceivedData.result && Array.isArray(votesReceivedData.result)) {
            // Count positive votes across all posts
            votesReceived = votesReceivedData.result.reduce((sum, post) => {
                const netVotes = parseInt(post.net_votes || 0);
                return sum + (netVotes > 0 ? netVotes : 0);
                }, 0);
        }
        
        // Store full data in cache
        const fullData = {
            account,
            globals,
            rewardFund: rewardFund.result,
            voteValueResult,
            score,
            rcPercent,
            rcMana,
            ownSP,
            delegatedSP,
            effectiveSP,
            socialData: socialData.result?.stats || { followers: 0, following: 0 },
            votesGiven,
            votesReceived,
            postCount: account.post_count || 0
        };
        
        cache.userData[username] = {
            fullData,
            voteData: voteValueResult,
            timestamp: Date.now()
        };
        
        // Update UI with the data
        updateUserInterface(fullData);
        
        // Also fetch balance data
        await fetchBalanceData(username);

    } catch (error) {
        console.error('Error fetching user stats:', error);
        alert('Error: ' + error.message);
    } finally {
        setLoading(false);
    }
}

// Separate UI update function to reuse with cached data
function updateUserInterface(data) {
    // Update all UI elements with data
    document.getElementById('voteAmount').textContent = `$ ${Number(data.voteValueResult.voteValue).toFixed(4)}`;
    document.getElementById('votingPower').textContent = `${data.voteValueResult.votingPower.toFixed(2)}%`;
    document.getElementById('votingPowerBar').style.width = `${data.voteValueResult.votingPower}%`;
    document.getElementById('effectivePower').textContent = `${data.effectiveSP.toFixed(3)} HP`;
    document.getElementById('rcStatus').textContent = `${data.rcPercent.toFixed(2)}% | ${formatNumber(data.rcMana)} RC`;
    document.getElementById('rcBar').style.width = `${data.rcPercent}%`;
    document.getElementById('reputation').textContent = data.score;
    
    // Update social stats
    document.getElementById('followers').textContent = formatNumber(data.socialData?.followers || 0);
    document.getElementById('following').textContent = formatNumber(data.socialData?.following || 0);
    
    // Update vote statistics
    document.getElementById('votesGiven').textContent = formatNumber(data.votesGiven || 0);
    document.getElementById('votesReceived').textContent = formatNumber(data.votesReceived || 0);
    
    // Update content stats
    document.getElementById('postCount').textContent = formatNumber(data.postCount || 0);
    
    // Show stats container
    document.getElementById('statsContainer').style.display = 'block';
    
    // Setup vote power slider functionality with current voting power
    const slider = document.getElementById('votePowerSlider');
    const label = document.getElementById('votePowerLabel');

    if (slider && label) {
        // Set slider initial value to current voting power
        slider.value = Math.round(data.voteValueResult.votingPower);
        label.textContent = Math.round(data.voteValueResult.votingPower);
        
        // Update the UI with the voting power
        document.getElementById('votingPower').textContent = `${slider.value}%`;
        document.getElementById('votingPowerBar').style.width = `${slider.value}%`;
        
        // Set initial vote amount
        if (data.voteValueResult.calcVoteAmountForPower) {
            const votePower = parseInt(slider.value);
            const amount = data.voteValueResult.calcVoteAmountForPower(votePower);
            document.getElementById('voteAmount').textContent = `$ ${Number(amount).toFixed(4)}`;
        }
        
        // Handle slider change
        slider.oninput = function() {
            label.textContent = this.value;
            document.getElementById('votingPower').textContent = `${this.value}%`;
            document.getElementById('votingPowerBar').style.width = `${this.value}%`;
            
            if (data.voteValueResult.calcVoteAmountForPower) {
                const votePower = parseInt(this.value);
                const amount = data.voteValueResult.calcVoteAmountForPower(votePower);
                document.getElementById('voteAmount').textContent = `$ ${Number(amount).toFixed(4)}`;
            }
        };
    }
}

// Function to fetch balance data and update UI
async function fetchBalanceData(username = null) {
    try {
        // Get username from input if not provided
        if (!username) {
            username = document.getElementById('usernameInput').value.trim();
        }

        if (!username) {
            console.error('No username provided for balance data');
            return;
        }

        // Fetch account data
        const accountResponse = await fetch(HIVE_API, {
            method: 'POST',
            body: JSON.stringify({
                "jsonrpc": "2.0",
                "method": "condenser_api.get_accounts",
                "params": [[username]],
                "id": 1
            })
        });
        const accountData = await accountResponse.json();
        
        if (!accountData.result || accountData.result.length === 0) {
            throw new Error('Account not found');
        }
        
        // Get global data for HIVE conversion
        const globalData = await getGlobalData();
        
        // Get current price feed
        const priceResponse = await fetch(HIVE_API, {
                method: 'POST',
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                "method": "condenser_api.get_current_median_history_price",
                "params": [],
                    "id": 1
                })
            });
        const priceData = await priceResponse.json();
        
        const account = accountData.result[0];
        const globals = globalData.result;
        
        // Safe function to parse values with error handling
        function safeParseFloat(value, defaultValue = 0) {
            try {
                if (!value) return defaultValue;
                const parts = value.split(' ');
                if (parts.length >= 1) {
                    return parseFloat(parts[0]);
                }
                return defaultValue;
            } catch (e) {
                console.warn('Error parsing value:', value, e);
                return defaultValue;
            }
        }
        
        // Calculate conversion rates
        let vestToHive = 1; // Default fallback
        try {
            const totalVestingFund = globals.total_vesting_fund_hive || '0 HIVE';
            const totalVestingShares = globals.total_vesting_shares || '0 VESTS';
            vestToHive = safeParseFloat(totalVestingFund) / safeParseFloat(totalVestingShares);
            if (!isFinite(vestToHive)) vestToHive = 1;
        } catch (e) {
            console.warn('Error calculating vestToHive:', e);
        }
        
        // Get price feed data
        let hivePrice = 1; // Default fallback
        try {
            if (priceData.result && priceData.result.base && priceData.result.quote) {
                hivePrice = safeParseFloat(priceData.result.base) / safeParseFloat(priceData.result.quote);
                if (!isFinite(hivePrice)) hivePrice = 1;
            }
        } catch (e) {
            console.warn('Error calculating hivePrice:', e);
        }
        
        // Calculate balances
        const steemBalance = safeParseFloat(account.balance);
        const sbdBalance = safeParseFloat(account.hbd_balance || account.sbd_balance);
        const vestingShares = safeParseFloat(account.vesting_shares);
        const delegatedVestingShares = safeParseFloat(account.delegated_vesting_shares);
        const receivedVestingShares = safeParseFloat(account.received_vesting_shares);
        const steemPower = vestingShares * vestToHive;
        const delegatedSteemPower = delegatedVestingShares * vestToHive;
        const receivedSteemPower = receivedVestingShares * vestToHive;
        const effectiveSteemPower = steemPower - delegatedSteemPower + receivedSteemPower;
        
        // Calculate USD values
        const steemValueUSD = steemBalance * hivePrice;
        const sbdValueUSD = sbdBalance * hivePrice; // Approximation, SBD is meant to be ~1 USD
        const steemPowerValueUSD = steemPower * hivePrice;
        const effectiveSteemPowerValueUSD = effectiveSteemPower * hivePrice;
        const savingsBalance = safeParseFloat(account.savings_balance);
        const savingsSbdBalance = safeParseFloat(account.savings_hbd_balance || account.savings_sbd_balance);
        const savingsValueUSD = (savingsBalance * hivePrice) + savingsSbdBalance;
        
        // Calculate total account value
        const totalAccountValueUSD = steemValueUSD + sbdValueUSD + steemPowerValueUSD + savingsValueUSD;
        
        // Get reward balances
        const rewardSteemBalance = safeParseFloat(account.reward_hive_balance || account.reward_steem_balance);
        const rewardSbdBalance = safeParseFloat(account.reward_hbd_balance || account.reward_sbd_balance);
        const rewardVestingSteem = safeParseFloat(account.reward_vesting_hive || account.reward_vesting_steem);
        const rewardValueUSD = (rewardSteemBalance * hivePrice) + rewardSbdBalance + (rewardVestingSteem * hivePrice);
        
        // Update UI with balance data
        updateBalanceUI({
            username,
            steemBalance,
            sbdBalance,
            steemPower,
            delegatedSteemPower,
            receivedSteemPower,
            effectiveSteemPower,
            steemValueUSD,
            sbdValueUSD,
            steemPowerValueUSD,
            effectiveSteemPowerValueUSD,
            totalAccountValueUSD,
            savingsBalance,
            savingsSbdBalance,
            savingsValueUSD,
            rewardSteemBalance,
            rewardSbdBalance,
            rewardVestingSteem,
            rewardValueUSD,
            hivePrice
        });
        
    } catch (error) {
        console.error('Error fetching balance data:', error);
        // Only log the error, don't show alert
    }
}

// Function to update the UI with balance data
function updateBalanceUI(data) {
    try {
        const balanceContainer = document.getElementById('balanceContainer');
        if (!balanceContainer) {
            console.error('Balance container not found');
            return;
        }
        
        // Format all values for display
        const formattedValues = {
            steemBalance: formatNumber(data.steemBalance, 3),
            sbdBalance: formatNumber(data.sbdBalance, 3),
            steemPower: formatNumber(data.steemPower, 3),
            delegatedSteemPower: formatNumber(data.delegatedSteemPower, 3),
            receivedSteemPower: formatNumber(data.receivedSteemPower, 3),
            effectiveSteemPower: formatNumber(data.effectiveSteemPower, 3),
            steemValueUSD: formatNumber(data.steemValueUSD, 2),
            sbdValueUSD: formatNumber(data.sbdValueUSD, 2),
            steemPowerValueUSD: formatNumber(data.steemPowerValueUSD, 2),
            effectiveSteemPowerValueUSD: formatNumber(data.effectiveSteemPowerValueUSD, 2),
            totalAccountValueUSD: formatNumber(data.totalAccountValueUSD, 2),
            savingsBalance: formatNumber(data.savingsBalance, 3),
            savingsSbdBalance: formatNumber(data.savingsSbdBalance, 3),
            savingsValueUSD: formatNumber(data.savingsValueUSD, 2),
            rewardSteemBalance: formatNumber(data.rewardSteemBalance, 3),
            rewardSbdBalance: formatNumber(data.rewardSbdBalance, 3),
            rewardVestingSteem: formatNumber(data.rewardVestingSteem, 3),
            rewardValueUSD: formatNumber(data.rewardValueUSD, 2),
            hivePrice: formatNumber(data.hivePrice, 3)
        };
        
        // Update the balances in the UI
        document.getElementById('accountValueUSD').textContent = `$${formattedValues.totalAccountValueUSD}`;
        document.getElementById('currentPrice').textContent = `$${formattedValues.hivePrice}`;
        document.getElementById('hiveBalance').textContent = `${formattedValues.steemBalance} HIVE ($${formattedValues.steemValueUSD})`;
        document.getElementById('hbdBalance').textContent = `${formattedValues.sbdBalance} HBD ($${formattedValues.sbdValueUSD})`;
        document.getElementById('hivePower').textContent = `${formattedValues.steemPower} HP ($${formattedValues.steemPowerValueUSD})`;
        
        // Handle delegations
        const delegationsCard = document.getElementById('delegationsCard');
        if (data.delegatedSteemPower > 0 || data.receivedSteemPower > 0) {
            delegationsCard.style.display = 'block';
            
            if (data.delegatedSteemPower > 0) {
                document.getElementById('delegatedPower').textContent = `${formattedValues.delegatedSteemPower} HP`;
                document.getElementById('delegatedPowerRow').style.display = 'flex';
            } else {
                document.getElementById('delegatedPowerRow').style.display = 'none';
            }
            
            if (data.receivedSteemPower > 0) {
                document.getElementById('receivedPower').textContent = `${formattedValues.receivedSteemPower} HP`;
                document.getElementById('receivedPowerRow').style.display = 'flex';
            } else {
                document.getElementById('receivedPowerRow').style.display = 'none';
            }
        } else {
            delegationsCard.style.display = 'none';
        }
        
        // Update effective power in both places (main stats and balance cards)
        const effectivePowerElements = document.querySelectorAll('#effectivePower');
        effectivePowerElements.forEach(element => {
            element.textContent = `${formattedValues.effectiveSteemPower} HP ($${formattedValues.effectiveSteemPowerValueUSD})`;
        });
        
        // Update savings balances
        const savingsCard = document.getElementById('savingsCard');
        if (data.savingsBalance > 0 || data.savingsSbdBalance > 0) {
            savingsCard.style.display = 'block';
            document.getElementById('savingsHive').textContent = `${formattedValues.savingsBalance} HIVE`;
            document.getElementById('savingsHbd').textContent = `${formattedValues.savingsSbdBalance} HBD`;
            document.getElementById('savingsValueUSD').textContent = `$${formattedValues.savingsValueUSD}`;
        } else {
            savingsCard.style.display = 'none';
        }
        
        // Update rewards section
        const rewardsCard = document.getElementById('rewardsCard');
        if (data.rewardSteemBalance > 0 || data.rewardSbdBalance > 0 || data.rewardVestingSteem > 0) {
            rewardsCard.style.display = 'block';
            document.getElementById('rewardHive').textContent = `${formattedValues.rewardSteemBalance} HIVE`;
            document.getElementById('rewardHbd').textContent = `${formattedValues.rewardSbdBalance} HBD`;
            document.getElementById('rewardHP').textContent = `${formattedValues.rewardVestingSteem} HP`;
            document.getElementById('rewardValueUSD').textContent = `$${formattedValues.rewardValueUSD}`;
        } else {
            rewardsCard.style.display = 'none';
        }
        
        // Show the balance container with animation
        balanceContainer.style.display = 'block';
        setTimeout(() => {
            balanceContainer.classList.add('active');
        }, 10);
    } catch (error) {
        console.error('Error updating balance UI:', error);
        // Don't show error to user, just log it
    }
}

// Preload global data when page loads to make first search faster
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([getGlobalData(), getRewardFund()]);
        console.log('Preloaded global Hive data');
    } catch (e) {
        console.error('Failed to preload global data:', e);
    }
});

// Allow Enter key to trigger search
document.getElementById('usernameInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        fetchUserStats();
    }
});

// Make API endpoints and functions available to other scripts
window.HIVE_API = HIVE_API;
window.HIVE_CDN = HIVE_CDN;
window.getGlobalData = getGlobalData;
window.getRewardFund = getRewardFund;