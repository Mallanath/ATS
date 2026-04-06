/**
 * Check if a URL should be blocked based on predefined and custom block lists
 */
function shouldBlockUrl(url) {
  // Get domain from URL
  let domain = extractDomain(url);
  
  // First check if the domain is in the whitelist
  return new Promise((resolve) => {
    chrome.storage.local.get(['whitelisted_sites'], function(result) {
      const whitelist = result.whitelisted_sites || [];
      
      // Check if domain is whitelisted
      if (isWhitelisted(domain, whitelist)) {
        console.log(`Domain ${domain} is whitelisted - allowing access`);
        resolve(false); // Don't block
        return;
      }
      
      // If not whitelisted, check against block lists and keywords
      chrome.storage.local.get(['combinedBlockList', 'CUSTOM_LIST_BLOCKED', 'custom_keywords', 'keyword_blocking_enabled', 'block_level', 'DEFAULT_KEYWORDS_LITE', 'DEFAULT_KEYWORDS_BALANCED', 'DEFAULT_KEYWORDS_ULTIMATE'], function(blockResult) {
        // Use combinedBlockList if available, otherwise check individual lists
        if (blockResult.combinedBlockList && Array.isArray(blockResult.combinedBlockList)) {
          const blockList = blockResult.combinedBlockList;
          
          // Check if domain matches any blocked domain
          let matchedToken = null;
          let matchType = null;
          let shouldBlock = blockList.some(blockedDomain => {
            // Check for exact domain match
            if (blockedDomain === domain) { matchedToken = blockedDomain; matchType = 'domain'; return true; }
            
            // Check if current domain is a subdomain of a blocked domain
            if (domain.endsWith('.' + blockedDomain)) { matchedToken = blockedDomain; matchType = 'domain'; return true; }
            
            // Check if domain contains the blocked keyword
            // IMPORTANT: Extra check to ensure we're not blocking whitelisted domains
            if (domain.includes(blockedDomain) && !isWhitelisted(domain, whitelist)) { matchedToken = blockedDomain; matchType = blockedDomain.includes('.') ? 'domain' : 'keyword'; return true; }
            
            return false;
          });
          
          // Check keywords if not already blocked (keyword blocking is always enabled)
          if (!shouldBlock) {
            // Get block level to determine which default keywords to use
            const blockLevel = blockResult.block_level || 'normal';
            let keywordsToCheck = [];
            
            // Add default keywords based on level
            if (blockLevel === 'normal' && blockResult.DEFAULT_KEYWORDS_LITE) {
              keywordsToCheck.push(...blockResult.DEFAULT_KEYWORDS_LITE);
            } else if (blockLevel === 'strict' && blockResult.DEFAULT_KEYWORDS_BALANCED) {
              keywordsToCheck.push(...blockResult.DEFAULT_KEYWORDS_BALANCED);
            } else if (blockLevel === 'very-strict' && blockResult.DEFAULT_KEYWORDS_ULTIMATE) {
              keywordsToCheck.push(...blockResult.DEFAULT_KEYWORDS_ULTIMATE);
            }
            
            // Add custom keywords (limited for free users - handled by background.js)
            if (blockResult.custom_keywords && Array.isArray(blockResult.custom_keywords)) {
              keywordsToCheck.push(...blockResult.custom_keywords);
            }
            
            // Check if URL contains any keywords (only in main URL without query parameters)
            const urlWithoutParams = url.split('?')[0].split('#')[0].toLowerCase();
            shouldBlock = keywordsToCheck.some(keyword => {
              if (!keyword) return false;
              const keywordLower = keyword.toLowerCase();
              // Check only in main URL path (domain + path), exclude query parameters
              const hit = urlWithoutParams.includes(keywordLower);
              if (hit) { matchedToken = keyword; matchType = 'keyword'; }
              return hit;
            });
            
            if (shouldBlock) {
              console.log(`URL blocked by ${matchType}: ${matchedToken} -> ${url}`);
              try { chrome.runtime.sendMessage({ command: 'last_block_reason', matched: matchedToken, matchType }); } catch(_) {}
            }
          }
          
          console.log(`URL check for ${domain}: ${shouldBlock ? 'Blocked' : 'Allowed'}`);
          try { if (shouldBlock) chrome.runtime.sendMessage({ command: 'last_block_host', host: domain }); } catch(_) {}
          resolve(shouldBlock);
        } else {
          // Fallback to checking custom list only if combinedBlockList isn't available
          const customList = blockResult.CUSTOM_LIST_BLOCKED || [];
          const shouldBlock = customList.some(blockedDomain => {
            return domain === blockedDomain || domain.endsWith('.' + blockedDomain);
          });
          
          console.log(`URL check using fallback for ${domain}: ${shouldBlock ? 'Blocked' : 'Allowed'}`);
          resolve(shouldBlock);
        }
      });
    });
  });
}

