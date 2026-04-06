/**
 * Popup.js - Modern UI Controller for Ninja Adult Blocker
 */

document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const elements = {
        // Status elements
        statusDot: document.getElementById('status-dot'),
        statusText: document.getElementById('status-text'),
        statusLevel: document.getElementById('status-level'),
        protectionToggle: document.getElementById('protection-toggle'),
        
        // Site card elements
        siteFavicon: document.getElementById('site-favicon'),
        siteDomain: document.getElementById('site-domain'),
        siteStatus: document.getElementById('site-status'),
        blockSiteBtn: document.getElementById('block-site-btn'),
        whitelistSiteBtn: document.getElementById('whitelist-site-btn'),
        
        // Stats elements
        blockedCount: document.getElementById('blocked-count'),
        whitelistedCount: document.getElementById('whitelisted-count'),
        levelText: document.getElementById('level-text'),
        
        // Quick action buttons
        blocklistBtn: document.getElementById('blocklist-btn'),
        whitelistBtn: document.getElementById('whitelist-btn'),
        safesearchBtn: document.getElementById('safesearch-btn'),
        reportBtn: document.getElementById('report-btn'),
        
        // Premium elements
        premiumBtn: document.getElementById('premium-btn'),
        premiumBanner: document.getElementById('premium-banner'),
        
        
        // Header button
        settingsBtn: document.getElementById('settings-btn')
    };

    let currentDomain = null;
    let currentUrl = null;
    let isEnabled = true;
    let blockLevel = 'normal';
    let safeSearchEnabled = true;

    // Initialize popup
    init();

    async function init() {
        console.log('Initializing popup...');
        console.log('Checking element existence:');
        for (const key in elements) {
            console.log(`${key}:`, elements[key]);
        }
        console.log('Status Dot:', elements.statusDot);
        console.log('Status Text:', elements.statusText);
        console.log('Status Level:', elements.statusLevel);
        console.log('Status Dot:', elements.statusDot);
        console.log('Status Text:', elements.statusText);
        console.log('Status Level:', elements.statusLevel);
        console.log('Status Dot:', elements.statusDot);
        console.log('Status Text:', elements.statusText);
        console.log('Status Level:', elements.statusLevel);
        try {
            // Load current state
            await loadExtensionState();
            
            // Get current tab info
            await getCurrentTabInfo();
            
            // Update UI
            updateUI();
            
            // Setup event listeners
            setupEventListeners();
            
            // Load stats
            loadStats();
            
            // Check premium status
            checkPremiumStatus();
        } catch (error) {
            console.error('Error initializing popup:', error);
        }
    }

    // Load extension state from storage
    async function loadExtensionState() {
        return new Promise((resolve) => {
            chrome.storage.local.get([
                'ninja_config',
                'block_level',
                'safe_search_enabled',
                'blocked_sites',
                'whitelisted_sites'
            ], function(result) {
                isEnabled = result.ninja_config?.is_enable !== false;
                blockLevel = result.block_level || 'normal';
                safeSearchEnabled = result.safe_search_enabled !== false;
                resolve();
            });
        });
    }

    // Get current tab information
    async function getCurrentTabInfo() {
        return new Promise((resolve) => {
            // Try direct tabs API first (more reliable)
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (tabs && tabs[0]) {
                    currentUrl = tabs[0].url || tabs[0].pendingUrl || '';
                    currentDomain = extractDomain(currentUrl);
                    updateSiteCard(tabs[0]);
                } else {
                    // Fallback: try message to background
                    chrome.runtime.sendMessage({ command: 'get_active_tab' }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.log('Error getting tab:', chrome.runtime.lastError);
                            elements.siteDomain.textContent = 'No active tab';
                            elements.siteStatus.textContent = '';
                        } else if (response && response.tab) {
                            currentUrl = response.tab.url || response.tab.pendingUrl || '';
                            currentDomain = extractDomain(currentUrl);
                            updateSiteCard(response.tab);
                        }
                    });
                }
                resolve();
            });
        });
    }

    // Extract domain from URL
    function extractDomain(url) {
        if (!url) return null;
        
        try {
            // Handle special chrome:// URLs
            if (url.startsWith('chrome://') || url.startsWith('edge://') || 
                url.startsWith('about:') || url.startsWith('chrome-extension://')) {
                return null;
            }
            
            const urlObj = new URL(url);
            let domain = urlObj.hostname;
            
            // Remove www prefix
            domain = domain.replace(/^www\./, '');
            
            return domain;
        } catch (e) {
            return null;
        }
    }

    // Update site card with current tab info
    function updateSiteCard(tab) {
        if (!currentDomain) {
            // Special page (chrome://, new tab, etc.)
            elements.siteDomain.textContent = 'Browser Page';
            elements.siteStatus.textContent = 'System Page';
            elements.siteStatus.className = 'site-status';
            elements.siteFavicon.src = '/assets/images/ninja-gray.png';
            elements.blockSiteBtn.style.display = 'none';
            elements.whitelistSiteBtn.style.display = 'none';
            
            // Hide site card for system pages
            const siteCard = document.getElementById('site-card');
            if (siteCard) siteCard.style.opacity = '0.5';
            return;
        }

        // Show site card normally
        const siteCard = document.getElementById('site-card');
        if (siteCard) siteCard.style.opacity = '1';

        // Update domain
        elements.siteDomain.textContent = currentDomain;
        
        // Update favicon
        if (tab.favIconUrl) {
            elements.siteFavicon.src = tab.favIconUrl;
            elements.siteFavicon.onerror = function() {
                // Fallback to DuckDuckGo favicon service
                this.src = `https://icons.duckduckgo.com/ip3/${currentDomain}.ico`;
                this.onerror = function() {
                    // Final fallback
                    this.src = '/assets/images/ninja-gray.png';
                };
            };
        } else {
            // Try DuckDuckGo favicon service
            elements.siteFavicon.src = `https://icons.duckduckgo.com/ip3/${currentDomain}.ico`;
            elements.siteFavicon.onerror = function() {
                this.src = '/assets/images/ninja-gray.png';
            };
        }

        // Check site status
        checkSiteStatus();
    }

    // Check if current site is blocked or whitelisted
    function checkSiteStatus() {
        if (!currentDomain) {
            elements.siteStatus.textContent = '';
            return;
        }

        chrome.storage.local.get(['blocked_sites', 'whitelisted_sites', 'combinedBlockList'], function(result) {
            const blockedSites = result.blocked_sites || [];
            const whitelistedSites = result.whitelisted_sites || [];
            const combinedList = result.combinedBlockList || [];
            
            if (whitelistedSites.includes(currentDomain)) {
                elements.siteStatus.textContent = 'Whitelisted';
                elements.siteStatus.className = 'site-status whitelisted';
                elements.blockSiteBtn.style.display = 'none';
                elements.whitelistSiteBtn.style.display = 'flex';
                // Update button text - Remove from whitelist
                elements.whitelistSiteBtn.innerHTML = '<span class="btn-icon">🗑️</span><span class="btn-text">Remove from Whitelist</span>';
                elements.whitelistSiteBtn.className = 'action-btn neutral';
            } else if (blockedSites.includes(currentDomain)) {
                // Site is in custom blocklist
                elements.siteStatus.textContent = 'Custom Blocked';
                elements.siteStatus.className = 'site-status blocked';
                elements.blockSiteBtn.style.display = 'none';
                elements.whitelistSiteBtn.style.display = 'flex';
                // Update button text and style - Remove from blocklist since it's in custom list
                elements.whitelistSiteBtn.innerHTML = '<span class="btn-icon">🗑️</span><span class="btn-text">Remove from Blocklist</span>';
                elements.whitelistSiteBtn.className = 'action-btn neutral';
            } else if (combinedList.some(item => currentDomain.includes(item) || currentDomain.endsWith('.' + item))) {
                // Site is blocked by predefined lists
                elements.siteStatus.textContent = 'Blocked';
                elements.siteStatus.className = 'site-status blocked';
                elements.blockSiteBtn.style.display = 'none';
                elements.whitelistSiteBtn.style.display = 'flex';
                // Update button text and style - Add to whitelist since it's from predefined list
                elements.whitelistSiteBtn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Add to Whitelist</span>';
                elements.whitelistSiteBtn.className = 'action-btn success';
            } else {
                elements.siteStatus.textContent = 'Allowed';
                elements.siteStatus.className = 'site-status allowed';
                elements.blockSiteBtn.style.display = 'flex';
                elements.whitelistSiteBtn.style.display = 'none';
                // Update button text
                elements.blockSiteBtn.innerHTML = '<span class="btn-icon">🚫</span><span class="btn-text">Add to Blocklist</span>';
            }
        });
    }

    // Update UI based on current state
    function updateUI() {
        // Update protection status
        if (elements.statusDot) {
            if (isEnabled) {
                elements.statusDot.classList.add('active');
                elements.statusText.textContent = 'Protection Active';
                elements.protectionToggle.checked = true;
            } else {
                elements.statusDot.classList.remove('active');
                elements.statusText.textContent = 'Protection Disabled';
                elements.protectionToggle.checked = false;
            }
        }
        
        // Update level text
        const levelMap = {
            'normal': 'Lite',
            'strict': 'Balanced',
            'very-strict': 'Ultimate'
        };
        const levelName = levelMap[blockLevel] || 'Lite';
        
        // Only show Safe Search status when protection is enabled
        if (isEnabled) {
            elements.statusLevel.textContent = `${levelName} Level • Safe Search ${safeSearchEnabled ? 'On' : 'Off'}`;
        } else {
            elements.statusLevel.textContent = 'Protection is disabled';
        }
        
        elements.levelText.textContent = levelName;
    }

    // Load statistics with limit indicators
    function loadStats() {
        chrome.storage.local.get(['blocked_sites', 'whitelisted_sites', 'premium_active'], function(result) {
            const blockedCount = (result.blocked_sites || []).length;
            const whitelistedCount = (result.whitelisted_sites || []).length;
            const isPremium = result.premium_active === true;
            
            // Show counts with limits for free users
            if (!isPremium) {
                elements.blockedCount.textContent = `${blockedCount}/15`;
                elements.whitelistedCount.textContent = `${whitelistedCount}/10`;
                
                // Add warning color if near limit (13+ out of 15, 8+ out of 10)
                if (blockedCount >= 13) {
                    elements.blockedCount.style.color = '#f59e0b';
                }
                if (blockedCount >= 15) {
                    elements.blockedCount.style.color = '#ef4444';
                }
                if (whitelistedCount >= 8) {
                    elements.whitelistedCount.style.color = '#f59e0b';
                }
                if (whitelistedCount >= 10) {
                    elements.whitelistedCount.style.color = '#ef4444';
                }
            } else {
                elements.blockedCount.textContent = blockedCount.toString();
                elements.whitelistedCount.textContent = whitelistedCount.toString();
                // Reset colors for premium users
                elements.blockedCount.style.color = '';
                elements.whitelistedCount.style.color = '';
            }
        });
    }

    // Check premium status
    function checkPremiumStatus() {
        chrome.storage.local.get(['premium_active'], function(result) {
            if (result.premium_active === true) {
                elements.premiumBanner.classList.add('hidden');
            } else {
                elements.premiumBanner.classList.remove('hidden');
            }
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Protection toggle - Read-only, opens settings on click
        elements.protectionToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openSettings('general');
        });
        
        // Also handle clicks on the toggle container
        const toggleContainer = document.querySelector('.toggle-switch');
        if (toggleContainer) {
            toggleContainer.style.cursor = 'pointer';
            toggleContainer.title = 'Click to open settings';
            toggleContainer.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openSettings('general');
            });
        }
        
        // Site actions
        if (elements.blockSiteBtn) {
            elements.blockSiteBtn.addEventListener('click', function() {
                blockCurrentSite();
            });
        }
        
        if (elements.whitelistSiteBtn) {
            elements.whitelistSiteBtn.addEventListener('click', function() {
                whitelistCurrentSite();
            });
        }
        
        // Quick actions
        elements.blocklistBtn.addEventListener('click', function() {
            openSettings('blocklist');
        });
        
        elements.whitelistBtn.addEventListener('click', function() {
            openSettings('whitelist');
        });
        
        elements.safesearchBtn.addEventListener('click', function() {
            openSettings('general-safe-search');
        });
        
        elements.reportBtn.addEventListener('click', function() {
            reportSite();
        });
        
        // Premium
        elements.premiumBtn.addEventListener('click', function() {
            openSettings('premium');
        });
        
        // Settings button
        elements.settingsBtn.addEventListener('click', function() {
            openSettings();
        });
    }

    // Toggle protection - Removed as toggle is now read-only
    // Protection can only be changed from settings page
    // function toggleProtection() {
    //     chrome.runtime.sendMessage({ command: 'active_ninja' }, function() {
    //         isEnabled = !isEnabled;
    //         updateUI();
    //         
    //         // Show feedback
    //         showNotification(isEnabled ? 'Protection Enabled' : 'Protection Disabled');
    //     });
    // }

    // Block current site
    function blockCurrentSite() {
        if (!currentDomain) return;
        
        chrome.storage.local.get(['blocked_sites', 'premium_active'], function(result) {
            let blockedSites = result.blocked_sites || [];
            const isPremium = result.premium_active === true;
            
            // Check plan limits
            const BLOCKLIST_LIMIT = isPremium ? Infinity : 15; // Free users: 15 sites max (matching settings.js)
            
            if (!isPremium && blockedSites.length >= BLOCKLIST_LIMIT) {
                showNotification(`🎉 Great! You've used all ${BLOCKLIST_LIMIT} free blocks! Want unlimited? Check Premium! 🚀`, 'warning');
                // Optionally open premium modal
                setTimeout(() => {
                    openSettings('plans');
                }, 1500);
                return;
            }
            
            if (!blockedSites.includes(currentDomain)) {
                blockedSites.push(currentDomain);
                
                chrome.storage.local.set({ blocked_sites: blockedSites }, function() {
                    // Update rules
                    chrome.runtime.sendMessage({ command: 'update_block_list' }, function() {
                        checkSiteStatus();
                        loadStats();
                        showNotification(`${currentDomain} added to blocklist`);
                    });
                });
            }
        });
    }

    // Whitelist current site or remove from whitelist/blocklist
    function whitelistCurrentSite() {
        if (!currentDomain) return;
        
        chrome.storage.local.get(['blocked_sites', 'whitelisted_sites', 'premium_active'], function(result) {
            const blockedSites = result.blocked_sites || [];
            const whitelistedSites = result.whitelisted_sites || [];
            const isPremium = result.premium_active === true;
            
            // Check if we're removing from whitelist
            if (whitelistedSites.includes(currentDomain)) {
                // Remove from whitelist
                const index = whitelistedSites.indexOf(currentDomain);
                if (index > -1) {
                    whitelistedSites.splice(index, 1);
                    
                    chrome.storage.local.set({ whitelisted_sites: whitelistedSites }, function() {
                        // Update rules
                        chrome.runtime.sendMessage({ 
                            command: 'update_whitelist',
                            action: 'refresh'
                        }, function() {
                            checkSiteStatus();
                            loadStats();
                            showNotification(`${currentDomain} removed from whitelist`);
                        });
                    });
                }
            } else if (blockedSites.includes(currentDomain)) {
                // Remove from custom blocklist (no limit check needed for removal)
                const index = blockedSites.indexOf(currentDomain);
                if (index > -1) {
                    blockedSites.splice(index, 1);
                    
                    chrome.storage.local.set({ blocked_sites: blockedSites }, function() {
                        // First, immediately show as Allowed (optimistic UI update)
                        elements.siteStatus.textContent = 'Allowed';
                        elements.siteStatus.className = 'site-status allowed';
                        elements.blockSiteBtn.style.display = 'flex';
                        elements.whitelistSiteBtn.style.display = 'none';
                        elements.blockSiteBtn.innerHTML = '<span class="btn-icon">🚫</span><span class="btn-text">Add to Blocklist</span>';
                        
                        // Update rules first
                        chrome.runtime.sendMessage({ command: 'update_block_list' }, function() {
                            loadStats();
                            showNotification(`${currentDomain} removed from custom blocklist`);
                            
                            // After rules are updated, check the new combinedBlockList
                            setTimeout(() => {
                                chrome.storage.local.get(['combinedBlockList'], function(res) {
                                    const combinedList = res.combinedBlockList || [];
                                    // More precise check - only exact match or subdomain
                                    const stillBlocked = combinedList.some(item => {
                                        if (!item) return false;
                                        // Check for exact domain match or subdomain
                                        return currentDomain === item || currentDomain.endsWith('.' + item);
                                    });
                                    
                                    if (stillBlocked) {
                                        // Site is still blocked by predefined list, show whitelist option
                                        elements.siteStatus.textContent = 'Blocked';
                                        elements.siteStatus.className = 'site-status blocked';
                                        elements.blockSiteBtn.style.display = 'none';
                                        elements.whitelistSiteBtn.style.display = 'flex';
                                        elements.whitelistSiteBtn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Add to Whitelist</span>';
                                        elements.whitelistSiteBtn.className = 'action-btn success';
                                    }
                                    // If not blocked, keep the "Allowed" status we already set
                                });
                            }, 500); // Small delay to ensure rules are updated
                        });
                    });
                }
            } else {
                // Check whitelist limit before adding
                const WHITELIST_LIMIT = isPremium ? Infinity : 15; // Free users: 15 sites max (matching settings.js)
                
                if (!isPremium && whitelistedSites.length >= WHITELIST_LIMIT) {
                    showNotification(`✨ Awesome! You've used all ${WHITELIST_LIMIT} whitelist slots! Need more? Try Premium! 💎`, 'warning');
                    // Optionally open premium modal
                    setTimeout(() => {
                        openSettings('plans');
                    }, 1500);
                    return;
                }
                
                // Add to whitelist (for sites blocked by predefined lists)
                if (!whitelistedSites.includes(currentDomain)) {
                    whitelistedSites.push(currentDomain);
                    
                    chrome.storage.local.set({ whitelisted_sites: whitelistedSites }, function() {
                        // Update rules
                        chrome.runtime.sendMessage({ 
                            command: 'update_whitelist',
                            action: 'add',
                            site: currentDomain
                        }, function() {
                            checkSiteStatus();
                            loadStats();
                            showNotification(`${currentDomain} added to whitelist`);
                        });
                    });
                }
            }
        });
    }

    // Report site
    function reportSite() {
        if (!currentDomain) {
            showNotification('No site to report');
            return;
        }
        
        const subject = encodeURIComponent('Ninja Adult Blocker - Site Report');
        const body = encodeURIComponent(`I would like to report this site:\n\nURL: ${currentUrl}\nDomain: ${currentDomain}\n\nReason: [Please specify if this should be blocked or if it's incorrectly blocked]`);
        
        chrome.tabs.create({ 
            url: `mailto:ixstudio.net@gmail.com?subject=${subject}&body=${body}` 
        });
    }

    // Open settings page
    function openSettings(tab = '') {
        const hash = tab ? `#${tab}` : '';
        chrome.tabs.create({ 
            url: chrome.runtime.getURL(`settings/settings.html${hash}`)
        });
        window.close();
    }

    // Show notification with type support
    function showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        
        // Set background based on type
        let background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        let shadowColor = 'rgba(34, 197, 94, 0.3)';
        
        if (type === 'warning') {
            background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            shadowColor = 'rgba(245, 158, 11, 0.3)';
        } else if (type === 'error') {
            background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            shadowColor = 'rgba(239, 68, 68, 0.3)';
        }
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${background};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 0 4px 12px ${shadowColor};
            z-index: 10000;
            animation: slideUp 0.3s ease-out;
            max-width: 320px;
            text-align: center;
            line-height: 1.4;
        `;
        notification.textContent = message;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after 4 seconds for warnings, 3 for others
        const duration = type === 'warning' ? 4000 : 3000;
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-out reverse';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }, duration);
    }
});
