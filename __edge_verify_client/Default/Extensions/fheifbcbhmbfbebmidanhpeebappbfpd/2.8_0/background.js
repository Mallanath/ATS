// Background script for Ninja Adult Blocker

// Global variables
let ninja_data = null;
var FULL_LIST_BLOCKED = []; // Will be loaded from url.js
var FREE_LIST_BLOCKED = []; // Will be loaded from url.js
var CUSTOM_LIST_BLOCKED = []; // Custom sites added by the user
var CUSTOM_KEYWORDS = []; // Custom keywords added by the user
var DEFAULT_KEYWORDS_LITE = []; // Default keywords for Lite level
var DEFAULT_KEYWORDS_BALANCED = []; // Default keywords for Balanced level
var DEFAULT_KEYWORDS_ULTIMATE = []; // Default keywords for Ultimate level

// Debug flag (can be controlled via storage key: debug_enabled)
let DEBUG = true;
// User-selected icon theme
let ICON_THEME = 'classic';
let PREMIUM_ACTIVE = false; // cached flag
let ICON_TRIAL = null; // { theme, endsAt, previousTheme }
let ICON_TRIAL_TICK_TIMER = null; // timeout id for next tick
let ICON_TRIAL_END_TIMER = null; // timeout id for end

// Normalize and validate theme names
function normalizeTheme(name) {
  try {
    const t = String(name || '').toLowerCase();
    const supported = new Set(['classic','dark','blue','pink','purple','orange','red','teal','gray','hidden']);
    return supported.has(t) ? t : 'classic';
  } catch(_) {
    return 'classic';
  }
}

// Premium-only themes
const PREMIUM_THEMES = new Set(['hidden']);

function isPremiumTheme(theme) {
  return PREMIUM_THEMES.has(theme);
}

function startIconTrial(theme, previousTheme) {
  const now = Date.now();
  const endsAt = now + 60 * 1000; // 60 seconds
  ICON_TRIAL = { theme, endsAt, previousTheme };
  chrome.storage.local.set({ icon_trial: ICON_TRIAL });
  scheduleIconTrialTick(250);
  scheduleIconTrialEnd(endsAt - Date.now());
  debugLog('Icon trial started for theme', theme, 'until', new Date(endsAt).toISOString());
}

function clearIconTrial() {
  ICON_TRIAL = null;
  chrome.storage.local.remove('icon_trial');
  if (ICON_TRIAL_TICK_TIMER) { clearTimeout(ICON_TRIAL_TICK_TIMER); ICON_TRIAL_TICK_TIMER = null; }
  if (ICON_TRIAL_END_TIMER) { clearTimeout(ICON_TRIAL_END_TIMER); ICON_TRIAL_END_TIMER = null; }
}

function broadcastIconTrialTick() {
  if (!ICON_TRIAL) return;
  const remainingMs = Math.max(0, ICON_TRIAL.endsAt - Date.now());
  chrome.runtime.sendMessage({ command: 'icon_trial_tick', remainingMs });
  if (remainingMs > 0) scheduleIconTrialTick(1000);
}
function scheduleIconTrialTick(delayMs) {
  if (ICON_TRIAL_TICK_TIMER) clearTimeout(ICON_TRIAL_TICK_TIMER);
  ICON_TRIAL_TICK_TIMER = setTimeout(() => {
    ICON_TRIAL_TICK_TIMER = null;
    broadcastIconTrialTick();
  }, Math.max(0, delayMs || 1000));
}

function scheduleIconTrialEnd(delayMs) {
  if (ICON_TRIAL_END_TIMER) clearTimeout(ICON_TRIAL_END_TIMER);
  ICON_TRIAL_END_TIMER = setTimeout(() => {
    ICON_TRIAL_END_TIMER = null;
    try {
      chrome.storage.local.get(['premium_active','icon_theme','ninja_config'], function(s){
        const premium = s.premium_active === true;
        // If a trial exists and user is not premium, revert to previous theme unconditionally
        if (!premium && ICON_TRIAL) {
          const back = normalizeTheme(ICON_TRIAL.previousTheme || 'classic');
          debugLog('Icon trial ended. Reverting theme to', back);
          ICON_THEME = back;
          chrome.storage.local.set({ icon_theme: back });
          chrome.runtime.sendMessage({ command: 'icon_trial_ended', revertedTo: back });
          const isEnabled = s.ninja_config?.is_enable !== false;
          setThemedIcon(isEnabled);
        }
        clearIconTrial();
      });
    } catch(_) { clearIconTrial(); }
  }, Math.max(0, delayMs || 5 * 1000));
}

// Concurrency guard for dynamic rules updates (single-flight with coalescing)
let RULES_UPDATE_IN_PROGRESS = false;
let PENDING_SITE_LIST = null; // holds latest requested siteList while an update is running
let CURRENT_RULES_JOB_SEQ = 0; // increasing sequence for diagnostics

// Helper to expose build state to settings UI
function setRulesBuildActive(active, jobSeq) {
  try {
    chrome.storage.local.set({
      RULES_BUILD_ACTIVE: !!active,
      RULES_BUILD_SEQ: typeof jobSeq === 'number' ? jobSeq : CURRENT_RULES_JOB_SEQ,
      RULES_BUILD_UPDATED_AT: Date.now()
    });
  } catch (e) {
    debugError('Failed to set RULES_BUILD_ACTIVE:', e);
  }
}

// Add debugging timestamps to all log messages
function debugLog(message, ...args) {
  if (!DEBUG) return;
  const timestamp = new Date().toISOString();
  console.log(`DEBUG [${timestamp}]: ${message}`, ...args);
}

function debugError(message, ...args) {
  if (!DEBUG) return;
  const timestamp = new Date().toISOString();
  console.error(`DEBUG ERROR [${timestamp}]: ${message}`, ...args);
}

// Build icon path map based on theme and enabled state.
function getIconPaths(enabled) {
  const base = 'assets/images/';
  const icon = enabled ? 'ninja-enable.png' : 'ninja-disable.png';
  return {
    path: {
      '16': base + icon,
      '19': base + icon,
      '24': base + icon,
      '32': base + icon,
      '38': base + icon,
      '48': base + icon,
      '128': base + icon
    }
  };
}

// Build path map for themed icons (single PNG per theme for all sizes)
function getThemedIconPaths(theme) {
  const base = 'assets/images/';
  const fileMap = {
    dark: 'ninja-dark.png',
    blue: 'ninja-blue.png',
    pink: 'ninja-pink.png',
    purple: 'ninja-purple.png',
    orange: 'ninja-orange.png',
    red: 'ninja-red.png',
    teal: 'ninja-teal.png',
    gray: 'ninja-gray.png',
    hidden: 'ninja-hidden.png'
  };
  const fname = fileMap[theme];
  if (!fname) return null;
  const full = base + fname;
  return {
    path: {
      '16': full,
      '19': full,
      '24': full,
      '32': full,
      '38': full,
      '48': full,
      '128': full
    }
  };
}

function setThemedIcon(enabled) {
  try {
    const theme = normalizeTheme(ICON_THEME || 'classic');
    const isEnabled = !!enabled;
    debugLog(`setThemedIcon -> theme: ${theme}, enabled: ${isEnabled}`);
    // If protection is disabled, always show the standard disabled icon
    if (!isEnabled) {
      debugLog('Protection disabled: using ninja-disable.png');
      chrome.action.setIcon(getIconPaths(false));
      return;
    }
    if (theme === 'classic') {
      debugLog('Using classic PNG icons');
      chrome.action.setIcon(getIconPaths(true));
      return;
    }
    // Try to use provided themed PNGs first
    const themedPaths = getThemedIconPaths(theme);
    if (themedPaths) {
      debugLog(`Using themed PNG icon for theme '${theme}'`);
      chrome.action.setIcon(themedPaths);
      return;
    }
    // Fallbacks: hidden -> transparent, others -> solid color ImageData
    const sizes = [16, 19, 24, 32, 38, 48, 128];
    if (theme === 'hidden') {
      const imageDataMap = {};
      debugLog('Using hidden (transparent) icons (fallback) for all sizes');
      for (const sz of sizes) imageDataMap[sz] = createTransparentImageData(sz);
      chrome.action.setIcon({ imageData: imageDataMap });
      return;
    }
    const pal = getPalette(theme);
    const color = pal.bg1 || '#000000';
    const imageDataMap = {};
    debugLog(`Using solid color for theme '${theme}' (fallback): ${color}`);
    for (const sz of sizes) imageDataMap[sz] = createSolidImageData(color, sz);
    chrome.action.setIcon({ imageData: imageDataMap });
  } catch (e) {
    debugError('Failed to set themed icon:', e);
    try { chrome.action.setIcon(getIconPaths(enabled)); } catch(_) {}
  }
}