// Helper function to extract domain from URL
function extractDomain(url) {
  try {
    if (!url) return '';
    
    // If the URL doesn't have a protocol, add one to parse it properly
    if (!url.startsWith('http') && !url.startsWith('file')) {
      url = 'http://' + url;
    }
    
    const parsedUrl = new URL(url);
    let domain = parsedUrl.hostname;
    
    // Remove 'www.' prefix if present
    domain = domain.replace(/^www\./, '');
    
    return domain;
  } catch (e) {
    console.error('Error extracting domain:', e);
    return url; // Return the original URL if parsing fails
  }
}

// Helper function to check if a domain is whitelisted
function isWhitelisted(domain, whitelist) {
  if (!whitelist || !Array.isArray(whitelist)) return false;
  
  // Convert domain to lowercase for case-insensitive comparison
  domain = domain.toLowerCase();
  
  // Check for exact domain match
  if (whitelist.includes(domain)) {
    console.log(`Domain exact match: ${domain} is whitelisted`);
    return true;
  }
  
  // Check for parent domain match (if the domain is a subdomain of a whitelisted domain)
  const domainParts = domain.split('.');
  for (let i = 0; i < domainParts.length - 1; i++) {
    const parentDomain = domainParts.slice(i).join('.');
    if (whitelist.includes(parentDomain)) {
      console.log(`Parent domain match: ${domain} is subdomain of whitelisted ${parentDomain}`);
      return true;
    }
  }
  
  // Check if this domain contains a whitelisted domain (special case for porn-related domains)
  for (const whitelistedDomain of whitelist) {
    // Skip empty entries
    if (!whitelistedDomain) continue;
    
    // Special case: whitelisted 'porn' or similar keywords in domains
    // For example, if pornhub.com is whitelisted, we should match against 'pornhub'
    const whitelistWithoutTld = whitelistedDomain.split('.')[0];
    if (whitelistWithoutTld.length > 3 && domain.includes(whitelistWithoutTld)) {
      console.log(`Keyword match: ${domain} contains whitelisted word ${whitelistWithoutTld}`);
      return true;
    }
  }
  
  return false;
}

/**
 * Enforce safe search on popular search engines
 * This function handles Google, Bing, Yahoo, DuckDuckGo, YouTube and Facebook
 */
