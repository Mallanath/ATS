// Configuration
const CONFIG = {
    redirectUrl: "https://www.joinrelay.app/page-blocked",
    // Sites to block
    blockedSites: BLOCKED_SITES,
};

// Helper function to extract domain from URL
function extractDomain(url) {
    try {
        // Add protocol if missing to make URL constructor work
        const fullUrl = url.startsWith('http://') || url.startsWith('https://') 
            ? url 
            : 'https://' + url;
        const urlObj = new URL(fullUrl);
        return urlObj.hostname.toLowerCase();
    } catch (e) {
        return '';
    }
}

// Helper function to check if domain matches blocked site
function isDomainBlocked(domain, blockedSite) {
    const blockedDomain = blockedSite.toLowerCase();
    
    // Exact match
    if (domain === blockedDomain) {
        return true;
    }
    
    // Subdomain match (e.g., www.aff.com matches aff.com)
    if (domain.endsWith('.' + blockedDomain)) {
        return true;
    }
    
    return false;
}

// Helper function to check if URL matches blocked site (including paths)
function isUrlBlocked(url, blockedSite) {
    const normalizedUrl = url.toLowerCase();
    const normalizedBlockedSite = blockedSite.toLowerCase();
    
    // If blocked site contains a path (has a '/'), do URL matching
    if (normalizedBlockedSite.includes('/')) {
        // Ensure we're matching the full path, not just a substring
        // Add protocol if missing for proper URL comparison
        const fullBlockedUrl = normalizedBlockedSite.startsWith('http') 
            ? normalizedBlockedSite 
            : 'https://' + normalizedBlockedSite;
        
        try {
            const blockedUrlObj = new URL(fullBlockedUrl);
            const currentUrlObj = new URL(normalizedUrl);
            
            // Check if domain matches and path starts with blocked path
            return currentUrlObj.hostname === blockedUrlObj.hostname && 
                   currentUrlObj.pathname.startsWith(blockedUrlObj.pathname);
        } catch (e) {
            // Fallback to simple string matching if URL parsing fails
            return normalizedUrl.includes(normalizedBlockedSite);
        }
    }
    
    // If no path in blocked site, use domain-only matching
    const currentDomain = extractDomain(url);
    return isDomainBlocked(currentDomain, blockedSite);
}

// Main blocking logic
function checkAndBlockSite() {
    const currentUrl = window.location.href;
    
    const isBlocked = CONFIG.blockedSites.some(site => 
        isUrlBlocked(currentUrl, site)
    );

    if (isBlocked) {
        chrome.runtime.sendMessage({ redirect: CONFIG.redirectUrl })
            .then(() => saveLogNow())
            .catch(error => console.error('Error sending message:', error));
    }
}

// Logging functions
function saveLogNow() {
    const timestamp = getFormattedDateTime();
    const newLog = `${window.location.href}|ZZZ|${timestamp}`;
    
    chrome.storage.local.get('logs', result => {
        const existingLogs = result.logs || '';
        const updatedLogs = existingLogs ? `${existingLogs}|YYY|${newLog}` : newLog;
        chrome.storage.local.set({ 'logs': updatedLogs });
    });
}

function getFormattedDateTime() {
    const d = new Date();
    return `${d.getDate()}/${addZero(d.getMonth() + 1)}/${d.getFullYear()}  ${addZero(d.getHours())} : ${addZero(d.getMinutes())}`;
}

function addZero(i) {
    return i < 10 ? `0${i}` : i;
}

// Initialize
checkAndBlockSite();