function getPalette(theme) {
  const palettes = {
  dark:   { bg1: '#0f172a', bg2: '#111827', fg: '#e5e7eb', accent: '#10b981' },
  blue:   { bg1: '#3b82f6', bg2: '#2563eb', fg: '#ffffff', accent: '#93c5fd' },
  pink:   { bg1: '#ec4899', bg2: '#db2777', fg: '#fff1f2', accent: '#fbcfe8' },
  purple: { bg1: '#8b5cf6', bg2: '#7c3aed', fg: '#f5f3ff', accent: '#c4b5fd' },
  orange: { bg1: '#f59e0b', bg2: '#d97706', fg: '#fff7ed', accent: '#fed7aa' },
  red:    { bg1: '#ef4444', bg2: '#dc2626', fg: '#fff1f2', accent: '#fecaca' },
  teal:   { bg1: '#14b8a6', bg2: '#0d9488', fg: '#ecfeff', accent: '#99f6e4' },
  gray:   { bg1: '#6b7280', bg2: '#4b5563', fg: '#f8fafc', accent: '#e5e7eb' },
  classic:{ bg1: '#22c55e', bg2: '#16a34a', fg: '#ffffff', accent: '#bbf7d0' }
  };
  return palettes[theme] || palettes.classic;
}

function hexToRgba(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b, 255];
}

function safeCreateImageData(size) {
  try {
    if (typeof ImageData === 'function') {
      return new ImageData(size, size);
    }
  } catch(_) {}
  try {
    if (typeof OffscreenCanvas === 'function') {
      const c = new OffscreenCanvas(size, size);
      const ctx = c.getContext('2d');
      return ctx.createImageData(size, size);
    }
  } catch(_) {}
  // Fallback minimal
  return { data: new Uint8ClampedArray(size * size * 4), width: size, height: size };
}

function createSolidImageData(hex, size) {
  const [r, g, b, a] = hexToRgba(hex);
  const img = safeCreateImageData(size);
  const data = img.data || new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = a;
  }
  return (typeof ImageData === 'function') ? new ImageData(data, size, size) : img;
}

function createTransparentImageData(size) {
  const img = safeCreateImageData(size);
  if (img.data) img.data.fill(0);
  return (typeof ImageData === 'function') ? new ImageData(img.data, size, size) : img;
}