function enforceSafeSearch() {
  try {
    // Get all relevant settings from storage
    chrome.storage.local.get(['ninja_config', 'safe_search_enabled', 'safe_search_options'], function(result) {
      // If extension is disabled completely, don't enforce safe search
      if (result.ninja_config && result.ninja_config.is_enable === false) {
        console.log("Ninja Adult Blocker: Extension disabled, not enforcing safe search");
        return;
      }
      
      // Check if safe search is enabled in the settings
      if (result.safe_search_enabled === false) {
        console.log("Ninja Adult Blocker: Safe search is disabled in settings, not enforcing");
        return;
      }
      
      // Safe search is enabled, get individual engine options
      const options = result.safe_search_options || {
        google: true,
        bing: true,
        yahoo: true,
        duckduckgo: true,
        youtube: true,
        facebook: true
      };
      
      console.log("Ninja Adult Blocker: Safe search enforcement active with options:", options);
      
      // Get the current URL
      const currentUrl = window.location.href;
      const hostname = location.hostname.replace(/^www\./, '');

      // Early domain guard: only apply safe-search on known engines/sites
      const SAFE_DOMAINS = [
        // search engines
        'google.com','google.' , 'bing.com','search.yahoo.com','duckduckgo.com',
        // video/search properties
        'youtube.com','m.youtube.com','facebook.com'
      ];
      const isSafeScope = SAFE_DOMAINS.some(d => d.endsWith('.') ? hostname.includes(d) : hostname === d || hostname.endsWith('.'+d));
      if (!isSafeScope) {
        return; // do nothing outside supported domains
      }
      console.log("Ninja Adult Blocker: Checking URL for safe search:", currentUrl);
      
      // GOOGLE: Using direct string replacement approach (which works well)
  if (options.google && currentUrl.indexOf('google.') !== -1) {
        if (currentUrl.indexOf('search') !== -1 && currentUrl.indexOf('q=') !== -1) {
          // Only add safe=strict if it's not already there
          if (currentUrl.indexOf('safe=') === -1) {
            console.log("Ninja Adult Blocker: Enforcing Google Safe Search");
            window.location.replace(currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'safe=strict');
            return; // Return early as we're already redirecting
          } 
          // If safe= exists but is not set to strict, replace it
          else if (currentUrl.indexOf('safe=strict') === -1) {
            console.log("Ninja Adult Blocker: Fixing Google Safe Search parameter");
            window.location.replace(currentUrl.replace(/safe=[^&]+/, 'safe=strict'));
            return;
          }
        }
      }
      
      // BING: Use the same direct approach as Google
  else if (options.bing && currentUrl.indexOf('bing.') !== -1) {
        // Force strict adult filtering on all Bing pages
        if (currentUrl.indexOf('adlt=') === -1) {
          // Add the adlt parameter if it doesn't exist
          console.log("Ninja Adult Blocker: Enforcing Bing Safe Search");
          
          // Set persistent cookie regardless of URL changes
          document.cookie = "SRCHHPGUSR=ADLT=STRICT; domain=.bing.com; path=/; secure; max-age=31536000";
          
          // Redirect with the parameter added
          window.location.replace(currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'adlt=strict');
          return;
        } 
        // If adlt exists but isn't strict, replace it
        else if (currentUrl.indexOf('adlt=strict') === -1) {
          console.log("Ninja Adult Blocker: Fixing Bing Safe Search parameter");
          document.cookie = "SRCHHPGUSR=ADLT=STRICT; domain=.bing.com; path=/; secure; max-age=31536000";
          window.location.replace(currentUrl.replace(/adlt=[^&]+/, 'adlt=strict'));
          return;
        }
        
        // Always set the cookie, even if URL parameters are correct
        document.cookie = "SRCHHPGUSR=ADLT=STRICT; domain=.bing.com; path=/; secure; max-age=31536000";
      }
      
      // DUCKDUCKGO: Use the same direct approach as Google
  else if (options.duckduckgo && currentUrl.indexOf('duckduckgo.') !== -1) {
        // Allow users to access settings (removed aggressive blocking)
        
        // Force kp=1 parameter (strict safe search)
        if (currentUrl.indexOf('kp=') === -1) {
          console.log("Ninja Adult Blocker: Enforcing DuckDuckGo Safe Search");
          document.cookie = "kp=1; domain=.duckduckgo.com; path=/; secure; max-age=31536000";  
          document.cookie = "p=-1; domain=.duckduckgo.com; path=/; secure; max-age=31536000";
          document.cookie = "safe_search=1; domain=.duckduckgo.com; path=/; secure; max-age=31536000";
          
          window.location.replace(currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'kp=1');
          return;
        } 
        // If kp exists but is not 1, replace it
        else if (currentUrl.indexOf('kp=1') === -1) {
          console.log("Ninja Adult Blocker: Fixing DuckDuckGo Safe Search parameter");
          document.cookie = "kp=1; domain=.duckduckgo.com; path=/; secure; max-age=31536000";
          document.cookie = "p=-1; domain=.duckduckgo.com; path=/; secure; max-age=31536000";
          document.cookie = "safe_search=1; domain=.duckduckgo.com; path=/; secure; max-age=31536000";
          
          window.location.replace(currentUrl.replace(/kp=[^&]+/, 'kp=1'));
          return;
        }
        
        // Always set these cookies to prevent the user from changing settings
        document.cookie = "kp=1; domain=.duckduckgo.com; path=/; secure; max-age=31536000";  
        document.cookie = "p=-1; domain=.duckduckgo.com; path=/; secure; max-age=31536000";
        document.cookie = "safe_search=1; domain=.duckduckgo.com; path=/; secure; max-age=31536000";
        
        // Create MutationObserver to monitor for safe search UI elements and override them
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', setupDDGObserver);
        } else {
          setupDDGObserver();
        }
        
        function setupDDGObserver() {
          // Look for any safe search setting elements and force them to strict
          const observer = new MutationObserver(function(mutations) {
            const safeSearchElems = document.querySelectorAll('[data-settings-key="kp"]');
            safeSearchElems.forEach(elem => {
              // Force the setting to strict visually
              if (elem.tagName === 'SELECT') {
                elem.value = '1';
                elem.disabled = true;
              }
            });
          });
          
          observer.observe(document.body, { childList: true, subtree: true });
        }
      }
      
      // YOUTUBE: Use direct approach similar to Google
  else if (options.youtube && currentUrl.indexOf('youtube.') !== -1) {
        // Allow users to access settings (removed aggressive blocking)
        
        // For search results, enforce restrict=strict parameter
        if (currentUrl.indexOf('/results') !== -1) {
          if (currentUrl.indexOf('restrict=') === -1) {
            console.log("Ninja Adult Blocker: Enforcing YouTube Restricted Mode for search");
            window.location.replace(currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'restrict=strict');
            return;
          } 
          else if (currentUrl.indexOf('restrict=strict') === -1) {
            console.log("Ninja Adult Blocker: Fixing YouTube Restricted Mode parameter");
            window.location.replace(currentUrl.replace(/restrict=[^&]+/, 'restrict=strict'));
            return;
          }
        }
        
        // Always set the restricted mode cookies
        document.cookie = "PREF=f2=8000000&f5=30; domain=.youtube.com; path=/; secure; max-age=31536000";
        document.cookie = "VISITOR_INFO1_LIVE=ST1Ti53r4fU; domain=.youtube.com; path=/; secure; max-age=31536000";
        
        // Set up cookies periodically (reduced frequency for better UX)
        function setupYTCookies() {
          setInterval(function() {
            document.cookie = "PREF=f2=8000000&f5=30; domain=.youtube.com; path=/; secure; max-age=31536000";
            document.cookie = "VISITOR_INFO1_LIVE=ST1Ti53r4fU; domain=.youtube.com; path=/; secure; max-age=31536000";
          }, 30000); // Reduced to every 30 seconds (was 3 seconds)
          
          // Try to force restricted mode through direct DOM manipulation
          const observer = new MutationObserver(function(mutations) {
            // Find and click any restricted mode buttons
            const restrictedModeSwitches = document.querySelectorAll('[aria-label*="Restricted Mode"]');
            restrictedModeSwitches.forEach(elem => {
              if (elem.getAttribute('aria-pressed') === 'false') {
                console.log("Ninja Adult Blocker: Found Restricted Mode switch, activating");
                elem.click();
              }
            });
          });
          
          observer.observe(document.body, { childList: true, subtree: true });
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', setupYTCookies);
        } else {
          setupYTCookies();
        }
      }
      
      // Facebook Safe Search
  else if (options.facebook && currentUrl.indexOf('facebook.') !== -1) {
        // Check if it's a search URL with a query parameter
        if (currentUrl.indexOf('q=') !== -1 && currentUrl.indexOf('&safe=strict') === -1) {
          window.location.replace(currentUrl + '&safe=strict');
          return; // Return early as we're already redirecting
        }
      }
      
      // Yahoo Safe Search
  else if (options.yahoo && currentUrl.indexOf('search.yahoo.') !== -1) {
        // Yahoo uses 'vm=r' parameter
        if (currentUrl.indexOf('vm=') === -1) {
          console.log("Ninja Adult Blocker: Enforcing Yahoo Safe Search");
          window.location.replace(currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'vm=r');
          return;
        } 
        else if (currentUrl.indexOf('vm=r') === -1) {
          console.log("Ninja Adult Blocker: Fixing Yahoo Safe Search parameter");
          window.location.replace(currentUrl.replace(/vm=[^&]+/, 'vm=r'));
          return;
        }
      }
    });
  } catch (error) {
    console.error('Error enforcing safe search:', error);
  }
}