function generateIconImageData(theme, enabled, size) {
  // Draw a simple ninja band icon with different palettes per theme
  const palettes = { dark:1 };// placeholder to keep function structure; using getPalette instead
  if (theme === 'hidden') {
    // Return fully transparent image for stealth mode
    const c = new OffscreenCanvas(size, size);
    const x = c.getContext('2d');
    x.clearRect(0, 0, size, size);
    return x.getImageData(0, 0, size, size);
  }
  const p = getPalette(theme);
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

    // Background rounded rect with gradient
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, p.bg1);
    grad.addColorStop(1, p.bg2);
    ctx.fillStyle = grad;
    const radius = Math.max(3, Math.round(size * 0.18));
    roundRect(ctx, 0, 0, size, size, radius);
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, 1, 1, size - 2, size - 2, radius - 1);
    ctx.fill();

    // Ninja band
    const bandH = Math.max(3, Math.round(size * 0.28));
    const bandY = Math.round(size * 0.30);
    ctx.fillStyle = enabled ? p.fg : 'rgba(255,255,255,0.75)';
    roundRect(ctx, Math.round(size * 0.12), bandY, Math.round(size * 0.76), bandH, Math.round(bandH/2));
    ctx.fill();

    // Eyes
    const eyeW = Math.max(2, Math.round(size * 0.14));
    const eyeH = Math.max(2, Math.round(size * 0.12));
    const eyeY = bandY + Math.round((bandH - eyeH) / 2);
    const eyeGap = Math.max(2, Math.round(size * 0.10));
    const totalEyesW = eyeW * 2 + eyeGap;
    const eyesX = Math.round((size - totalEyesW) / 2);
    ctx.fillStyle = enabled ? p.bg1 : '#9ca3af';
    roundRect(ctx, eyesX, eyeY, eyeW, eyeH, Math.ceil(eyeH/2));
    ctx.fill();
    roundRect(ctx, eyesX + eyeW + eyeGap, eyeY, eyeW, eyeH, Math.ceil(eyeH/2));
    ctx.fill();

    // Accent bar
    ctx.fillStyle = enabled ? p.accent : 'rgba(255,255,255,0.2)';
    const barH = Math.max(1, Math.round(size * 0.07));
    roundRect(ctx, Math.round(size * 0.28), size - barH - Math.round(size * 0.10), Math.round(size * 0.44), barH, Math.ceil(barH/2));
    ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.floor(Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Normalize a list of entries to valid tokens (domains/keywords), dedupe, and clean
function normalizeList(items) {
  if (!Array.isArray(items)) return [];
  const cleaned = new Set();

  for (let raw of items) {
    if (!raw || typeof raw !== 'string') continue;
    let s = raw.trim().toLowerCase();
    if (!s) continue;

    // Strip quotes and spaces
    s = s.replace(/^['"\s]+|['"\s]+$/g, '');

    // If looks like a URL, extract hostname
    try {
      if (/^([a-z]+:)?\/\//.test(s)) {
        s = new URL(s).hostname;
      }
    } catch (_) {}

    // Remove common prefixes and wildcards
    s = s.replace(/^\*\./, '');
    s = s.replace(/^www\./, '');
    s = s.replace(/\/$/, '');

    // If contains spaces or invalid chars, skip
    if (/\s/.test(s)) continue;

    // Keep either domains (contain a dot) or safe keywords (alnum/hyphen, len>=3)
    const isDomain = s.includes('.') && /^[a-z0-9.-]+$/.test(s) && !s.startsWith('.') && !s.endsWith('.') && !s.includes('..');
    const isKeyword = !s.includes('.') && /^[a-z0-9-]{3,}$/.test(s);
    if (isDomain || isKeyword) {
      cleaned.add(s);
    }
  }
  return Array.from(cleaned);
}

// Filter tokens against whitelist to reduce false positives (keywords inside whitelisted domains)
function filterAgainstWhitelist(list, whitelist) {
  if (!Array.isArray(list)) return [];
  const wl = Array.isArray(whitelist) ? whitelist.map(d => String(d).toLowerCase()) : [];
  return list.filter(token => {
    if (!token) return false;
    // exact/suffix domain exclusion
    if (token.includes('.')) {
      return !wl.some(w => token === w || token.endsWith('.' + w));
    }
    // keyword: drop if any whitelist domain contains the keyword
    return !wl.some(w => w.includes(token));
  });
}

// Cap list to a max size (to stay under dynamic rules limits)
function capList(list, limit) {
  if (!Array.isArray(list)) return [];
  const cap = Math.max(0, limit || 4800);
  return list.slice(0, cap);
}

// Initialize without overwriting existing config; also pick up debug flag
chrome.storage.local.get(['ninja_config', 'debug_enabled', 'icon_theme'], function (res) {
  if (typeof res.debug_enabled === 'boolean') {
    DEBUG = res.debug_enabled;
  }
  if (typeof res.icon_theme === 'string') {
    ICON_THEME = normalizeTheme(res.icon_theme);
    debugLog(`Loaded icon theme from storage: ${ICON_THEME}`);
  }
  try {
    chrome.storage.local.get(['premium_active','icon_trial'], function(s){
      PREMIUM_ACTIVE = s.premium_active === true;
      if (s.icon_trial && s.icon_trial.theme && s.icon_trial.endsAt) {
        ICON_TRIAL = s.icon_trial;
        debugLog('Restored icon trial from storage:', ICON_TRIAL);
        // Resume or finalize trial after service worker restart
        const remaining = Math.max(0, ICON_TRIAL.endsAt - Date.now());
        if (remaining > 0) {
          // Keep ticking and schedule the end
          scheduleIconTrialTick(250);
          scheduleIconTrialEnd(remaining);
        } else {
          // Trial already expired while SW was asleep — revert immediately if needed
          try {
            chrome.storage.local.get(['premium_active','icon_theme','ninja_config'], function(ss){
              const premium = ss.premium_active === true;
              if (!premium && ICON_TRIAL) {
                const back = normalizeTheme(ICON_TRIAL.previousTheme || 'classic');
                debugLog('Restored trial is past due. Reverting theme to', back);
                ICON_THEME = back;
                chrome.storage.local.set({ icon_theme: back });
                chrome.runtime.sendMessage({ command: 'icon_trial_ended', revertedTo: back });
                const isEnabled = ss.ninja_config?.is_enable !== false;
                setThemedIcon(isEnabled);
              }
              clearIconTrial();
            });
          } catch(_) {
            clearIconTrial();
          }
        }
      }
    });
  } catch(_) {}
  // Set initial icon according to current state and selected theme
  try {
    const isEnabled = res.ninja_config?.is_enable !== false;
    setThemedIcon(isEnabled);
  } catch(_) {}
  if (!res.ninja_config) {
    const ninja_config = { is_enable: true, version: "2.8" };
    chrome.storage.local.set({ ninja_config }, function () {
      debugLog('Ninja Adult Blocker initialized with default config v2.8');
    });
  } else if (res.ninja_config && !res.ninja_config.version) {
    // Backfill version only
    chrome.storage.local.set({ ninja_config: { ...res.ninja_config, version: "2.8" } });
  }

  // Load lists then update rules
  debugLog('Loading URL lists and keywords on startup');
  Promise.all([loadUrlLists(), loadDefaultKeywords()]).then(() => {
    debugLog('URL lists and keywords loaded, initializing rules based on ninja status');
    updateRulesBasedOnNinjaStatus();
  }).catch(error => {
    debugError('Failed to load URL lists or keywords on startup', error);
  });
});

// Function to handle enable/disable state changes
function _ninja_isDisable() {
  debugLog("Checking extension enabled/disabled state");
  chrome.storage.local.get(['ninja_config'], function (result) {
    if (result.ninja_config && typeof result.ninja_config.is_enable !== 'undefined') {
      if (result.ninja_config.is_enable) {
        // Enable the blocker
  debugLog("Extension is enabled, setting icon and loading rules");
  setThemedIcon(true);
        loadUrlLists().then(() => {
          updateRulesBasedOnNinjaStatus();
        });
      } else {
        // Disable the blocker
  debugLog("Extension is disabled, setting icon and removing rules");
  setThemedIcon(false);
        
        // Remove all blocking rules
        let ruleIdsToRemove = Array.from({ length: 5000 }, (_, i) => i + 1);
        debugLog(`Removing all rules (${ruleIdsToRemove.length} possible IDs)`);
        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIdsToRemove }, function () {
          if (chrome.runtime.lastError) {
            debugError('Failed to remove rules', chrome.runtime.lastError.message);
          } else {
            debugLog('All rules removed successfully');
          }
          setRulesBuildActive(false);
        });
      }
    } else {
      debugError("ninja_config missing or invalid", result);
    }
  });
}

// Function to load default keywords from default-keywords.js
function loadDefaultKeywords() {
  debugLog("Loading default keywords (JSON)");
  return new Promise((resolve) => {
    const keywordsPath = chrome.runtime.getURL('assets/js/default-keywords.json');
    debugLog(`Fetching default keywords from: ${keywordsPath}`);
    fetch(keywordsPath)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to fetch default-keywords.json: ${response.status}`);
        return response.json();
      })
      .then((keywordsObj) => {
        try {
          DEFAULT_KEYWORDS_LITE = Array.isArray(keywordsObj?.LITE) ? keywordsObj.LITE : [];
          DEFAULT_KEYWORDS_BALANCED = Array.isArray(keywordsObj?.BALANCED) ? keywordsObj.BALANCED : [];
          DEFAULT_KEYWORDS_ULTIMATE = Array.isArray(keywordsObj?.ULTIMATE) ? keywordsObj.ULTIMATE : [];
          debugLog(`Loaded default keywords - Lite: ${DEFAULT_KEYWORDS_LITE.length}, Balanced: ${DEFAULT_KEYWORDS_BALANCED.length}, Ultimate: ${DEFAULT_KEYWORDS_ULTIMATE.length}`);
          chrome.storage.local.set({
            DEFAULT_KEYWORDS_LITE,
            DEFAULT_KEYWORDS_BALANCED,
            DEFAULT_KEYWORDS_ULTIMATE
          }, resolve);
        } catch (e) {
          debugError('Error setting default keywords from JSON:', e);
          resolve();
        }
      })
      .catch((error) => {
        debugError('Failed to load default keywords JSON:', error);
        // Fallback: load from storage if present
        chrome.storage.local.get(['DEFAULT_KEYWORDS_LITE', 'DEFAULT_KEYWORDS_BALANCED', 'DEFAULT_KEYWORDS_ULTIMATE'], function(result) {
          DEFAULT_KEYWORDS_LITE = result.DEFAULT_KEYWORDS_LITE || [];
          DEFAULT_KEYWORDS_BALANCED = result.DEFAULT_KEYWORDS_BALANCED || [];
          DEFAULT_KEYWORDS_ULTIMATE = result.DEFAULT_KEYWORDS_ULTIMATE || [];
          debugLog(`Loaded keywords from storage - Lite: ${DEFAULT_KEYWORDS_LITE.length}, Balanced: ${DEFAULT_KEYWORDS_BALANCED.length}, Ultimate: ${DEFAULT_KEYWORDS_ULTIMATE.length}`);
          resolve();
        });
      });
  });
}

// Function to load the URL lists from url.js
function loadUrlLists() {
  debugLog("Starting to load URL lists");
  return new Promise((resolve, reject) => {
    try {
      // Import the url.js file to get the FULL_LIST_BLOCKED array
      const urlJsPath = chrome.runtime.getURL('assets/js/url.js');
      debugLog(`Fetching URL lists from: ${urlJsPath}`);
      
      fetch(urlJsPath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch url.js: ${response.status} ${response.statusText}`);
          }
          return response.text();
        })
        .then(jsCode => {
          debugLog("url.js fetched successfully, parsing lists");
          // Handle the BALANCED (renamed) or legacy FULL list extraction
          const balancedListMatch = jsCode.match(/(?:var|const)\s+BALANCED_LIST_BLOCKED\s*=\s*\[([\s\S]*?)\];/);
          const fullListMatch = balancedListMatch || jsCode.match(/(?:var|const)\s+FULL_LIST_BLOCKED\s*=\s*\[([\s\S]*?)\];/);
          const ultimateListMatch = jsCode.match(/(?:var|const)\s+ULTIMATE_LIST_KEYWORDS\s*=\s*\[([\s\S]*?)\];/);
          const freeListMatch = jsCode.match(/const\s+FREE_LIST_BLOCKED\s*=\s*\[([\s\S]*?)\];/);
          
          if (fullListMatch && fullListMatch[1]) {
            try {
              // Clean up the array content - remove comments and fix formatting
              let arrayContent = fullListMatch[1];
              // Remove comment lines and clean up
              arrayContent = arrayContent.replace(/\/\*\*\*.*?\*\//g, ''); // Remove block comments
              arrayContent = arrayContent.replace(/\/\/.*$/gm, ''); // Remove line comments
              arrayContent = arrayContent.replace(/\s+/g, ' ').trim(); // Clean up whitespace
              
              // Split the array by commas, clean each entry, and filter empty entries
              FULL_LIST_BLOCKED = arrayContent.split(',')
                .map(item => {
                  // Extract the string content between quotes
                  const match = item.trim().match(/^["'](.*)["']$/);
                  return match ? match[1] : '';
                })
                .filter(item => item !== '');
              
              debugLog(`Successfully parsed BALANCED/FULL list with ${FULL_LIST_BLOCKED.length} items`);
            } catch (parseError) {
              debugError('Error parsing FULL_LIST_BLOCKED:', parseError);
              // Initialize with an empty array to prevent errors
              FULL_LIST_BLOCKED = [];
            }
          } else {
            debugError('Could not find BALANCED_LIST_BLOCKED or FULL_LIST_BLOCKED in url.js');
          }
          
          if (freeListMatch && freeListMatch[1]) {
            try {
              // Similar clean up for FREE_LIST_BLOCKED
              let arrayContent = freeListMatch[1];
              // Remove comment lines and clean up
              arrayContent = arrayContent.replace(/\/\*\*\*.*?\*\//g, ''); // Remove block comments
              arrayContent = arrayContent.replace(/\/\/.*$/gm, ''); // Remove line comments
              arrayContent = arrayContent.replace(/\s+/g, ' ').trim(); // Clean up whitespace
              
              // Split the array by commas, clean each entry, and filter empty entries
              FREE_LIST_BLOCKED = arrayContent.split(',')
                .map(item => {
                  // Extract the string content between quotes
                  const match = item.trim().match(/^["'](.*)["']$/);
                  return match ? match[1] : '';
                })
                .filter(item => item !== '');
              
              debugLog(`Successfully parsed FREE_LIST_BLOCKED with ${FREE_LIST_BLOCKED.length} items`);
            } catch (parseError) {
              debugError('Error parsing FREE_LIST_BLOCKED:', parseError);
              // Initialize with an empty array to prevent errors
              FREE_LIST_BLOCKED = [];
            }
          } else {
            debugError('Could not find FREE_LIST_BLOCKED in url.js');
          }
          
          // Normalize lists before saving
          FULL_LIST_BLOCKED = normalizeList(FULL_LIST_BLOCKED);
          FREE_LIST_BLOCKED = normalizeList(FREE_LIST_BLOCKED);
          let ULTIMATE_LIST_KEYWORDS_ARR = [];
          if (ultimateListMatch && ultimateListMatch[1]) {
            try {
              let arrayContent = ultimateListMatch[1]
                .replace(/\/\*\*\*.*?\*\//g, '')
                .replace(/\/\/.*$/gm, '')
                .replace(/\s+/g, ' ').trim();
              ULTIMATE_LIST_KEYWORDS_ARR = arrayContent.split(',')
                .map(item => {
                  const match = item.trim().match(/^["'](.*)["']$/);
                  return match ? match[1] : '';
                })
                .filter(Boolean);
            } catch (e) {
              debugError('Error parsing ULTIMATE_LIST_KEYWORDS:', e);
            }
          }
          ULTIMATE_LIST_KEYWORDS_ARR = normalizeList(ULTIMATE_LIST_KEYWORDS_ARR);

          // Save the lists to storage for persistence
          debugLog("Saving parsed lists to storage");
          chrome.storage.local.set({ 
            PREDEFINED_FULL_LIST: FULL_LIST_BLOCKED,
            PREDEFINED_FREE_LIST: FREE_LIST_BLOCKED,
            PREDEFINED_ULTIMATE_KEYWORDS: ULTIMATE_LIST_KEYWORDS_ARR,
            // Mirror keys some UIs expect
            BALANCED_LIST_BLOCKED: FULL_LIST_BLOCKED,
            ULTIMATE_LIST_KEYWORDS: ULTIMATE_LIST_KEYWORDS_ARR
          }, function() {
            debugLog('Saved predefined lists to storage');
            resolve();
          });
        })
        .catch(error => {
          debugError('Failed to fetch or process url.js:', error);
          debugLog('Attempting to load from storage instead');
          loadFromStorage().then(resolve).catch(reject);
        });
    } catch (e) {
      debugError('Error in loadUrlLists:', e);
      debugLog('Attempting to load from storage as fallback');
      loadFromStorage().then(resolve).catch(reject);
    }
  });
}

function loadFromStorage() {
  debugLog("Loading URL lists from storage");
  return new Promise((resolve, reject) => {
    // Try to get lists from storage
  chrome.storage.local.get(['PREDEFINED_FULL_LIST', 'PREDEFINED_FREE_LIST', 'PREDEFINED_ULTIMATE_KEYWORDS'], function(result) {
      if (result.PREDEFINED_FULL_LIST && Array.isArray(result.PREDEFINED_FULL_LIST)) {
        FULL_LIST_BLOCKED = normalizeList(result.PREDEFINED_FULL_LIST);
        debugLog(`Loaded FULL_LIST_BLOCKED from storage: ${FULL_LIST_BLOCKED.length} items`);
      } else {
        debugLog('No predefined full list in storage');
        // Initialize with an empty array to prevent errors
        FULL_LIST_BLOCKED = [];
      }
      
      if (result.PREDEFINED_FREE_LIST && Array.isArray(result.PREDEFINED_FREE_LIST)) {
        FREE_LIST_BLOCKED = normalizeList(result.PREDEFINED_FREE_LIST);
        debugLog(`Loaded FREE_LIST_BLOCKED from storage: ${FREE_LIST_BLOCKED.length} items`);
      } else {
        debugLog('No predefined free list in storage');
        // Initialize with an empty array to prevent errors
        FREE_LIST_BLOCKED = [];
      }
      
      // Load ultimate keywords
      if (result.PREDEFINED_ULTIMATE_KEYWORDS && Array.isArray(result.PREDEFINED_ULTIMATE_KEYWORDS)) {
        debugLog(`Loaded ULTIMATE keywords from storage: ${result.PREDEFINED_ULTIMATE_KEYWORDS.length} items`);
      }
      resolve();
    });
  });
}

// Handle safe search settings
function updateSafeSearchRules(enabled, options) {
  debugLog(`Updating safe search rules. Enabled: ${enabled}`, options);
  // Save the settings to storage for persistence
  chrome.storage.local.set({
    safe_search_enabled: enabled,
    safe_search_options: options
  }, function() {
    debugLog('Safe search settings saved to storage');
  });
}

// Message handlers
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  debugLog(`Message received from ${sender?.tab ? 'content script' : 'extension'}: ${request.command}`, request);
  
  try {
    if (request.command === 'why_blocked' && typeof request.url === 'string') {
      try {
        const testUrl = String(request.url);
        const hostname = new URL(testUrl).hostname.replace(/^www\./,'');
        chrome.storage.local.get(['combinedBlockList','RULE_LIST_SNAPSHOT','DEFAULT_KEYWORDS_LITE','DEFAULT_KEYWORDS_BALANCED','DEFAULT_KEYWORDS_ULTIMATE','custom_keywords','block_level'], function(s){
          const tokens = Array.isArray(s.combinedBlockList) ? s.combinedBlockList : (Array.isArray(s.RULE_LIST_SNAPSHOT) ? s.RULE_LIST_SNAPSHOT : []);
          const urlLower = testUrl.toLowerCase();
          const hostLower = hostname.toLowerCase();
          let matched = null;
          let matchType = null;
          // 1) Domain match (TLD-only)
          for (const t of tokens) {
            if (!t || typeof t !== 'string') continue;
            const token = t.toLowerCase();
            const isDomain = token.includes('.');
            if (!isDomain) continue;
            if (hostLower === token || hostLower.endsWith('.' + token)) {
              matched = t; matchType = 'domain'; break;
            }
          }
          // 2) Keyword match (only main URL without query parameters)
          if (!matched) {
            // Build keyword set from defaults by level + custom
            const level = s.block_level || 'normal';
            let kws = [];
            if (level === 'normal') kws = kws.concat(s.DEFAULT_KEYWORDS_LITE || []);
            else if (level === 'strict') kws = kws.concat(s.DEFAULT_KEYWORDS_BALANCED || []);
            else if (level === 'very-strict') kws = kws.concat(s.DEFAULT_KEYWORDS_ULTIMATE || []);
            if (Array.isArray(s.custom_keywords)) kws = kws.concat(s.custom_keywords);
            // Check keywords only in main URL (without query parameters and fragments)
            const urlWithoutParams = testUrl.split('?')[0].split('#')[0].toLowerCase();
            for (const k of kws) {
              if (!k) continue;
              const kk = String(k).toLowerCase();
              if (kk && urlWithoutParams.includes(kk)) { matched = k; matchType = 'keyword'; break; }
            }
          }
          sendResponse({ success: true, matched, matchType, hostname });
        });
      } catch (e) {
        sendResponse({ success: false, error: String(e) });
      }
      return true;
    }
    if (request.command === 'get_is_enable') {
      debugLog("Handling get_is_enable request");
      chrome.storage.local.get(['ninja_config'], function (result) {
        const isEnabled = result.ninja_config?.is_enable !== false;
        debugLog(`Returning is_enable status: ${isEnabled}`);
        sendResponse({ is_enable: isEnabled });
      });
      return true; // indicates that the response will be sent asynchronously
    }
    // Apply icon theme from settings
  else if (request.command === 'apply_icon_theme') {
      try {
        const theme = normalizeTheme(request.theme || 'classic');
        chrome.storage.local.get(['premium_active','icon_theme','ninja_config'], function (s) {
          const premium = s.premium_active === true;
          const prev = normalizeTheme(s.icon_theme || ICON_THEME || 'classic');
          if (isPremiumTheme(theme) && !premium) {
            // Start or refresh a 60s trial
            startIconTrial(theme, prev);
            ICON_THEME = theme;
            debugLog(`apply_icon_theme -> TRIAL started for premium theme: ${theme}`);
            const isEnabled = s.ninja_config?.is_enable !== false;
            setThemedIcon(isEnabled);
            sendResponse({ success: true, trial: true, endsAt: ICON_TRIAL && ICON_TRIAL.endsAt });
          } else {
            ICON_THEME = theme;
            debugLog(`apply_icon_theme -> applying theme: ${theme}`);
            const isEnabled = s.ninja_config?.is_enable !== false;
            setThemedIcon(isEnabled);
            sendResponse({ success: true, trial: false });
          }
        });
      } catch (e) {
        debugError('Error applying icon theme:', e);
        sendResponse({ success: false, error: String(e) });
      }
      return true;
    }
    // Rebuild rules on demand without reloading lists (for autosave flows)
    else if (request.command === 'refresh_rules') {
      debugLog("Handling refresh_rules request");
      try {
        updateRulesBasedOnNinjaStatus();
        sendResponse({ success: true });
      } catch (e) {
        debugError('Error in refresh_rules:', e);
        sendResponse({ success: false, error: String(e) });
      }
      return true;
    }
    // Handle safe search redirects
    else if (request.command === 'update_safe_search') {
      debugLog("Handling update_safe_search request", request);
      updateSafeSearchRules(request.enabled, request.options);
      sendResponse({ success: true });
      return true;
    }
    // Handle block action updates
    else if (request.command === 'update_block_action') {
      debugLog("Handling update_block_action request", request);
      // Save the block action settings
      chrome.storage.local.set({ 
        block_action: request.blockAction,
        custom_redirect_url: request.customRedirectUrl 
      }, function() {
        debugLog(`Block action updated to ${request.blockAction}`);
        // Force refresh of rules to apply the new block action
        updateRulesBasedOnNinjaStatus();
        sendResponse({ success: true });
      });
      return true;
    }
    // Handle direct state updates from settings page
    else if (request.command === 'update_ninja_state') {
      debugLog("Handling update_ninja_state request, new state:", request.is_enable);
      // Update the icon and rules based on the passed state without toggling
      if (request.is_enable) {
        debugLog("Enabling extension");
  setThemedIcon(true);
        loadUrlLists().then(() => {
          debugLog("URL lists loaded after enable, updating rules");
          updateRulesBasedOnNinjaStatus();
          sendResponse({ success: true });
        }).catch(error => {
          debugError("Error loading URL lists after enable", error);
          sendResponse({ success: false, error: error.toString() });
        });
      } else {
        debugLog("Disabling extension");
  setThemedIcon(false);
        
        // Generate an array of IDs from 1 to 5000
        let ruleIdsToRemove = Array.from({ length: 5000 }, (_, i) => i + 1);
        
        // Remove all the rules
        debugLog("Removing all rules");
        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIdsToRemove }, function () {
          if (chrome.runtime.lastError) {
            debugError('Failed to remove rules:', chrome.runtime.lastError.message);
          } else {
            debugLog('All rules removed, blocker disabled');
          }
          setRulesBuildActive(false);
          sendResponse({ success: true });
        });
      }
      return true;
    }
    // Handle whitelist updates to immediately unblock domains
    else if (request.command === 'update_whitelist') {
      debugLog("Handling update_whitelist request", request);
      
      // Handle sites added to whitelist
      if (request.action === 'add' && request.site) {
        debugLog(`Adding ${request.site} to whitelist`);
        const domainToUnblock = request.site.toLowerCase();
        // Update whitelist list in storage first
        chrome.storage.local.get(['whitelisted_sites','RULE_INDEX'], function(result) {
          const whitelist = result.whitelisted_sites || [];
          const ruleIndex = result.RULE_INDEX || {};

          if (!whitelist.includes(domainToUnblock)) {
            whitelist.push(domainToUnblock);
          }

          // Collect rule IDs for domain and its subdomains
          const matchedKeys = Object.keys(ruleIndex).filter(k => k === domainToUnblock || k.endsWith('.' + domainToUnblock));
          const relatedRuleIds = matchedKeys.flatMap(k => ruleIndex[k]).slice();
          debugLog(`Whitelist add: ${domainToUnblock}, matched tokens: ${matchedKeys.length}, mapped rule IDs: ${relatedRuleIds.length}`);

          chrome.storage.local.set({ whitelisted_sites: whitelist }, function() {
            if (relatedRuleIds.length > 0) {
              chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: relatedRuleIds }, function () {
                if (chrome.runtime.lastError) {
                  debugError('Error removing rules for whitelisted domain via index:', chrome.runtime.lastError);
                  sendResponse({ success: false, error: chrome.runtime.lastError.message });
                } else {
                  debugLog(`Removed ${relatedRuleIds.length} rules by index for ${domainToUnblock}`);
                  sendResponse({ success: true, rulesRemoved: relatedRuleIds.length });
                }
              });
            } else {
              // No direct mapping — regenerate incrementally: remove none, just rebuild with whitelist filter
              loadUrlLists().then(() => {
                updateRulesBasedOnNinjaStatus();
                sendResponse({ success: true, rulesRemoved: 0 });
              }).catch(err => {
                debugError('Error refreshing rules after whitelist update:', err);
                sendResponse({ success: false, error: err?.toString?.() || String(err) });
              });
            }
          });
        });
        return true; // indicates async response
      }
      // Handle whitelist full update (when multiple sites are changed)
      else if (request.action === 'refresh') {
        debugLog("Refreshing all rules with updated whitelist");
        // Regenerate all rules with the updated whitelist
        loadUrlLists().then(() => {
          updateRulesBasedOnNinjaStatus();
          sendResponse({ success: true, message: 'Rules refreshed with updated whitelist' });
        }).catch(error => {
          debugError('Failed to refresh rules:', error);
          sendResponse({ 
            success: false, 
            message: 'Failed to refresh rules',
            error: error.toString() 
          });
        });
        return true; // indicates that the response will be sent asynchronously
      }
    }
    // Handle keyword list updates
    else if (request.command === 'update_keywords') {
      debugLog("Handling update_keywords request", request);
      
      chrome.storage.local.get(['custom_keywords'], function(result) {
        const keywords = request.keywords || result.custom_keywords || [];
        
        chrome.storage.local.set({ custom_keywords: keywords }, function() {
          CUSTOM_KEYWORDS = keywords;
          debugLog(`Custom keywords updated: ${keywords.length} keywords`);
          
          // Reload and update rules
          updateRulesBasedOnNinjaStatus();
          sendResponse({ success: true, keywordsCount: keywords.length });
        });
      });
      return true;
    }
    // Handle block list updates
    else if (request.command === 'update_block_list') {
      debugLog("Handling update_block_list request");
      // Update the custom list of blocked sites when a new site is added via settings
      chrome.storage.local.get(['blocked_sites'], function(result) {
        if (result.blocked_sites && Array.isArray(result.blocked_sites)) {
          // Update the CUSTOM_LIST_BLOCKED variable with user's custom block list
          debugLog(`Found ${result.blocked_sites.length} blocked sites in storage`);
          CUSTOM_LIST_BLOCKED = result.blocked_sites;
          chrome.storage.local.set({ CUSTOM_LIST_BLOCKED: CUSTOM_LIST_BLOCKED }, function() {
            debugLog('CUSTOM_LIST_BLOCKED updated with user sites');
            // Reload blocking rules
            loadUrlLists().then(() => {
              debugLog("URL lists loaded, updating rules for block list change");
              updateRulesBasedOnNinjaStatus();
              sendResponse({ success: true });
            }).catch(error => {
              debugError("Error loading URL lists for block list update:", error);
              sendResponse({ success: false, error: error.toString() });
            });
          });
        } else {
          debugLog('No blocked sites found in storage');
          sendResponse({ success: false, error: 'No blocked sites found' });
        }
      });
      return true; // indicates that the response will be sent asynchronously
    }
    // Standard toggle command
    else if (request.command === 'active_ninja') {
      debugLog("Toggling ninja active state");
      ninja_data = null;
      chrome.storage.local.get(['ninja_config'], function (result) {
        const oldState = result.ninja_config.is_enable;
        result.ninja_config.is_enable = !result.ninja_config.is_enable;
        debugLog(`Toggling ninja state from ${oldState} to ${result.ninja_config.is_enable}`);
        
        chrome.storage.local.set({ "ninja_config": result.ninja_config }, function () {
          debugLog("New ninja state saved, calling _ninja_isDisable");
          _ninja_isDisable();
          sendResponse({}); // Send a response when finished processing
        });
      });
      return true; // indicates that the response will be sent asynchronously
    }
    else if (request.command === 'ninja_get_config') {
      debugLog("Getting ninja config");
      chrome.storage.local.get(['ninja_config'], function (result) {
        debugLog("Returning ninja config:", result.ninja_config);
        sendResponse(result.ninja_config);
      });
      return true; // indicates that the response will be sent asynchronously
    }
    // Add a new command to manually reload the URL lists
    else if (request.command === 'reload_url_lists') {
      debugLog("Manually reloading URL lists");
      loadUrlLists().then(() => {
        debugLog("URL lists reloaded manually, updating rules");
        updateRulesBasedOnNinjaStatus();
        sendResponse({ 
          success: true, 
          fullListSize: FULL_LIST_BLOCKED.length, 
          freeListSize: FREE_LIST_BLOCKED.length 
        });
      }).catch(error => {
        debugError("Error reloading URL lists manually:", error);
        sendResponse({ success: false, error: error.toString() });
      });
      return true; // indicates that the response will be sent asynchronously
    }
    // Debug helper: test whether a URL would be blocked by current dynamic rules
    else if (request.command === 'debug_test_url') {
      try {
        const type = request.type || 'main_frame';
        const url = request.url;
        if (!url) {
          sendResponse({ success: false, error: 'Missing url' });
          return true;
        }
        chrome.declarativeNetRequest.testMatchOutcome({ url, type }, function (res) {
          if (chrome.runtime.lastError) {
            debugError('testMatchOutcome error:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            const matchedCount = (res.matchedRules && res.matchedRules.length) || 0;
            debugLog(`testMatchOutcome for ${url} -> matchedRules: ${matchedCount}`);
            sendResponse({ success: true, matchedCount, details: res });
          }
        });
      } catch (e) {
        debugError('Exception in debug_test_url:', e);
        sendResponse({ success: false, error: String(e) });
      }
      return true;
    }
    else if (request.command === 'debug_find_token') {
      try {
        const token = String(request.token || '').toLowerCase();
        if (!token) { sendResponse({ success:false, error:'Missing token' }); return true; }
        chrome.storage.local.get(['combinedBlockList','RULE_INDEX'], function(res){
          const list = res.combinedBlockList || [];
          const index = res.RULE_INDEX || {};
          const inCombined = list.includes(token);
          const inIndex = !!index[token];
          const ids = index[token] || [];
          const results = { success:true, token, inCombined, inIndex, ruleIds: ids };
          const urlsToTest = [];
          if (token.includes('.')) {
            urlsToTest.push(`https://${token}/`, `https://www.${token}/`);
          } else {
            urlsToTest.push(`https://www.${token}.com/`, `https://${token}.com/`);
          }
          let remaining = urlsToTest.length; results.tests = [];
          urlsToTest.forEach(u => {
            chrome.declarativeNetRequest.testMatchOutcome({ url: u, type: 'main_frame' }, function(res2){
              const matchedCount = (res2 && res2.matchedRules && res2.matchedRules.length) || 0;
              results.tests.push({ url:u, matchedCount });
              if (--remaining === 0) {
                sendResponse(results);
              }
            });
          });
        });
      } catch(e) {
        debugError('Exception in debug_find_token:', e);
        sendResponse({ success:false, error:String(e) });
      }
      return true;
    } else if (request.command === 'get_active_tab') {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          const t = (tabs && tabs[0]) || null;
          let url = (t && (t.url || t.pendingUrl)) || '';
          let title = (t && t.title) || '';
          let favIconUrl = (t && t.favIconUrl) || '';
          if (url) {
            sendResponse({ success: true, url, title, favIconUrl });
          } else {
            // Fallback to last focused normal window with populated tabs
            chrome.windows.getLastFocused({ populate: true }, function(win) {
              try {
                const tabsArr = (win && win.tabs) || [];
                // Prefer active tab with a URL
                let cand = tabsArr.find(tb => tb.active && (tb.url || tb.pendingUrl));
                if (!cand) {
                  cand = tabsArr.find(tb => /^https?:|^file:/.test(tb.url || tb.pendingUrl || ''));
                }
                if (cand) {
                  url = cand.url || cand.pendingUrl || '';
                  title = cand.title || '';
                  favIconUrl = cand.favIconUrl || '';
                }
                sendResponse({ success: true, url, title, favIconUrl });
              } catch (e2) {
                debugError('getLastFocused fallback failed:', e2);
                sendResponse({ success: true, url:'', title:'', favIconUrl:'' });
              }
            });
          }
        });
      } catch (e) {
        debugError('Error in get_active_tab:', e);
        sendResponse({ success:false, error: String(e) });
      }
      return true;
    } else {
      debugLog(`Unknown command: ${request.command}`);
      sendResponse({ success: false, error: `Unknown command: ${request.command}` });
    }
  } catch (error) {
    debugError("Error handling message:", error);
    sendResponse({ success: false, error: error.toString() });
  }
});