/**
 * Add a new site to the block list
 */
function addSiteToBlockList(site) {
  return new Promise((resolve, reject) => {
    try {
      // Extract domain if full URL is provided
      let domain = extractDomain(site);
      
      chrome.storage.local.get(['blocked_sites'], function(result) {
        let blockedSites = result.blocked_sites || [];
        
        // Check if site is already in the list
        if (blockedSites.includes(domain)) {
          return resolve({
            success: true,
            message: 'Site already in block list',
            domain: domain,
            alreadyExists: true
          });
        }
        
        // Add site to block list
        blockedSites.push(domain);
        
        // Save updated block list
        chrome.storage.local.set({ blocked_sites: blockedSites }, function() {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          
          // Use proper command to update rules
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ 
              command: 'update_block_list' 
            }, function(response) {
              console.log('Block list update response:', response);
              
              // Force reload of URL lists to ensure everything is in sync
              chrome.runtime.sendMessage({ 
                command: 'reload_url_lists' 
              }, function(reloadResponse) {
                console.log('Reload URL lists response:', reloadResponse);
                
                resolve({
                  success: true,
                  message: 'Site added to block list and rules updated',
                  domain: domain,
                  alreadyExists: false,
                  ruleUpdateResponse: response,
                  reloadResponse: reloadResponse
                });
              });
            });
          } else {
            resolve({
              success: true,
              message: 'Site added to block list, but rule update failed',
              domain: domain,
              alreadyExists: false
            });
          }
        });
      });
    } catch (error) {
      console.error('Error in addSiteToBlockList:', error);
      reject(error);
    }
  });
}