// Extra commands for trial management
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  try {
    if (request && request.command === 'cancel_icon_trial') {
      if (ICON_TRIAL) {
        const back = normalizeTheme(ICON_TRIAL.previousTheme || 'classic');
        ICON_THEME = back;
        chrome.storage.local.set({ icon_theme: back }, function(){
          clearIconTrial();
          chrome.storage.local.get(['ninja_config'], function (r) {
            const isEnabled = r.ninja_config?.is_enable !== false;
            setThemedIcon(isEnabled);
            sendResponse({ success: true, revertedTo: back });
          });
        });
      } else {
        sendResponse({ success: true, revertedTo: null });
      }
      return true;
    } else if (request && request.command === 'get_icon_trial') {
      const now = Date.now();
      const remainingMs = ICON_TRIAL ? Math.max(0, ICON_TRIAL.endsAt - now) : 0;
      sendResponse({
        success: true,
        trial: !!ICON_TRIAL,
        endsAt: ICON_TRIAL && ICON_TRIAL.endsAt,
        remainingMs,
        theme: ICON_TRIAL && ICON_TRIAL.theme,
        previousTheme: ICON_TRIAL && ICON_TRIAL.previousTheme
      });
      return true;
    }
  } catch (e) {
    debugError('Trial management error:', e);
    sendResponse({ success: false, error: String(e) });
  }
});