// Make functions available in global scope
window.shouldBlockUrl = shouldBlockUrl;
window.addSiteToBlockList = addSiteToBlockList;
window.extractDomain = extractDomain;

// Initialize safe search on page load
enforceSafeSearch();

// Early fallback block at document_start using combinedBlockList
(function earlyBlockFallback(){
  try {
  const url = window.location.href;
  const domain = extractDomain(url);
  chrome.storage.local.get([
    'whitelisted_sites',
    'combinedBlockList',
    'ninja_config',
    'keyword_blocking_enabled',
    'custom_keywords',
    'block_level',
    'DEFAULT_KEYWORDS_LITE',
    'DEFAULT_KEYWORDS_BALANCED',
    'DEFAULT_KEYWORDS_ULTIMATE',
    'block_action',
    'custom_redirect_url'
  ], function(res){
      if (res?.ninja_config && res.ninja_config.is_enable === false) return;
      const wl = res.whitelisted_sites || [];
      if (isWhitelisted(domain, wl)) return;
      const list = res.combinedBlockList || [];
      // match exact/suffix or keyword substring
      let should = list.some(token => {
        if (!token) return false;
        // Only treat tokens with a dot as domains (TLD or subdomain)
        if (token.includes('.')) {
          return domain === token || domain.endsWith('.' + token);
        }
        // Tokens without dot are not treated as domain matches (avoid path/substring blocks)
        return false;
      });
      
      // Check keywords if not already blocked (keyword blocking is always enabled)
      if (!should) {
        const blockLevel = res.block_level || 'normal';
        let keywordsToCheck = [];
        const FALLBACK_KWS = [
          'porn','xxx','adult','nude','naked','nsfw','escort','onlyfans','chaturbate'
        ];
        
        // Add default keywords based on level
        if (blockLevel === 'normal') {
          const arr = (res.DEFAULT_KEYWORDS_LITE && res.DEFAULT_KEYWORDS_LITE.length) ? res.DEFAULT_KEYWORDS_LITE : FALLBACK_KWS;
          keywordsToCheck.push(...arr);
        } else if (blockLevel === 'strict') {
          const arr = (res.DEFAULT_KEYWORDS_BALANCED && res.DEFAULT_KEYWORDS_BALANCED.length) ? res.DEFAULT_KEYWORDS_BALANCED : FALLBACK_KWS;
          keywordsToCheck.push(...arr);
        } else if (blockLevel === 'very-strict') {
          const arr = (res.DEFAULT_KEYWORDS_ULTIMATE && res.DEFAULT_KEYWORDS_ULTIMATE.length) ? res.DEFAULT_KEYWORDS_ULTIMATE : FALLBACK_KWS;
          keywordsToCheck.push(...arr);
        }
        
        // Add custom keywords
        if (res.custom_keywords && Array.isArray(res.custom_keywords)) {
          keywordsToCheck.push(...res.custom_keywords);
        }
        
        // Check if URL contains any keywords (only in main URL without query parameters)
        const urlWithoutParams = url.split('?')[0].split('#')[0].toLowerCase();
        should = keywordsToCheck.some(keyword => {
          if (!keyword) return false;
          return urlWithoutParams.includes(keyword.toLowerCase());
        });
      }
      
      if (should) {
        const action = (res && res.block_action) ? res.block_action : 'custom-page';
        const customUrl = (res && res.custom_redirect_url) ? res.custom_redirect_url : '';
        let targetUrl = '';
        if (action === 'redirect' && customUrl) {
          targetUrl = customUrl;
        } else if (action === 'error-page') {
          // Content scripts cannot show native error pages, approximate with REFUSED
          targetUrl = 'http://127.0.0.1:9';
        } else if (action === 'stealth-nxdomain') {
          // Use the original full URL in data URL for a more realistic NXDOMAIN-like feel
          targetUrl = `data:${url}`;
        } else if (action === 'stealth-refused') {
          targetUrl = 'http://127.0.0.1:9';
        } else if (action === 'stealth-reset') {
          targetUrl = 'http://1.1.1.1:81';
        } else if (action === 'stealth-timeout') {
          targetUrl = 'http://10.255.255.1';
        } else if (action === 'stealth-back') {
          const html = encodeURIComponent('<!doctype html><meta charset="utf-8"><title>—</title><script>try{if(history.length>1){history.back()}else{location.replace("https://www.google.com")}}catch(e){location.replace("https://www.google.com")}</script>');
          targetUrl = `data:text/html;charset=utf-8,${html}`;
        } else {
          // custom-page (default) — pass original URL for display
          const base = chrome.runtime.getURL('blocked.html');
          targetUrl = `${base}?url=${encodeURIComponent(url)}`;
        }
        try { window.stop && window.stop(); } catch (_e) {}
        window.location.replace(targetUrl);
      }
    });
  } catch (e) { /* no-op */ }
})();