// (debug_test_url now handled in the main onMessage listener above)

// Initialize ninja_config in chrome.storage.local on extension installation
chrome.runtime.onInstalled.addListener(function (details) {
  debugLog("Extension installed or updated, initializing settings");
  chrome.storage.local.get(['ninja_config', 'blocked_sites'], function (result) {
    // Initialize ninja_config if needed
    if (result.ninja_config === undefined) {
      let ninja_config = { is_enable: true, version: "2.8" };
      chrome.storage.local.set({ "ninja_config": ninja_config }, function () {
        debugLog('Initial configuration is set.');
      });
    }
    
    // Set default block action on first install
    if (details.reason === 'install') {
      try {
        chrome.storage.local.set({ block_action: 'stealth-nxdomain' }, function(){
          debugLog('Default block_action set to stealth-nxdomain');
        });
      } catch(_) {}
    }
    // Open onboarding page immediately after first installation
    if (details.reason === 'install') {
      // Set flag to show onboarding
      chrome.storage.local.set({ show_onboarding: true, onboarding_in_progress: true }, function() {
        chrome.tabs.create({ url: 'onboarding.html' });
      });
    }
    
    // On update/reload, check if onboarding was in progress
    if (details.reason === 'update' || details.reason === 'chrome_update' || details.reason === 'shared_module_update') {
      chrome.storage.local.get(['onboarding_in_progress'], function(result) {
        if (result.onboarding_in_progress === true) {
          // Onboarding was in progress, reopen it
          debugLog('Onboarding was in progress, reopening...');
          chrome.tabs.create({ url: 'onboarding.html' });
        }
      });
    }
    
    // Initialize CUSTOM_LIST_BLOCKED with blocked_sites during installation
    if (result.blocked_sites && Array.isArray(result.blocked_sites)) {
      debugLog(`Found ${result.blocked_sites.length} blocked sites to initialize`);
      CUSTOM_LIST_BLOCKED = result.blocked_sites;
      chrome.storage.local.set({ CUSTOM_LIST_BLOCKED: CUSTOM_LIST_BLOCKED }, function() {
        debugLog('CUSTOM_LIST_BLOCKED initialized with blocked_sites');
      });
    }
    
    // Load URL lists and keywords on first install
    debugLog("Loading URL lists and keywords after installation");
    Promise.all([loadUrlLists(), loadDefaultKeywords()]).then(() => {
      debugLog("URL lists and keywords loaded on installation");
    }).catch(error => {
      debugError("Error loading URL lists or keywords on installation:", error);
    });

    // Initialize Removal Alert uninstall URL if configured
    chrome.storage.local.get(['removal_alert_email', 'removal_alert_enabled'], function(result) {
      if (result.removal_alert_enabled && result.removal_alert_email) {
        // Use Vercel redirect page that will redirect to chrome-extension:// URL
        // This works around Chrome's limitation that setUninstallURL only accepts HTTP/HTTPS
        const extId = chrome.runtime.id;
        const params = new URLSearchParams({
          ext: extId,
          email: result.removal_alert_email
        });
        const uninstallURL = `https://ninja-blocker-alert-api.vercel.app/redirect.html?${params.toString()}`;
        chrome.runtime.setUninstallURL(uninstallURL, function() {
          if (chrome.runtime.lastError) {
            debugError('Failed to set uninstall URL:', chrome.runtime.lastError);
          } else {
            debugLog('🔔 Removal Alert: Uninstall URL set via Vercel redirect');
          }
        });
      }
    });

    // Initialize safe search settings with defaults if not already set
    chrome.storage.local.get(['safe_search_enabled', 'safe_search_options'], function(result) {
      if (result.safe_search_enabled === undefined) {
        debugLog("Initializing safe search settings with defaults - OFF by default for user choice");
        chrome.storage.local.set({ 
          safe_search_enabled: false,
          safe_search_options: {
            google: true,
            bing: true,
            yahoo: true,
            duckduckgo: true,
            youtube: true
          }
        }, function() {
          debugLog('Safe search settings initialized');
          // Apply the initial safe search rules
          updateSafeSearchRules(true, {
            google: true,
            bing: true,
            yahoo: true,
            duckduckgo: true,
            youtube: true
          });
        });
      } else {
        debugLog("Using existing safe search settings");
        // Apply existing safe search settings on install/reload
        updateSafeSearchRules(result.safe_search_enabled, result.safe_search_options || {});
      }
    });
  });
});

function updateRulesBasedOnNinjaStatus() {
  debugLog("Updating rules based on ninja status");
  new Promise((resolve, reject) => {
    chrome.storage.local.get(['ninja_config'], function (result) {
      if (chrome.runtime.lastError) {
        debugError("Error getting ninja_config:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        const isEnabled = result.ninja_config?.is_enable !== false;
        debugLog(`Ninja is ${isEnabled ? 'enabled' : 'disabled'}`);
        resolve(isEnabled);
      }
    });
  }).then(is_enable => {
    if (is_enable) {
      // Get all necessary blocking lists from storage
      debugLog("Getting blocking lists from storage");
      chrome.storage.local.get(['blocked_sites', 'CUSTOM_LIST_BLOCKED', 'PREDEFINED_FULL_LIST'], function (result) {
        
        // Ensure we have both predefined and custom lists available
        let customBlockList = [];
        let predefinedFullList = [];
        
        // Get custom block list from storage
        if (result.blocked_sites && Array.isArray(result.blocked_sites)) {
          customBlockList = result.blocked_sites;
          debugLog(`Found custom block list in storage with ${customBlockList.length} items`);
        } else if (result.CUSTOM_LIST_BLOCKED && Array.isArray(result.CUSTOM_LIST_BLOCKED)) {
          customBlockList = result.CUSTOM_LIST_BLOCKED;
          debugLog(`Found CUSTOM_LIST_BLOCKED in storage with ${customBlockList.length} items`);
        }
        
        // Check for predefined list in storage as backup
        if (result.PREDEFINED_FULL_LIST && Array.isArray(result.PREDEFINED_FULL_LIST)) {
          predefinedFullList = result.PREDEFINED_FULL_LIST;
          debugLog(`Found predefined list in storage with ${predefinedFullList.length} items`);
        }
        
        // Determine which lists to use in which order
        let finalFullList = [];
        
        // First priority: Use the in-memory FULL_LIST_BLOCKED if it has items
        if (FULL_LIST_BLOCKED && FULL_LIST_BLOCKED.length > 0) {
          finalFullList = FULL_LIST_BLOCKED;
          debugLog(`Using in-memory FULL_LIST_BLOCKED with ${finalFullList.length} items`);
        } 
        // Second priority: Use the storage predefined list if available
        else if (predefinedFullList.length > 0) {
          finalFullList = predefinedFullList;
          FULL_LIST_BLOCKED = predefinedFullList; // Update in-memory list
          debugLog(`Using storage PREDEFINED_FULL_LIST with ${finalFullList.length} items`);
        }
        // Third priority: If both are empty, load from url.js
        else {
          debugLog("Both in-memory and storage predefined lists are empty, loading from url.js");
          return loadUrlLists().then(() => {
            // After loading, call this function again to create rules
            debugLog("URL lists loaded, recalling updateRulesBasedOnNinjaStatus");
            updateRulesBasedOnNinjaStatus();
          }).catch(error => {
            debugError("Error loading URL lists in updateRulesBasedOnNinjaStatus:", error);
          });
        }
        
  // Continue with rule creation
  debugLog("Creating optimized rules with custom and full lists");
  createOptimizedRules(customBlockList, finalFullList);
      });
    } else {
      debugLog("Ninja is disabled, not creating any rules");
    }
  }).catch(error => {
    debugError("Error in updateRulesBasedOnNinjaStatus:", error);
  });
}

// Function to create optimized blocking rules
function createOptimizedRules(customBlockList, predefinedList) {
  debugLog("Creating optimized blocking rules");
  
  try {
    // Get whitelist to exclude from rules
    chrome.storage.local.get(['whitelisted_sites', 'block_level', 'PREDEFINED_ULTIMATE_KEYWORDS', 'ULTIMATE_LIST_KEYWORDS', 'custom_keywords', 'keyword_blocking_enabled', 'blocked_sites', 'premium_active'], function(result) {
      const whitelist = result.whitelisted_sites || [];
      const blockLevel = result.block_level || 'normal'; // Default to normal if not set
      const ultimateRaw = Array.isArray(result.PREDEFINED_ULTIMATE_KEYWORDS)
        ? result.PREDEFINED_ULTIMATE_KEYWORDS
        : (Array.isArray(result.ULTIMATE_LIST_KEYWORDS) ? result.ULTIMATE_LIST_KEYWORDS : []);
      const ultimateKeywords = normalizeList(ultimateRaw);
      
      // Keyword blocking is always enabled for Lite level [[memory:8837077]]
      const keywordBlockingEnabled = true;
      const customKeywords = result.custom_keywords || [];
      const blockedSitesCount = (result.blocked_sites || []).length;
      const whitelistedSitesCount = whitelist.length;
      const isPremium = result.premium_active === true;
      
      debugLog(`Using block level: ${blockLevel}`);
      debugLog(`Whitelist contains ${whitelist.length} sites`);
      debugLog(`Keyword blocking enabled: ${keywordBlockingEnabled}`);
      
      // Calculate free keyword limit based on blocked/whitelisted sites count
      const totalCustomSites = blockedSitesCount + whitelistedSitesCount;
      const freeKeywordLimit = Math.min(10, totalCustomSites); // Max 10, but only as many as custom sites
      
      // Build site list based on block level
      let combinedList = [];
      let keywordsList = [];
      
      // ALWAYS include custom blocklist regardless of level
      const custom = normalizeList(customBlockList || []);
      
      // Add default keywords based on level and keyword blocking setting
      if (keywordBlockingEnabled) {
        if (blockLevel === 'normal') {
          // Lite: use Lite keywords [[memory:8837077]]
          keywordsList = [...DEFAULT_KEYWORDS_LITE];
          debugLog(`Lite level: Adding ${DEFAULT_KEYWORDS_LITE.length} default keywords`);
        } else if (blockLevel === 'strict') {
          // Balanced: use Balanced keywords
          keywordsList = [...DEFAULT_KEYWORDS_BALANCED];
          debugLog(`Balanced level: Adding ${DEFAULT_KEYWORDS_BALANCED.length} default keywords`);
        } else if (blockLevel === 'very-strict') {
          // Ultimate: use Ultimate keywords
          keywordsList = [...DEFAULT_KEYWORDS_ULTIMATE];
          debugLog(`Ultimate level: Adding ${DEFAULT_KEYWORDS_ULTIMATE.length} default keywords`);
        }
        
        // Add custom keywords (with limit for free users)
        if (customKeywords.length > 0) {
          if (isPremium) {
            keywordsList.push(...customKeywords);
            debugLog(`Premium: Added ${customKeywords.length} custom keywords`);
          } else {
            const allowedKeywords = customKeywords.slice(0, freeKeywordLimit);
            keywordsList.push(...allowedKeywords);
            debugLog(`Free: Added ${allowedKeywords.length}/${customKeywords.length} custom keywords (limit: ${freeKeywordLimit})`);
          }
        }
      }
      
      if (blockLevel === 'normal') {
        // Lite mode: custom list + FREE_LIST_BLOCKED + keywords
        const freeList = normalizeList(FREE_LIST_BLOCKED || []);
        debugLog(`Lite level selected: ${custom.length} custom + ${freeList.length} free list sites + ${keywordsList.length} keywords`);
        combinedList = [...custom, ...freeList, ...keywordsList];
      } else if (blockLevel === 'strict') {
        // Balanced: custom list + full predefined list + keywords
        const fullList = normalizeList(predefinedList || []);
        debugLog(`Strict (Balanced) level: ${custom.length} custom + ${fullList.length} balanced list entries + ${keywordsList.length} keywords`);
        combinedList = [...custom, ...fullList, ...keywordsList];
      } else if (blockLevel === 'very-strict') {
        // Ultimate: custom + ultimate keywords + balanced full list + keywords (prioritize custom and ultimate so they survive capping)
        const fullList = normalizeList(predefinedList || []);
        debugLog(`Very-Strict (Ultimate) level: ${custom.length} custom + ${ultimateKeywords.length} ultimate keywords + ${fullList.length} balanced list + ${keywordsList.length} keywords`);
        combinedList = [...custom, ...ultimateKeywords, ...fullList, ...keywordsList];
      }
      
      // Remove duplicates
      combinedList = [...new Set(combinedList)];
      
      // Remove whitelisted domains/keywords from blocking list and reduce false positives
      if (whitelist.length > 0) {
        combinedList = filterAgainstWhitelist(combinedList, whitelist);
      }

      // Cap to avoid exceeding dynamic rules limit
      combinedList = capList(combinedList, 4800);
      
      debugLog(`Creating rules for ${combinedList.length} sites after filtering whitelist`);
      
      // Persist combined list for content-script fallback checks
      try {
        chrome.storage.local.set({ combinedBlockList: combinedList }, function() {
          debugLog('combinedBlockList saved for content script fallback');
        });
      } catch (e) { debugError('Error saving combinedBlockList:', e); }

      // Create efficient blocking rules (by grouping domains)
      createEfficientBlockingRules(combinedList);
    });
  } catch (error) {
    debugError("Error in createOptimizedRules:", error);
  }
}

// Function to create efficient blocking rules by grouping domains
function createEfficientBlockingRules(siteList) {
  // Single-flight guard: if a rules update is running, coalesce and run later
  if (RULES_UPDATE_IN_PROGRESS) {
    PENDING_SITE_LIST = siteList && siteList.slice ? siteList.slice() : siteList;
    debugLog(`Rules update already in progress; queued latest siteList of size ${siteList?.length || 0}`);
    return;
  }

  RULES_UPDATE_IN_PROGRESS = true;
  const jobSeq = ++CURRENT_RULES_JOB_SEQ;
  debugLog(`Creating efficient blocking rules for ${siteList.length} sites (job #${jobSeq})`);
  setRulesBuildActive(true, jobSeq);

  try {
    // First clear any existing rules, then add in batches
    const allRuleIds = Array.from({ length: 5000 }, (_, i) => i + 1);

    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: allRuleIds }, function() {
      if (chrome.runtime.lastError) {
        debugError("Error removing existing rules:", chrome.runtime.lastError);
      }

      // Check if there are any sites to block
      if (!siteList || siteList.length === 0) {
        debugLog("No sites to block, skipping rule creation");
        RULES_UPDATE_IN_PROGRESS = false;
  setRulesBuildActive(false, jobSeq);
        // If any pending update was queued during this run, flush it now
        const pending = PENDING_SITE_LIST; PENDING_SITE_LIST = null;
        if (pending && pending.length >= 0) {
          debugLog(`Flushing pending rules update with ${pending.length} sites`);
          createEfficientBlockingRules(pending);
        }
        return;
      }

      // Get block action to determine what to do with blocked sites
      chrome.storage.local.get(['block_action', 'custom_redirect_url'], function(result) {
        const blockAction = result.block_action || 'custom-page';
        const customRedirectUrl = result.custom_redirect_url || '';

        debugLog(`Using block action: ${blockAction}`);

        // Determine the appropriate action for blocked sites
        let ruleAction;
        const perSiteDataNx = (blockAction === 'stealth-nxdomain');
        const perSiteCustomBlockPage = (blockAction === 'custom-page');
        const blockPageBaseUrl = chrome.runtime.getURL("blocked.html");
        if (blockAction === 'redirect' && customRedirectUrl) {
          // Redirect to custom URL
          ruleAction = { type: "redirect", redirect: { url: customRedirectUrl } };
          debugLog(`Using redirect action to ${customRedirectUrl}`);
        } else if (blockAction === 'error-page') {
          // Show browser error page
          ruleAction = { type: "block" };
          debugLog("Using block action to show error page");
        } else if (blockAction === 'stealth-nxdomain') {
          // Will generate per-site data URL below during rule mapping: data:<site>
          // Keep ruleAction undefined here to signal per-site action
          debugLog("Using stealth NXDOMAIN -> per-site data:<site>");
        } else if (blockAction === 'stealth-refused') {
          // Connection refused look-alike
          ruleAction = { type: "redirect", redirect: { url: "http://127.0.0.1:9" } };
          debugLog("Using stealth REFUSED redirect");
        } else if (blockAction === 'stealth-reset') {
          // Connection reset look-alike
          ruleAction = { type: "redirect", redirect: { url: "http://1.1.1.1:81" } };
          debugLog("Using stealth RESET redirect");
        } else if (blockAction === 'stealth-timeout') {
          // Timed out look-alike (slower UX)
          ruleAction = { type: "redirect", redirect: { url: "http://10.255.255.1" } };
          debugLog("Using stealth TIMEOUT redirect");
        // removed stealth-minimal
        } else if (blockAction === 'stealth-back') {
          // Data URL with alert for debugging and immediate execution
          const html = encodeURIComponent('<script>alert("Back")</script>');
          const dataUrl = `data:text/html;charset=utf-8,${html}`;
          ruleAction = { type: "redirect", redirect: { url: dataUrl } };
          debugLog("Using stealth BACK data: URL (with alert for debugging)");
        // removed stealth-random
        } else if (!perSiteCustomBlockPage) {
          // Default non per-site: fall back to custom block page (rare path)
          ruleAction = { type: "redirect", redirect: { url: blockPageBaseUrl } };
          debugLog(`Using redirect action to custom block page: ${blockPageBaseUrl}`);
        }

        // Create rules in batches to avoid hitting Chrome's limits
        const BATCH_SIZE = 100;
        const batches = Math.ceil(siteList.length / BATCH_SIZE);

        debugLog(`Creating ${batches} batches of rules with batch size ${BATCH_SIZE}`);

        let nextBatchId = 0;
        let batchProcessingInProgress = false;
        const ruleIndex = {}; // token -> [ruleIds]
        const ruleMeta = {}; // ruleId -> {token, type: 'keyword'|'domain'}

        function finalizeJob() {
          RULES_UPDATE_IN_PROGRESS = false;
          // Persist the rule index for precise whitelist removals
          chrome.storage.local.set({ RULE_INDEX: ruleIndex, RULE_LIST_SNAPSHOT: siteList }, function() {
            debugLog('RULE_INDEX saved with keys:', Object.keys(ruleIndex).length);
            try {
              if (chrome.declarativeNetRequest && chrome.declarativeNetRequest.getDynamicRules) {
                chrome.declarativeNetRequest.getDynamicRules(function(rules) {
                  if (chrome.runtime.lastError) {
                    debugError('getDynamicRules error:', chrome.runtime.lastError);
                  } else {
                    debugLog(`Dynamic rules installed: ${rules?.length || 0}`);
                  }
                });
              }
            } catch (e) {
              debugError('Error querying dynamic rules count:', e);
            }
            // Flush a pending request if any arrived during this run
            const pending = PENDING_SITE_LIST; PENDING_SITE_LIST = null;
            if (pending && pending.length >= 0) {
              debugLog(`Finalized job #${jobSeq}. Flushing pending rules update with ${pending.length} sites`);
              // Keep build active as the next job will start immediately
              createEfficientBlockingRules(pending);
            } else {
              debugLog(`Finalized job #${jobSeq}. No pending updates.`);
              setRulesBuildActive(false, jobSeq);
            }
          });
        }

        function processNextBatch() {
          if (batchProcessingInProgress || nextBatchId >= batches) {
            if (nextBatchId >= batches) {
              debugLog("All rule batches have been added successfully");
              finalizeJob();
            }
            return;
          }

          batchProcessingInProgress = true;

          const start = nextBatchId * BATCH_SIZE;
          const end = Math.min(start + BATCH_SIZE, siteList.length);
          const batchSites = siteList.slice(start, end);

          debugLog(`Processing batch ${nextBatchId + 1}/${batches} with ${batchSites.length} sites (rule IDs ${start + 1}-${end})`);

          const escapeForRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const rules = batchSites.map((site, index) => {
            const ruleId = start + index + 1; // Rule IDs start at 1
            if (!ruleIndex[site]) ruleIndex[site] = [];
            ruleIndex[site].push(ruleId);
            const urlFilter = `${site}`;
            const action = perSiteCustomBlockPage
                  ? { type: "redirect", redirect: { url: `${blockPageBaseUrl}?site=${encodeURIComponent(site)}` } }
                  : ruleAction;
            // For custom page, prefer capturing full URL via regex + regexSubstitution
            if (perSiteCustomBlockPage) {
              const regex = `^https?:\\/\\/[^/]*${escapeForRegex(site)}.*$`;
              return {
                id: ruleId,
                priority: 1000,
                action: { type: "redirect", redirect: { regexSubstitution: `${blockPageBaseUrl}?url=\\0` } },
                condition: { regexFilter: regex, resourceTypes: ["main_frame", "sub_frame"] }
              };
            }
            // For NXDOMAIN, capture full URL and substitute into data:<url>
            if (perSiteDataNx) {
              const urlRegex = `^(https?:\\/\\/[^/]*${escapeForRegex(site)}.*)$`;
              return {
                id: ruleId,
                priority: 1000,
                action: { type: "redirect", redirect: { regexSubstitution: `data:\\1` } },
                condition: { regexFilter: urlRegex, resourceTypes: ["main_frame", "sub_frame"] }
              };
            }
            return {
              id: ruleId,
        // Use a higher priority to minimize interference from other extensions' rules
        priority: 1000,
              action: action,
              condition: { urlFilter, resourceTypes: ["main_frame", "sub_frame"] }
            };
          });

          // Save basic metadata for debugging which token matched which rule
          for (let i = 0; i < rules.length; i++) {
            const rid = start + i + 1;
            try { ruleMeta[rid] = { token: batchSites[i], type: batchSites[i].includes('.') ? 'domain' : 'keyword' }; } catch(_) {}
          }

          chrome.declarativeNetRequest.updateDynamicRules({ addRules: rules }, function() {
            if (chrome.runtime.lastError) {
              debugError(`Error adding rules batch ${nextBatchId + 1}:`, chrome.runtime.lastError);
            } else {
              debugLog(`Successfully added batch ${nextBatchId + 1} with ${rules.length} rules`);
            }
            nextBatchId++;
            batchProcessingInProgress = false;
            if (nextBatchId < batches) {
              setTimeout(processNextBatch, 100);
            } else {
              // Completed all batches
              try { chrome.storage.local.set({ RULE_META: ruleMeta }); } catch(_) {}
              finalizeJob();
            }
          });
        }

        // Start processing
        processNextBatch();
      });
    });
  } catch (error) {
    RULES_UPDATE_IN_PROGRESS = false;
    debugError("Error in createEfficientBlockingRules:", error);
  setRulesBuildActive(false);
  }
}