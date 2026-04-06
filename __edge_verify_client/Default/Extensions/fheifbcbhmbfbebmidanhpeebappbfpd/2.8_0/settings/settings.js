// Initialize settings page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DEBUG: Settings page DOM loaded");
    
    // Load remote pricing from MD file
    loadRemotePricing();
    
    // DOM Elements
    const passwordProtection = document.getElementById('password-protection');
    const mainSettings = document.getElementById('main-settings');
    const enterPasswordInput = document.getElementById('enter-password');
    const submitPasswordBtn = document.getElementById('submit-password');
    const passwordError = document.getElementById('password-error');
    const navItems = document.querySelectorAll('.nav-item');
    const contentTabs = document.querySelectorAll('.content-tab');
    const saveSettingsBtn = document.getElementById('save-settings');
    const ninjaEnableSidebar = document.getElementById('ninja-enable-sidebar');
    const sidebarControl = document.querySelector('.sidebar-control');
    // Dashboard elements
    const ninjaEnableDash = document.getElementById('ninja-enable-dashboard');
    const safeSearchDash = document.getElementById('enable-safe-search-dashboard');
    const dashSafeLabel = document.getElementById('dash-safesearch-label');
    const dashIconThumb = document.getElementById('dash-icon-thumb');
    const dashIconLabel = document.getElementById('dash-icon-label');
    const dashSafeProviders = document.getElementById('dash-safesearch-providers');
    const blockBtns = document.getElementById('block-level-btns');
    const statCustom = document.getElementById('stat-custom-blocked');
    const statWhitelist = document.getElementById('stat-whitelist');
    const statTotalRules = document.getElementById('stat-total-rules');
    // Minimal inline loader control only for Active rules metric
    function setMetricsLoading(isLoading) {
        if (statTotalRules) statTotalRules.classList.toggle('loading', !!isLoading);
    }
    // Obfuscated Active rules display with count-up animation
    function parseApprox(text) {
        if (!text) return 0;
        const t = String(text).trim().replace(/^\+/, '');
        if (/^\d+\s*K$/i.test(t)) {
            return parseInt(t, 10) * 1000;
        }
        const n = parseInt(t.replace(/[\,\s]/g, ''), 10);
        return isNaN(n) ? 0 : n;
    }
    function formatApprox(n) {
        const val = Math.max(0, Number(n) || 0);
        if (val >= 1000) {
            const k = Math.round(val / 1000);
            return `+${k}K`;
        }
        return `+${val}`;
    }
    function animateApprox(el, target, duration = 600) {
        if (!el) return;
        const start = parseApprox(el.textContent);
        const end = Math.max(0, Number(target) || 0);
        if (start === end) { el.textContent = formatApprox(end); return; }
        const diff = end - start;
        const t0 = performance.now();
        const ease = t => 1 - Math.pow(1 - t, 3); // easeOutCubic
        if (el.__approxAnim && el.__approxAnim.raf) cancelAnimationFrame(el.__approxAnim.raf);
        function tick(now) {
            const p = Math.min(1, (now - t0) / duration);
            const val = Math.round(start + diff * ease(p));
            el.textContent = formatApprox(val);
            if (p < 1) {
                el.__approxAnim = { raf: requestAnimationFrame(tick) };
            } else {
                el.__approxAnim = null;
            }
        }
        el.__approxAnim = { raf: requestAnimationFrame(tick) };
    }
    function updateActiveRulesMetric(level) {
        try {
            if (!statTotalRules) return;
            const map = { 'normal': 500, 'strict': 5000, 'very-strict': 50000 };
            const target = map[level];
            if (typeof target === 'number') {
                animateApprox(statTotalRules, target);
            } else {
                statTotalRules.textContent = '—';
            }
        } catch(_){}
    }

    // Map icon theme to human title and asset
    function getIconThemeMeta(theme) {
        const labelMap = {
            'classic': 'Classic',
            'dark': 'Dark',
            'blue': 'Blue',
            'pink': 'Pink',
            'purple': 'Purple',
            'orange': 'Orange',
            'red': 'Red',
            'teal': 'Teal',
            'gray': 'Gray',
            'hidden': 'Hidden (Stealth)'
        };
        const fileMap = {
            'classic': '../assets/images/ninja-enable.png',
            'dark': '../assets/images/ninja-dark.png',
            'blue': '../assets/images/ninja-blue.png',
            'pink': '../assets/images/ninja-pink.png',
            'purple': '../assets/images/ninja-purple.png',
            'orange': '../assets/images/ninja-orange.png',
            'red': '../assets/images/ninja-red.png',
            'teal': '../assets/images/ninja-teal.png',
            'gray': '../assets/images/ninja-gray.png',
            'hidden': '../assets/images/ninja-hidden.png'
        };
        const t = theme || 'classic';
        return { label: labelMap[t] || t, src: fileMap[t] || fileMap['classic'] };
    }

    // Render compact provider chips in dashboard
    function renderDashSafeProviders(enabled, opts) {
        if (!dashSafeProviders) return;
        const o = opts || {};
        dashSafeProviders.innerHTML = '';
        // Primary chips always visible
        const primary = [
            { key: 'google', label: 'Google' },
            { key: 'bing', label: 'Bing' },
            { key: 'youtube', label: 'YouTube' },
        ];
        const extras = [
            { key: 'yahoo', label: 'Yahoo' },
            { key: 'duckduckgo', label: 'DuckDuckGo' },
            { key: 'facebook', label: 'Facebook' },
        ];
        primary.forEach(p => {
            const on = !!enabled && o[p.key] !== false;
            const el = document.createElement('span');
            const isPrem = (p.key !== 'google') && !premiumActive; // gating only
            el.className = `dash-provider ${on ? 'on' : 'off'}`;
            el.dataset.key = p.key;
            if (isPrem) el.title = 'Premium feature';
            el.innerHTML = `<span class=\"dot\" aria-hidden=\"true\"></span><span class=\"name\">${p.label}</span>`;
            dashSafeProviders.appendChild(el);
        });
    // Collapse extras behind an ellipsis chip with hover panel
    const more = document.createElement('span');
    const allExtrasOn = !!enabled && extras.every(p => o[p.key] !== false);
    more.className = `dash-provider more ${allExtrasOn ? 'on' : 'off'}`;
    const extrasCount = extras.length;
    more.innerHTML = `<span class=\"dot\" aria-hidden=\"true\"></span><span class=\"name\">… +${extrasCount}</span>`;
        const panel = document.createElement('div');
        panel.className = 'dash-provider-panel';
        extras.forEach(p => {
            const on = !!enabled && o[p.key] !== false;
            const row = document.createElement('div');
            // Bing is in primary and free; treat all extras as premium unless premiumActive
            const isPrem = !premiumActive; // gating only
            row.className = `provider-row ${on ? 'on' : 'off'}`;
            row.dataset.key = p.key;
            if (isPrem) row.title = 'Premium feature';
            row.innerHTML = `<span class=\"dot\" aria-hidden=\"true\"></span><span class=\"name\">${p.label}</span>`;
            panel.appendChild(row);
        });
        more.appendChild(panel);
        dashSafeProviders.appendChild(more);
    }

    // Click interactions on dashboard provider chips (with premium gating)
    if (dashSafeProviders) {
        dashSafeProviders.addEventListener('click', function(e){
            // 1) Click inside the panel rows takes priority
            const row = e.target.closest('.provider-row');
            if (row) {
                const key = row.dataset.key;
                if (!key) return;
                const isPremiumProvider = (key !== 'google');
                if (isPremiumProvider && !premiumActive) {
                    if (typeof openPremiumModal === 'function') openPremiumModal();
                    return;
                }
                const map = {
                    google: safeSearchGoogleToggle,
                    bing: safeSearchBingToggle,
                    yahoo: safeSearchYahooToggle,
                    duckduckgo: safeSearchDuckDuckGoToggle,
                    youtube: safeSearchYouTubeToggle,
                    facebook: safeSearchFacebookToggle
                };
                const el = map[key];
                if (!el) return;
                el.checked = !el.checked;
                el.dispatchEvent(new Event('change'));
                return;
            }

            // 2) Toggle open/close for the “more” chip (not when clicking inside panel)
            const moreChip = e.target.closest('.dash-provider.more');
            if (moreChip) {
                moreChip.classList.toggle('open');
                return;
            }

            // 3) Click on primary chips (Google/Bing/YouTube)
            const chip = e.target.closest('.dash-provider');
            if (!chip) return;
            const key = chip.dataset.key;
            if (!key) return;
            // Among primary: only YouTube is premium; Bing is free
            const isPremiumProvider = (key === 'youtube');
            if (isPremiumProvider && !premiumActive) {
                if (typeof openPremiumModal === 'function') openPremiumModal();
                return;
            }
            const map = {
                google: safeSearchGoogleToggle,
                bing: safeSearchBingToggle,
                yahoo: safeSearchYahooToggle,
                duckduckgo: safeSearchDuckDuckGoToggle,
                youtube: safeSearchYouTubeToggle,
                facebook: safeSearchFacebookToggle
            };
            const el = map[key];
            if (!el) return;
            el.checked = !el.checked;
            el.dispatchEvent(new Event('change'));
        });
        // Close panel when clicking outside
        document.addEventListener('click', function(ev){
            const openMore = dashSafeProviders.querySelector('.dash-provider.more.open');
            if (!openMore) return;
            if (!openMore.contains(ev.target)) openMore.classList.remove('open');
        });
    }
    
    // Security tab elements
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const changePasswordBtn = document.getElementById('change-password');
    const passwordMessage = document.getElementById('password-message');
    const requirePasswordToggle = document.getElementById('require-password');
    
    // General tab elements
    const ninjaEnableToggle = document.getElementById('ninja-enable');
    const blockLevelSelect = document.getElementById('block-level');
    const showNotificationsToggle = document.getElementById('show-notifications'); // optional (UI removed)
    const blockActionSelect = document.getElementById('block-action');
    const customRedirectUrlContainer = document.getElementById('custom-redirect-url-container');
    const customRedirectUrlInput = document.getElementById('custom-redirect-url');
    // Redirect modal elements
    const redirectModal = document.getElementById('redirect-modal');
    const redirectUrlInput = document.getElementById('redirect-url-input');
    const redirectSaveBtn = document.getElementById('redirect-save-btn');
    const redirectCancelBtn = document.getElementById('redirect-cancel-btn');
    const redirectCloseBtn = document.getElementById('redirect-close-btn');
    const redirectUrlPill = document.getElementById('redirect-url-pill');
    const redirectPreview = document.getElementById('redirect-preview');

    // Expose modal opener at top-level (used by multiple handlers)
    function openRedirectModalIfRedirect(){
        try {
            if (!redirectModal) return;
            redirectUrlInput.value = (customRedirectUrlInput.value || '');
            redirectModal.classList.remove('hidden');
        } catch(_) {}
    }

    // Make redirect preview area clickable to edit
    if (redirectUrlPill) {
        redirectUrlPill.addEventListener('click', function(e){
            e.preventDefault(); e.stopPropagation();
            openRedirectModalIfRedirect();
        });
    }
    if (redirectPreview) {
        redirectPreview.addEventListener('click', function(e){
            e.preventDefault(); e.stopPropagation();
            openRedirectModalIfRedirect();
        });
    }

    // Redirect modal core handlers (always active even after refresh)
    function closeRedirectModal(){
        try { redirectModal.classList.add('hidden'); } catch(_) {}
    }
    function isValidRedirectUrl(u){
        try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:'; } catch(_) { return false; }
    }
    if (redirectCancelBtn) redirectCancelBtn.addEventListener('click', function(e){ e.preventDefault(); closeRedirectModal(); });
    if (redirectCloseBtn) redirectCloseBtn.addEventListener('click', function(e){ e.preventDefault(); closeRedirectModal(); });
    if (redirectSaveBtn) redirectSaveBtn.addEventListener('click', function(e){
        e.preventDefault();
        // Use existing normalizer if available
        const raw = (redirectUrlInput && redirectUrlInput.value) ? redirectUrlInput.value : '';
        const formatted = (typeof formatRedirectUrl === 'function') ? formatRedirectUrl(raw) : (raw.startsWith('http') ? raw : ('https://' + raw));
        if (!isValidRedirectUrl(formatted)) {
            const err = document.getElementById('redirect-error');
            if (err) err.classList.remove('hidden');
            return;
        }
        if (customRedirectUrlInput) customRedirectUrlInput.value = formatted;
        if (redirectUrlPill) redirectUrlPill.textContent = formatted;
        setSaving && setSaving(true);
        chrome.storage.local.set({ custom_redirect_url: formatted, block_action: 'redirect' }, function(){
            sendMessageWithDebug && sendMessageWithDebug({ command: 'update_block_action', blockAction: 'redirect', customRedirectUrl: formatted });
            closeRedirectModal();
        });
    });
    
    // Safe Search elements
    const enableSafeSearchToggle = document.getElementById('enable-safe-search');
    const safeSearchOptionsContainer = document.getElementById('safe-search-options-container');
    const safeSearchGoogleToggle = document.getElementById('safe-search-google');
    const safeSearchBingToggle = document.getElementById('safe-search-bing');
    const safeSearchYahooToggle = document.getElementById('safe-search-yahoo');
    const safeSearchDuckDuckGoToggle = document.getElementById('safe-search-duckduckgo');
    const safeSearchYouTubeToggle = document.getElementById('safe-search-youtube');
    const safeSearchFacebookToggle = document.getElementById('safe-search-facebook'); // Add Facebook toggle
    
    // Block list elements
    const newBlockSiteInput = document.getElementById('new-block-site');
    const addBlockSiteBtn = document.getElementById('add-block-site');
    // Normalize user-entered site to pure TLD (strip protocol/path)
    function normalizeToDomain(raw) {
        try {
            if (!raw) return '';
            let v = String(raw).trim();
            // Add protocol if missing to let URL parse
            if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
            const u = new URL(v);
            const host = (u.hostname || '').toLowerCase();
            return host.replace(/^\*\./, ''); // drop any wildcard prefix
        } catch(_) { return (raw || '').toLowerCase().replace(/^\*\./, ''); }
    }

    if (addBlockSiteBtn && newBlockSiteInput) {
        addBlockSiteBtn.addEventListener('click', function(){
            addBlockedSite(newBlockSiteInput.value);
        });
        newBlockSiteInput.addEventListener('keypress', function(e){ if (e.key==='Enter') addBlockSiteBtn.click(); });
    }
    const blockList = document.getElementById('block-list');
    
    // Whitelist elements
    const newWhitelistSiteInput = document.getElementById('new-whitelist-site');
    const addWhitelistSiteBtn = document.getElementById('add-whitelist-site');
    
    // Keywords elements
    const newKeywordInput = document.getElementById('new-keyword');
    const addKeywordBtn = document.getElementById('add-keyword');
    const keywordList = document.getElementById('keyword-list');
    // Premium modal elements
    const premiumModal = document.getElementById('premium-modal');
    const premiumCloseBtn = document.getElementById('premium-close-btn');
    const premiumDismissBtn = document.getElementById('premium-dismiss-btn'); // optional: may not exist
    const premiumUpgradeBtn = document.getElementById('premium-upgrade-btn');
    // Topbar actions & license modal
    const getPremiumBtn = document.getElementById('get-premium-btn');
    const enterLicenseBtn = document.getElementById('enter-license-btn');
    const licenseOverlay = document.getElementById('license-modal');
    const licenseCloseBtn = document.getElementById('license-close-btn');
    const licenseInput = document.getElementById('license-input');
    const licenseSubmitBtn = document.getElementById('license-submit-btn');
    const licenseCancelBtn = document.getElementById('license-cancel-btn');
    const licensePasteBtn = document.getElementById('license-paste-btn');
    const licenseError = document.getElementById('license-error');
    const whitelist = document.getElementById('whitelist');
    // License modal state elements
    const licenseFormView = document.getElementById('license-form-view');
    const licenseFormActions = document.getElementById('license-form-actions');
    const licenseActiveView = document.getElementById('license-active-view');
    const licenseActiveActions = document.getElementById('license-active-actions');
    const licenseKeyText = document.getElementById('license-key-text');
    const licenseTitle = document.getElementById('license-title');
    const licenseSubtitle = document.getElementById('license-subtitle');
    const licenseHint = document.getElementById('license-hint');
    const licenseDeactivateBtn = document.getElementById('license-deactivate-btn');
    const licenseCloseBtn2 = document.getElementById('license-close-btn-2');
    // Icon picker elements
    const iconRadios = document.querySelectorAll('input[name="icon-theme"]');
    const iconTrialDialog = document.getElementById('icon-trial-dialog');
    // Inline trial bar (replaces old sticky banner)
    const iconTrialInline = document.getElementById('icon-trial-inline');
    const iconTrialInlineTime = document.getElementById('icon-trial-inline-time');
    const iconTrialStartBtn = document.getElementById('icon-trial-start');
    const iconTrialBuyBtn = document.getElementById('icon-trial-buy2'); // dialog Buy
    const iconTrialInlineCancelBtn = document.getElementById('icon-trial-inline-cancel');
    const iconTrialInlineBuyBtn = document.getElementById('icon-trial-inline-buy');
    // Gifted Premium elements
    const giftOpenBtn = document.getElementById('gift-open-form');
    const giftForm = document.getElementById('gift-form');
    const giftEmailInput = document.getElementById('gift-email-input');
    const giftReasonSelect = document.getElementById('gift-reason');
    const giftMessage = document.getElementById('gift-message');
    const giftSendBtn = document.getElementById('gift-send-btn');
    // removed: giftCopyBtn, giftMailtoLink
    
    // Gift License Modal wiring
    const giftLicenseOverlay = document.getElementById('gift-license-modal');
    const giftLicenseCloseBtn = document.getElementById('gift-license-close-btn');
    const giftModalEmail = document.getElementById('gift-modal-email');
    const giftModalReason = document.getElementById('gift-modal-reason');
    const giftModalMessage = document.getElementById('gift-modal-message');
    const giftModalSendBtn = document.getElementById('gift-modal-send-btn');
    // removed: giftModalCopyBtn, giftModalMailto
    const giftModalCancelBtn = document.getElementById('gift-modal-cancel-btn');

    // --- Simple hash router helpers for direct modal routes ---
    let __routeUpdating = false;
    function getCurrentHashKey() {
        const h = (location.hash || '').toLowerCase();
        return h.startsWith('#') ? h.slice(1) : h;
    }
    function setModalRoute(key) {
        // key: 'license' | 'premium' | 'gift'
        try {
            if (__routeUpdating) return;
            __routeUpdating = true;
            const target = key === 'plans' ? 'premium' : key;
            if (('#' + target) !== location.hash) {
                location.hash = '#' + target;
            }
        } finally {
            __routeUpdating = false;
        }
    }
    function clearRouteIfMatches(keys) {
        const cur = getCurrentHashKey();
        const arr = Array.isArray(keys) ? keys : [keys];
        if (arr.includes(cur)) {
            const urlBase = location.pathname + location.search;
            if (history.replaceState) history.replaceState(null, '', urlBase);
            else location.hash = '';
        }
    }
    function closeAllModals() {
        try { closePremiumModal(); } catch(_) {}
        try { closeLicenseModal(); } catch(_) {}
        try { closeGiftLicenseModal(); } catch(_) {}
    }

    function openGiftLicenseModal(prefillFromInline = true, fromRoute = false) {
        if (!giftLicenseOverlay) return;
        // Ensure other modals are closed before opening
        try { closePremiumModal(); } catch(_) {}
        try { closeLicenseModal(); } catch(_) {}
        // Prefill from inline micro-form if available
        if (prefillFromInline && giftEmailInput) {
            if (giftEmailInput.value) giftModalEmail && (giftModalEmail.value = giftEmailInput.value);
            if (giftReasonSelect && giftReasonSelect.value) giftModalReason && (giftModalReason.value = giftReasonSelect.value);
            if (giftMessage && giftMessage.value) giftModalMessage && (giftModalMessage.value = giftMessage.value);
        }
        giftLicenseOverlay.classList.remove('hidden');
        giftLicenseOverlay.setAttribute('aria-hidden', 'false');
        if (!fromRoute) setModalRoute('gift');
        setTimeout(() => giftModalEmail && giftModalEmail.focus(), 10);
    }
    function closeGiftLicenseModal() {
        if (!giftLicenseOverlay) return;
        giftLicenseOverlay.classList.add('hidden');
        giftLicenseOverlay.setAttribute('aria-hidden', 'true');
        clearRouteIfMatches('gift');
    }

    // Open from inline gift button as an alternative path (Shift+Click)
    if (giftOpenBtn) {
        giftOpenBtn.addEventListener('click', (e) => {
            if (e.shiftKey) { // power-user gesture opens full modal
                e.preventDefault();
                openGiftLicenseModal(true);
            }
        });
    }
    if (giftLicenseCloseBtn) giftLicenseCloseBtn.addEventListener('click', closeGiftLicenseModal);
    if (giftLicenseOverlay) giftLicenseOverlay.addEventListener('click', (e) => { if (e.target === giftLicenseOverlay) closeGiftLicenseModal(); });
    if (giftModalCancelBtn) giftModalCancelBtn.addEventListener('click', closeGiftLicenseModal);

    function validateGiftModal() {
        const email = (giftModalEmail && giftModalEmail.value || '').trim();
        const ok = /.+@.+\..+/.test(email);
        if (!ok) {
            showNotification && showNotification('Please enter a valid email', 'warning', { title: 'Gift request' });
            if (giftModalEmail) {
                giftModalEmail.focus();
                const field = giftModalEmail.closest('.gift-field');
                if (field) { field.classList.add('invalid'); setTimeout(() => field.classList.remove('invalid'), 600); }
            }
        }
        return ok;
    }
    function buildGiftModalMailto() {
        const to = 'ixstudio.net@gmail.com';
    const subj = 'Ninja Premium Gift Request';
        const email = (giftModalEmail && giftModalEmail.value || '').trim();
    const reason = (giftModalReason && giftModalReason.value) || 'Financial hardship';
        const note = (giftModalMessage && giftModalMessage.value || '').trim();
        const ua = navigator.userAgent || '';
        const bodyLines = [
            'Hi Ninja team,',
            '',
            'I can’t afford Premium right now. Please consider a 6‑month gifted Premium license.',
            '',
            `Email: ${email || '<your email>'}`,
            `Reason: ${reason}`,
            note ? `Message: ${note}` : '',
            '',
            `Browser: ${ua.includes('Chrome') ? 'Chrome' : ua.split(')')[0] || 'Unknown'}`,
            '',
            'Thank you!'
        ].filter(Boolean).join('\n');
        const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(bodyLines)}`;
        return { href, bodyText: bodyLines };
    }
    if (giftModalSendBtn) {
        giftModalSendBtn.addEventListener('click', () => {
            if (!validateGiftModal()) return;
            const { href } = buildGiftModalMailto();
            try { window.open(href, '_blank', 'noopener'); showNotification && showNotification('Opening email draft…', 'info'); }
            catch(_) { location.href = href; }
        });
    }
    // removed giftModalMailto and giftModalCopyBtn listeners
    
    // Variables
    let blockedSites = [];
    let whitelistedSites = [];
    let defaultBlockedSites = []; // To store the default blocked sites
    let customKeywords = [];
    let defaultKeywordsLite = [];
    let defaultKeywordsBalanced = [];
    let defaultKeywordsUltimate = [];
    let premiumActive = false; // cached premium flag
    let prevBlockLevel = 'normal';
    
    // Add a debugging wrapper to track all message sending
    function sendMessageWithDebug(message, callback) {
        console.log("DEBUG: Sending message to background script:", message);
        try {
            chrome.runtime.sendMessage(message, function(response) {
                console.log("DEBUG: Received response:", response);
                if (callback) callback(response);
            });
        } catch (error) {
            console.error("DEBUG ERROR: Failed to send message:", error);
        }
    }

    // Global loading toggler (adds/removes body class to show top bar + header indicator)
    function setGlobalLoading(active) {
        document.body.classList.toggle('nab-loading', !!active);
    }

    // Minimal loading indicator on Save button (used for autosave feedback too)
    let loadingTimer = null;
    let lastSavedToastAt = 0;
    let manualSavePending = false;
    let manualSaveTimer = null;
    let latestRulesCount = 0;
    const defaultSaveText = saveSettingsBtn ? saveSettingsBtn.textContent : 'Save Settings';
    function setSaving(isSaving, opts = {}) {
        const light = !!opts.light;
        const clearGlobal = !!opts.clearGlobal;
        const silent = !!opts.silent;
        if (isSaving) {
            if (!light) setGlobalLoading(true); // only show global loader for heavy saves
        }
        // If there's no Save button (removed UI), still emit completion toast when done
        if (!saveSettingsBtn) {
            if (!isSaving) {
                const now = Date.now();
                const force = !!opts.force;
                const msg = opts.message || 'Settings applied';
                if (!silent) {
                    if (force || (now - lastSavedToastAt > 900)) {
                        lastSavedToastAt = now;
                        showNotification(msg);
                    }
                }
                if (clearGlobal) setGlobalLoading(false);
            }
            return;
        }
        if (isSaving) {
            // Enter loading: ensure original label is set and hidden via CSS
            saveSettingsBtn.textContent = defaultSaveText;
            saveSettingsBtn.classList.add('loading');
        } else {
            // Completed: show Saved briefly then restore default label
            saveSettingsBtn.classList.remove('loading');
            saveSettingsBtn.textContent = defaultSaveText;
            // Throttle saved toast to avoid spam on multi-key updates
            const now = Date.now();
            const force = !!opts.force;
            const msg = opts.message || 'Settings applied';
            if (!silent) {
                if (force || (now - lastSavedToastAt > 900)) {
                    lastSavedToastAt = now;
                    showNotification(msg);
                }
            }
            // Do not clear global loader here; wait for RULES_BUILD_ACTIVE=false to ensure rules actually applied
            if (clearGlobal) setGlobalLoading(false);
        }
    }
    
    // Check if password is set
    function checkIfPasswordIsSet() {
        console.log("DEBUG: Checking if password is set");
        return new Promise((resolve) => {
            chrome.storage.local.get(['ninja_password'], function(result) {
                console.log("DEBUG: Password check result:", !!result.ninja_password);
                resolve(!!result.ninja_password);
            });
        });
    }
    
    // Verify entered password
    function verifyPassword(password) {
        console.log("DEBUG: Verifying password");
        return new Promise((resolve) => {
            chrome.storage.local.get(['ninja_password'], function(result) {
                const isValid = result.ninja_password === password;
                console.log("DEBUG: Password validation:", isValid ? "Valid" : "Invalid");
                resolve(isValid);
            });
        });
    }

    // Smooth count-up animation for metric numbers
    function animateCount(el, target, duration = 500) {
        if (!el) return;
        const start = parseInt(String(el.textContent).replace(/,/g, ''), 10) || 0;
        const end = Math.max(0, parseInt(String(target), 10) || 0);
        if (start === end) { el.textContent = end.toLocaleString(); return; }
        const diff = end - start;
        const t0 = performance.now();
        const ease = t => 1 - Math.pow(1 - t, 3); // easeOutCubic
        function tick(now) {
            const p = Math.min(1, (now - t0) / duration);
            const val = Math.round(start + diff * ease(p));
            el.textContent = val.toLocaleString();
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // Initialize settings
    async function initSettings() {
        console.log("DEBUG: Initializing settings");
    chrome.storage.local.get(['require_password','ninja_password','icon_theme'], function(result){
            const requirePwd = result.require_password !== false; // default: true
            const hasPwd = !!result.ninja_password;
            console.log('DEBUG: Gate check => require_password:', requirePwd, 'has_password:', hasPwd);
            if (requirePwd && hasPwd) {
                // Gate: require password entry
                passwordProtection.classList.remove('hidden');
                mainSettings.classList.add('hidden');
            } else {
                // No gate (either disabled or no password set yet)
                passwordProtection.classList.add('hidden');
                mainSettings.classList.remove('hidden');
                // Handle initial hash routing
                handleHashRoute();
            }
            // Ensure Security tab reflects correct visibility for "Current Password"
            try { updatePasswordUI(); } catch(_){}
            // Load settings
            loadSettings();
            // Initialize icon picker selection
            if (iconRadios && iconRadios.length) {
                const theme = result.icon_theme || 'classic';
                iconRadios.forEach(r => { r.checked = (r.value === theme); });
            }
            // Initialize dashboard App Icon preview (thumb + label)
            try {
                const theme = result.icon_theme || 'classic';
                const meta = getIconThemeMeta(theme);
                if (dashIconThumb) {
                    dashIconThumb.classList.add('loading');
                    dashIconThumb.onload = function(){ this.classList.remove('loading'); this.classList.remove('broken'); };
                    dashIconThumb.onerror = function(){ this.classList.add('broken'); this.classList.remove('loading'); };
                    dashIconThumb.src = meta.src;
                    dashIconThumb.alt = meta.label + ' icon';
                    dashIconThumb.classList.remove('broken');
                }
            } catch(_){ }
        });
    }

    // Icon picker: handle changes and apply immediately
    function applyIconTheme(theme) {
        try {
            const supported = new Set(['classic','dark','blue','pink','purple','orange','red','teal','gray','hidden']);
            const norm = String(theme || 'classic').toLowerCase();
            const chosen = supported.has(norm) ? norm : 'classic';
            console.log('DEBUG: applyIconTheme -> chosen:', chosen, 'from raw:', theme);
            chrome.storage.local.set({ icon_theme: chosen }, function(){
                sendMessageWithDebug({ command: 'apply_icon_theme', theme: chosen }, function(resp){
                    // Optional toast
                    try { showNotification && showNotification(`Icon updated: ${chosen}`); } catch(_){ }
                });
                // Send message to update UI icons
                chrome.runtime.sendMessage({ command: 'icon_theme_changed', theme: chosen });
                // Update local UI icons if IconSync is available
                if (window.IconSync && window.IconSync.updateBrandIcons) {
                    window.IconSync.updateBrandIcons(chosen);
                }
            });
        } catch(e) { console.error('Failed to apply icon theme', e); }
    }
    function isPremiumTheme(theme) { return theme === 'hidden'; }

    // Local countdown state as a fail-safe (no manifest changes/alarms)
    let iconTrialEndAt = 0;
    let iconTrialTimerId = null;
    function setIconTrialUI(active, remainingMs) {
        const show = !!active;
        if (iconTrialInline) iconTrialInline.classList.toggle('hidden', !show);
        if (iconTrialInlineTime) {
            const s = Math.max(0, Math.ceil((remainingMs || 0) / 1000));
            iconTrialInlineTime.textContent = `${s}s`;
        }
    }
    function startLocalIconTrialCountdown(endAtMs) {
        try { if (iconTrialTimerId) { clearInterval(iconTrialTimerId); iconTrialTimerId = null; } } catch(_){ }
    iconTrialEndAt = Math.max(Date.now(), Number(endAtMs) || (Date.now() + 60000));
        // Prime UI immediately
        setIconTrialUI(true, iconTrialEndAt - Date.now());
        iconTrialTimerId = setInterval(() => {
            const rem = iconTrialEndAt - Date.now();
            if (rem > 0) {
                setIconTrialUI(true, rem);
            } else {
                clearInterval(iconTrialTimerId); iconTrialTimerId = null; iconTrialEndAt = 0;
                setIconTrialUI(false, 0);
                // Fail-safe: ask background to end/revert if not already
                try { chrome.runtime.sendMessage({ command: 'cancel_icon_trial' }); } catch(_){ }
            }
        }, 1000);
    }

    // Listen for trial ticks from background
    chrome.runtime.onMessage.addListener(function(req){
        if (!req || !req.command) return;
        if (req.command === 'icon_trial_tick') {
            const ms = req.remainingMs || 0;
            setIconTrialUI(true, ms);
            // Sync local timer to background-reported remaining time
            startLocalIconTrialCountdown(Date.now() + ms);
        } else if (req.command === 'icon_trial_ended') {
            setIconTrialUI(false, 0);
            showNotification && showNotification('Trial ended', 'warning');
            // Update selected radio to reverted theme if provided
            if (req.revertedTo && iconRadios && iconRadios.length) {
                iconRadios.forEach(r => { r.checked = (r.value === req.revertedTo); });
            }
            // Stop local timer
            try { if (iconTrialTimerId) { clearInterval(iconTrialTimerId); iconTrialTimerId = null; } } catch(_){ }
            iconTrialEndAt = 0;
        }
    });

    // On load, query trial state
    try {
        chrome.runtime.sendMessage({ command: 'get_icon_trial' }, function(resp){
            if (resp && resp.trial) {
                const ms = resp.remainingMs || 0;
                setIconTrialUI(true, ms);
                startLocalIconTrialCountdown(Date.now() + ms);
            }
        });
    } catch(_){ }

    // Inline cancel/buy
    if (iconTrialInlineCancelBtn) iconTrialInlineCancelBtn.addEventListener('click', function(){
        try { chrome.runtime.sendMessage({ command: 'cancel_icon_trial' }, function(){ setIconTrialUI(false, 0); }); } catch(_){ }
        try { if (iconTrialTimerId) { clearInterval(iconTrialTimerId); iconTrialTimerId = null; } } catch(_){ }
        iconTrialEndAt = 0;
    });
    if (iconTrialInlineBuyBtn) iconTrialInlineBuyBtn.addEventListener('click', function(){ if (typeof openPremiumModal === 'function') openPremiumModal(); });
    if (iconTrialBuyBtn) iconTrialBuyBtn.addEventListener('click', function(){ if (typeof openPremiumModal === 'function') openPremiumModal(); });

    if (iconRadios && iconRadios.length) {
        iconRadios.forEach(r => {
            r.addEventListener('change', (e) => {
                if (e.target && e.target.checked) {
                    const v = String(e.target.value || '').toLowerCase();
                    chrome.storage.local.get(['premium_active'], function(s){
                        const premium = s.premium_active === true;
                        if (!premium && isPremiumTheme(v)) {
                            // Show trial dialog instead of immediate apply; user can click Try or Buy
                            if (iconTrialDialog) iconTrialDialog.classList.remove('hidden');
                            // Do not apply yet
                        } else {
                            applyIconTheme(v);
                            if (iconTrialDialog) iconTrialDialog.classList.add('hidden');
                            // If switching away from premium while a trial is running, cancel it
                            if (!isPremiumTheme(v)) {
                                try { chrome.runtime.sendMessage({ command: 'cancel_icon_trial' }); } catch(_){ }
                                setIconTrialUI(false, 0);
                                try { if (iconTrialTimerId) { clearInterval(iconTrialTimerId); iconTrialTimerId = null; } } catch(_){ }
                                iconTrialEndAt = 0;
                            }
                        }
                    });
                }
            });
        });
    }

    // Start trial explicitly from dialog
    if (iconTrialStartBtn) {
        iconTrialStartBtn.addEventListener('click', function(){
            // Find the selected premium theme (hidden)
            let selected = 'hidden';
            const checked = Array.from(iconRadios || []).find(r => r.checked);
            if (checked) selected = checked.value;
            // Do NOT write icon_theme to storage for a trial; let background handle trial and reversion
            try {
                chrome.runtime.sendMessage({ command: 'apply_icon_theme', theme: selected }, function(resp){ /* no-op */ });
            } catch(_) {}
            if (iconTrialDialog) iconTrialDialog.classList.add('hidden');
            const ms = 60 * 1000;
            setIconTrialUI(true, ms);
            startLocalIconTrialCountdown(Date.now() + ms);
        });
    }
    
    // Load all settings from storage
    function loadSettings() {
        console.log("DEBUG: Loading settings from storage");
        chrome.storage.local.get([
            'ninja_config',
            'block_level', 
            'show_notifications', 
            'blocked_sites', 
            'whitelisted_sites',
            'require_password',
            'default_blocked_sites',
            'block_action',
            'custom_redirect_url',
            'safe_search_enabled',
            'safe_search_options',
            'RULE_INDEX',
            'premium_active',
            'custom_keywords',
            'keyword_blocking_enabled',
            'DEFAULT_KEYWORDS_LITE',
            'DEFAULT_KEYWORDS_BALANCED',
            'DEFAULT_KEYWORDS_ULTIMATE'
        ], function(result) {
            console.log("DEBUG: Loaded settings:", result);
            premiumActive = result.premium_active === true;
            // Helper: lock/unlock Premium action tiles based on premiumActive
            function updatePremiumActionTileLocks(){
                try {
                    const grid = document.getElementById('block-action-grid');
                    if (!grid) return;
                    const tiles = grid.querySelectorAll('.action-btn.premium');
                    tiles.forEach(t => {
                        t.classList.toggle('locked', !premiumActive);
                    });
                } catch(_) {}
            }
            // General settings - use ninja_config.is_enable instead of is_enable
            if (result.ninja_config && typeof result.ninja_config.is_enable !== 'undefined') {
                ninjaEnableToggle.checked = result.ninja_config.is_enable;
                if (ninjaEnableDash) ninjaEnableDash.checked = result.ninja_config.is_enable;
                if (ninjaEnableSidebar) ninjaEnableSidebar.checked = result.ninja_config.is_enable;
                if (sidebarControl) sidebarControl.classList.toggle('active', !!result.ninja_config.is_enable);
            } else {
                ninjaEnableToggle.checked = true; // Default to true
                if (ninjaEnableDash) ninjaEnableDash.checked = true;
                if (ninjaEnableSidebar) ninjaEnableSidebar.checked = true;
                if (sidebarControl) sidebarControl.classList.add('active');
            }
            
            const level = result.block_level || 'normal';
            blockLevelSelect.value = level;
            prevBlockLevel = level;
            if (blockBtns) {
                [...blockBtns.querySelectorAll('.btn')].forEach(b => {
                    if (b.dataset.level === level) b.classList.add('active'); else b.classList.remove('active');
                });
            }
            
            if (showNotificationsToggle) {
                showNotificationsToggle.checked = result.show_notifications !== false; // Default to true
            }
            
            // Block action settings
            if (result.block_action) {
                blockActionSelect.value = result.block_action;
                
                // Show/hide custom redirect URL input based on selection
                if (result.block_action === 'redirect') {
                    customRedirectUrlContainer.style.display = 'flex';
                } else {
                    customRedirectUrlContainer.style.display = 'none';
                }
                // Highlight the visual action tile
                try { setActiveActionTile(result.block_action); } catch(e) {}
            } else {
                // No saved value: highlight select default (fallback to custom-page)
                try { setActiveActionTile(blockActionSelect ? (blockActionSelect.value || 'custom-page') : 'custom-page'); } catch(e) {}
            }
            // Apply premium locks to action tiles now that premiumActive is known
            updatePremiumActionTileLocks();
            
            // Set custom redirect URL if available
        if (result.custom_redirect_url) {
            customRedirectUrlInput.value = result.custom_redirect_url;
            if (redirectUrlPill) redirectUrlPill.textContent = result.custom_redirect_url;
        }
            
            // Safe Search settings
            enableSafeSearchToggle.checked = result.safe_search_enabled !== false; // Default to true
            if (safeSearchDash) safeSearchDash.checked = enableSafeSearchToggle.checked;
            
            // Show/hide safe search options based on main toggle
            safeSearchOptionsContainer.style.display = enableSafeSearchToggle.checked ? 'block' : 'none';
            
            // Set individual safe search options
            if (result.safe_search_options) {
                safeSearchGoogleToggle.checked = result.safe_search_options.google !== false; // Default to true
                safeSearchBingToggle.checked = result.safe_search_options.bing !== false; // Default to true
                safeSearchYahooToggle.checked = result.safe_search_options.yahoo !== false; // Default to true
                safeSearchDuckDuckGoToggle.checked = result.safe_search_options.duckduckgo !== false; // Default to true
                safeSearchYouTubeToggle.checked = result.safe_search_options.youtube !== false; // Default to true
                safeSearchFacebookToggle.checked = result.safe_search_options.facebook !== false; // Default to true
            }
            // Dashboard provider chips
            try {
                const enabled = enableSafeSearchToggle.checked;
                const opts = result.safe_search_options || {};
                renderDashSafeProviders(enabled, opts);
            } catch(_) {}

            // Premium gating UI state for provider toggles (Bing free)
            const premiumLockedInit = !premiumActive;
            [
                { el: safeSearchBingToggle, premium: false },
                { el: safeSearchYahooToggle, premium: true },
                { el: safeSearchDuckDuckGoToggle, premium: true },
                { el: safeSearchYouTubeToggle, premium: true },
                { el: safeSearchFacebookToggle, premium: true }
            ].forEach(({ el, premium }) => {
                    if (!el) return;
                    const isLocked = premium ? premiumLockedInit : false;
                    el.disabled = isLocked;
                    if (isLocked) el.checked = false; // ensure toggle appears off when locked
                    el.title = isLocked ? 'Premium required' : '';
                    const row = el.closest('.setting-item.provider');
                    if (row) {
                        row.classList.toggle('premium-locked', isLocked);
                        // ensure any previous badge in title is removed
                        const oldTitleBadge = row.querySelector('.setting-info h3 .level-prem');
                        if (!isLocked && oldTitleBadge) oldTitleBadge.remove();
                        // inject/remove Premium badge next to the toggle (left side)
                        const control = row.querySelector('.setting-control');
                        if (!control) return;
                        let badge = control.querySelector('.level-prem');
                        if (isLocked) {
                            if (!badge) {
                                badge = document.createElement('span');
                                badge.className = 'level-prem';
                                badge.textContent = 'Premium';
                                // insert just before the toggle label so it's left of the toggle
                                const toggleLabel = control.querySelector('label.toggle-switch');
                                if (toggleLabel && toggleLabel.parentNode === control) {
                                    control.insertBefore(badge, toggleLabel);
                                } else {
                                    control.prepend(badge);
                                }
                            }
                            // attach a single gating click handler to open premium modal on toggle/premium click
                            if (!control.dataset.premiumGate) {
                                control.dataset.premiumGate = '1';
                                control._premiumGateHandler = function(e){
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (typeof openPremiumModal === 'function') openPremiumModal();
                                };
                                control.addEventListener('click', control._premiumGateHandler);
                            }
                        } else {
                            if (badge) badge.remove();
                            // remove gating handler on unlock
                            if (control.dataset.premiumGate) {
                                delete control.dataset.premiumGate;
                                if (control._premiumGateHandler) control.removeEventListener('click', control._premiumGateHandler);
                                delete control._premiumGateHandler;
                            }
                        }
                    }
                });
            
            // Require password toggle init (default true for first-time installations)
            if (typeof result.require_password !== 'undefined') {
                requirePasswordToggle.checked = result.require_password === true;
            } else {
                requirePasswordToggle.checked = true;
            }

            // Store default blocked sites if available
            if (result.default_blocked_sites && Array.isArray(result.default_blocked_sites)) {
                defaultBlockedSites = result.default_blocked_sites;
            }
            
            // Block list
            if (result.blocked_sites && Array.isArray(result.blocked_sites)) {
                blockedSites = result.blocked_sites;
                renderBlockList();
                updateBlockListLimitUI();
            } else {
                // If no blocked_sites are found, initialize with an empty array
                blockedSites = [];
                renderBlockList();
                updateBlockListLimitUI();
            }
            
            // Whitelist
            if (result.whitelisted_sites && Array.isArray(result.whitelisted_sites)) {
                whitelistedSites = result.whitelisted_sites;
                renderWhitelist();
                updateWhitelistLimitUI();
            } else {
                // If no whitelisted_sites are found, initialize with an empty array
                whitelistedSites = [];
                renderWhitelist();
                updateWhitelistLimitUI();
            }
            
            // Keywords
            if (result.custom_keywords && Array.isArray(result.custom_keywords)) {
                customKeywords = result.custom_keywords;
            }
            if (result.DEFAULT_KEYWORDS_LITE) defaultKeywordsLite = result.DEFAULT_KEYWORDS_LITE;
            if (result.DEFAULT_KEYWORDS_BALANCED) defaultKeywordsBalanced = result.DEFAULT_KEYWORDS_BALANCED;
            if (result.DEFAULT_KEYWORDS_ULTIMATE) defaultKeywordsUltimate = result.DEFAULT_KEYWORDS_ULTIMATE;
            
            // Render keyword list (keyword blocking is always enabled in Lite)
            renderKeywordList();
            
            // Stats (Dashboard): obfuscated Active rules; others count-up
            animateCount(statCustom, (blockedSites || []).length);
            animateCount(statWhitelist, (whitelistedSites || []).length);
            updateActiveRulesMetric(level);
            
            // Update version number
            const versionElements = document.querySelectorAll('#version-number, #about-version');
            const manifestURL = chrome.runtime.getURL('manifest.json');
            
            fetch(manifestURL)
                .then(response => response.json())
                .then(manifest => {
                    versionElements.forEach(el => {
                        el.textContent = manifest.version;
                    });
                });

            // Update status bar
            updateStatusBar();
        });
    }

    // Limit: allow at most 15 user-added blocked sites (upsell for Premium beyond that)
    function updateBlockListLimitUI() {
        try {
            const limit = 15;
            const reached = !premiumActive && (blockedSites || []).length >= limit;
            if (newBlockSiteInput) {
                newBlockSiteInput.disabled = reached ? true : false;
                if (reached) {
                    newBlockSiteInput.setAttribute('placeholder', 'Upgrade to Premium to add more');
                } else {
                    newBlockSiteInput.setAttribute('placeholder', 'Enter domain to block (e.g., example.com)');
                }
            }
            if (addBlockSiteBtn) addBlockSiteBtn.disabled = reached ? true : false;
            // Inline hint under the input
            const container = newBlockSiteInput ? newBlockSiteInput.closest('.setting-item') || newBlockSiteInput.parentElement : null;
            if (container) {
                let hint = container.querySelector('#blocklist-premium-hint');
                if (reached) {
                    if (!hint) {
                        hint = document.createElement('div');
                        hint.id = 'blocklist-premium-hint';
                        hint.className = 'message warning';
                        hint.style.marginTop = '8px';
                        hint.innerHTML = '<span>Limit reached: Upgrade to Premium to add more than 3 sites</span> <button type="button" class="inline-premium-btn" id="blocklist-inline-premium">Get Premium</button>';
                        // place after input group
                        const group = container.querySelector('.input-group.with-button');
                        if (group && group.parentNode) group.parentNode.appendChild(hint); else container.appendChild(hint);
                        const btn = hint.querySelector('#blocklist-inline-premium');
                        if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); if (typeof openPremiumModal === 'function') openPremiumModal(); });
                    } else {
                        // ensure button exists and is wired
                        if (!hint.querySelector('#blocklist-inline-premium')) {
                            const btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className = 'inline-premium-btn';
                            btn.id = 'blocklist-inline-premium';
                            btn.textContent = 'Get Premium';
                            btn.addEventListener('click', (e) => { e.preventDefault(); if (typeof openPremiumModal === 'function') openPremiumModal(); });
                            hint.appendChild(document.createTextNode(' '));
                            hint.appendChild(btn);
                        }
                    }
                } else if (hint) {
                    hint.remove();
                }
            }
        } catch (e) { console.warn('DEBUG: updateBlockListLimitUI failed', e); }
    }

    // Update status bar pills
    function updateStatusBar() {
        const protectionEl = document.getElementById('status-protection');
        const levelEl = document.getElementById('status-block-level');
        const safeEl = document.getElementById('status-safe-search');
        if (!protectionEl || !levelEl || !safeEl) return;
        const isOn = !!ninjaEnableToggle.checked;
        const safeOn = !!enableSafeSearchToggle.checked;
        protectionEl.textContent = `Protection: ${isOn ? 'On' : 'Off'}`;
    const labelMap = { 'normal': 'Lite', 'strict': 'Balanced', 'very-strict': 'Ultimate' };
        levelEl.textContent = `Block Level: ${labelMap[blockLevelSelect.value] || '—'}`;
        safeEl.textContent = `Safe Search: ${safeOn ? 'On' : 'Off'}`;
        // Color classes for pills
        protectionEl.classList.remove('on','off');
        protectionEl.classList.add(isOn ? 'on' : 'off');
        safeEl.classList.remove('on','off');
        safeEl.classList.add(safeOn ? 'on' : 'off');
    // Dashboard protection text removed
        if (dashSafeLabel) {
            dashSafeLabel.textContent = safeOn ? 'On' : 'Off';
            dashSafeLabel.classList.remove('on','off');
            dashSafeLabel.classList.add(safeOn ? 'on' : 'off');
        }
        try { renderDashSafeProviders(safeOn, {
            google: safeSearchGoogleToggle && safeSearchGoogleToggle.checked,
            bing: safeSearchBingToggle && safeSearchBingToggle.checked,
            yahoo: safeSearchYahooToggle && safeSearchYahooToggle.checked,
            duckduckgo: safeSearchDuckDuckGoToggle && safeSearchDuckDuckGoToggle.checked,
            youtube: safeSearchYouTubeToggle && safeSearchYouTubeToggle.checked,
            facebook: safeSearchFacebookToggle && safeSearchFacebookToggle.checked,
        }); } catch(_) {}
    }
    
    // Render block list
    function renderBlockList() {
        console.log("DEBUG: Rendering block list with", blockedSites.length, "sites");
        blockList.innerHTML = '';
        
        if (blockedSites.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'list-item';
            emptyMessage.innerHTML = '<span class="domain-name">No sites added to block list</span>';
            blockList.appendChild(emptyMessage);
            return;
        }
        
        // Sort the block list alphabetically
        const sortedSites = [...blockedSites].sort((a, b) => a.localeCompare(b));
        
        sortedSites.forEach((site, index) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            const domain = document.createElement('span');
            domain.className = 'domain-name';
            domain.textContent = site;
            
            const action = document.createElement('span');
            action.className = 'action';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = 'Remove';
            removeBtn.dataset.site = site; // Store the site in a data attribute
            removeBtn.addEventListener('click', function() {
                const siteToRemove = this.dataset.site;
                removeBlockedSite(siteToRemove);
            });
            
            action.appendChild(removeBtn);
            item.appendChild(domain);
            item.appendChild(action);
            blockList.appendChild(item);
        });
    }
    
    // Keyword Functions
    function renderKeywordList() {
        if (!keywordList) return;
        
        keywordList.innerHTML = '';
        
        if (customKeywords.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'list-item empty-message';
            emptyMessage.innerHTML = '<span>No keywords added yet</span>';
            keywordList.appendChild(emptyMessage);
            return;
        }
        
        customKeywords.forEach((keyword) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            const keywordSpan = document.createElement('span');
            keywordSpan.className = 'domain-name';
            keywordSpan.textContent = keyword;
            
            const action = document.createElement('span');
            action.className = 'action';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = function() {
                removeKeyword(keyword);
            };
            
            action.appendChild(removeBtn);
            item.appendChild(keywordSpan);
            item.appendChild(action);
            keywordList.appendChild(item);
        });
    }
    
    function addKeyword() {
        const keyword = newKeywordInput?.value.trim().toLowerCase();
        
        if (!keyword) {
            showNotification('Please enter a keyword', 'warning');
            return;
        }
        
        if (customKeywords.includes(keyword)) {
            showNotification('Keyword already exists', 'warning');
            return;
        }
        
        // Check limit for free users
        if (!premiumActive) {
            const totalCustomSites = blockedSites.length + whitelistedSites.length;
            const freeKeywordLimit = Math.min(10, totalCustomSites);
            
            if (customKeywords.length >= freeKeywordLimit) {
                if (freeKeywordLimit === 0) {
                    showNotification('💡 Tip: Add blocked or whitelisted sites first to unlock keywords!', 'info');
                } else {
                    showNotification(`🎯 You\'ve used ${customKeywords.length} of ${freeKeywordLimit} free keywords! Want unlimited? Go Premium! ⭐`, 'warning');
                    if (typeof openPremiumModal === 'function') {
                        setTimeout(() => openPremiumModal(), 1500);
                    }
                }
                return;
            }
        }
        
        customKeywords.push(keyword);
        
        // Save to storage and update rules
        chrome.storage.local.set({ custom_keywords: customKeywords }, function() {
            chrome.runtime.sendMessage({ command: 'update_keywords', keywords: customKeywords }, function(response) {
                console.log('Keywords updated:', response);
                renderKeywordList();
                // Update limit display if needed
                if (!premiumActive && newKeywordInput) {
                    const totalCustomSites = blockedSites.length + whitelistedSites.length;
                    const freeKeywordLimit = Math.min(10, totalCustomSites);
                    if (customKeywords.length >= freeKeywordLimit) {
                        newKeywordInput.setAttribute('placeholder', 'Upgrade to Premium to add more');
                        addKeywordBtn.disabled = true;
                    }
                }
                newKeywordInput.value = '';
                showNotification(`Keyword "${keyword}" added successfully`);
            });
        });
    }
    
    function removeKeyword(keyword) {
        const index = customKeywords.indexOf(keyword);
        if (index > -1) {
            customKeywords.splice(index, 1);
            
            chrome.storage.local.set({ custom_keywords: customKeywords }, function() {
                chrome.runtime.sendMessage({ command: 'update_keywords', keywords: customKeywords }, function(response) {
                    console.log('Keywords updated:', response);
                    renderKeywordList();
                    // Re-enable input if under limit
                    if (!premiumActive && newKeywordInput) {
                        const totalCustomSites = blockedSites.length + whitelistedSites.length;
                        const freeKeywordLimit = Math.min(10, totalCustomSites);
                        if (customKeywords.length < freeKeywordLimit) {
                            newKeywordInput.setAttribute('placeholder', 'Enter keyword to block (e.g., dating)');
                            newKeywordInput.disabled = false;
                            addKeywordBtn.disabled = false;
                        }
                    }
                    showNotification(`Keyword "${keyword}" removed successfully`);
                });
            });
        }
    }
    
    // Render whitelist
    function renderWhitelist() {
        console.log("DEBUG: Rendering whitelist with", whitelistedSites.length, "sites");
        whitelist.innerHTML = '';
        
        if (whitelistedSites.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'list-item';
            emptyMessage.innerHTML = '<span class="domain-name">No sites added to whitelist</span>';
            whitelist.appendChild(emptyMessage);
            updateWhitelistLimitUI();
            return;
        }
        
        whitelistedSites.forEach((site, index) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            const domain = document.createElement('span');
            domain.className = 'domain-name';
            domain.textContent = site;
            
            const action = document.createElement('span');
            action.className = 'action';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = 'Remove';
            removeBtn.dataset.index = index;
            removeBtn.addEventListener('click', function() {
                removeWhitelistedSite(index);
            });
            
            action.appendChild(removeBtn);
            item.appendChild(domain);
            item.appendChild(action);
            whitelist.appendChild(item);
        });
    updateWhitelistLimitUI();
    }
    
    // Format and validate the custom redirect URL
    function formatRedirectUrl(url) {
        console.log("DEBUG: Formatting redirect URL:", url);
        // Trim whitespace
        url = url.trim();
        
        // Return empty string if no URL
        if (!url) return '';
        
        // If the URL doesn't start with http:// or https://, add https://
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        
        // Try to create a URL object to validate and normalize the URL
        try {
            const urlObj = new URL(url);
            return urlObj.href; // Return the full normalized URL
        } catch (e) {
            // If URL is invalid, try adding www. prefix and try again
            if (!url.includes('www.') && !/^https?:\/\/www\./i.test(url)) {
                try {
                    const urlWithWww = url.replace(/^(https?:\/\/)/i, '$1www.');
                    const urlObj = new URL(urlWithWww);
                    return urlObj.href; // Return the full normalized URL
                } catch (e) {
                    // Still invalid, just return original with https://
                    return url;
                }
            }
            // Just return the URL with https:// added
            return url;
        }
    }
    
    // Save all settings
    function saveSettings() {
        // Begin apply feedback; background completion will trigger final toast
        setSaving(true);
        console.log("DEBUG: Saving settings started");
        // Format the custom redirect URL before saving
        const formattedRedirectUrl = formatRedirectUrl(customRedirectUrlInput.value);
        
        // Update the input field with the formatted URL
        if (formattedRedirectUrl) {
            customRedirectUrlInput.value = formattedRedirectUrl;
        }
        
        // Safe Search options
        const safeSearchOptions = {
            google: safeSearchGoogleToggle.checked,
            bing: safeSearchBingToggle.checked,
            yahoo: safeSearchYahooToggle.checked,
            duckduckgo: safeSearchDuckDuckGoToggle.checked,
            youtube: safeSearchYouTubeToggle.checked,
            facebook: safeSearchFacebookToggle.checked
        };
        
        console.log("DEBUG: Prepared settings to save:", {
            is_enable: ninjaEnableToggle.checked,
            block_level: blockLevelSelect.value,
            show_notifications: showNotificationsToggle ? showNotificationsToggle.checked : true,
            require_password: requirePasswordToggle.checked,
            blocked_sites_count: blockedSites.length,
            whitelisted_sites_count: whitelistedSites.length,
            block_action: blockActionSelect.value,
            custom_redirect_url: formattedRedirectUrl,
            safe_search_enabled: enableSafeSearchToggle.checked
        });
        
        // Dashboard: App Icon current state (refresh label/thumb safely)
        try {
            chrome.storage.local.get(['icon_theme'], function(r){
                const theme = r && r.icon_theme ? r.icon_theme : 'classic';
                const meta = getIconThemeMeta(theme);
                if (dashIconThumb) {
                    // shimmer while loading, then set src
                    dashIconThumb.classList.add('loading');
                    dashIconThumb.onload = function(){ this.classList.remove('loading'); this.classList.remove('broken'); };
                    dashIconThumb.onerror = function(){
                        // Fallback to classic asset if themed image is missing
                        const fallback = '../assets/images/ninja-enable.png';
                        if (!this.src.includes('ninja-enable.png')) {
                            this.src = fallback;
                        } else {
                            this.classList.add('broken');
                        }
                        this.classList.remove('loading');
                    };
                    dashIconThumb.src = meta.src;
                    dashIconThumb.alt = meta.label + ' icon';
                }
            });
        } catch(_) {}

        // Get the current ninja_config first to preserve any existing values
        chrome.storage.local.get(['ninja_config'], function(result) {
            console.log("DEBUG: Got current ninja_config:", result.ninja_config);
            let ninjaConfig = result.ninja_config || { version: "2.8" };
            
            // Update the ninja_config with the new settings
            ninjaConfig.is_enable = ninjaEnableToggle.checked;
            
            console.log("DEBUG: Updated ninja_config:", ninjaConfig);
            
            // Update the ninja_config in storage
            chrome.storage.local.set({
                "ninja_config": ninjaConfig,
                "block_level": blockLevelSelect.value,
                "show_notifications": showNotificationsToggle ? showNotificationsToggle.checked : true,
                "require_password": requirePasswordToggle.checked,
                "blocked_sites": blockedSites,
                "whitelisted_sites": whitelistedSites,
                "block_action": blockActionSelect.value,
                "custom_redirect_url": formattedRedirectUrl,
                "safe_search_enabled": enableSafeSearchToggle.checked,
                "safe_search_options": safeSearchOptions
            }, function() {
                console.log("DEBUG: Settings saved to storage");
                
                // After saving settings to storage, notify the background script about specific changes
                
                // Update safe search rules
                sendMessageWithDebug({ 
                    command: 'update_safe_search',
                    enabled: enableSafeSearchToggle.checked,
                    options: safeSearchOptions
                });
                
                // Also update ninja state to apply changes immediately
                sendMessageWithDebug({ 
                    command: 'update_ninja_state', 
                    is_enable: ninjaEnableToggle.checked 
                }, function() {
                    console.log("DEBUG: Ninja state updated, now updating block list");
                    
                    // Also reload the blocker to apply changes immediately
                    sendMessageWithDebug({ command: 'update_block_list' }, function(response) {
                        console.log("DEBUG: Block list updated with response:", response);
                        // Do not clear saving here; wait for RULE_INDEX finalize to ensure rules are applied
                    });
                });
            });
        });
    }
    
    // Add site to block list
    function addBlockedSite(site) {
        console.log("DEBUG: Adding site to block list:", site);
        site = site.trim().toLowerCase();
        // Enforce free limit
        const LIMIT = 15;
        if ((blockedSites || []).length >= LIMIT) {
            showNotification('🎉 Nice! You\'ve used all 15 free blocks. Want unlimited? Check Premium! 🚀', 'warning', { title: 'Upgrade Available' });
            updateBlockListLimitUI();
            openPremiumModal && openPremiumModal();
            return;
        }
        
        if (!site) {
            showNotification('Please enter a domain to block', 'error');
            return;
        }
        
        // Validate the domain format
        const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
        
        // Remove http://, https://, www. prefixes
        site = site.replace(/^(https?:\/\/)?(www\.)?/, '');
        
        // Remove path and query parameters, get only domain
        site = site.split(/[/?#]/)[0];
        
        if (!domainRegex.test(site)) {
            showNotification('Please enter a valid domain (e.g., example.com)', 'error');
            return;
        }
        
        if (whitelistedSites.includes(site)) {
            showNotification('This site is in your whitelist. Remove it from whitelist first.', 'error');
            return;
        }
        
        if (blockedSites.includes(site)) {
            showNotification('This site is already in the block list', 'error');
            return;
        }
        
        // Add the site to the block list
        blockedSites.push(site);
        
        // Update the UI
        renderBlockList();
    updateBlockListLimitUI();
        
        // Clear the input field
        newBlockSiteInput.value = '';
        
        // Show success notification
        showNotification(`Added ${site} to block list`, 'success');
        
        // Save changes immediately
        saveSettings();
    }
    
    // Remove site from block list
    function removeBlockedSite(site) {
        console.log("DEBUG: Removing site from block list:", site);
        // Find the index of the site in the array
        const index = blockedSites.indexOf(site);
        
        // Only proceed if the site was found
        if (index !== -1) {
            // Check if this is a default site
            const isDefaultSite = defaultBlockedSites.includes(site);
            
            // If it's a default site, ask for confirmation
            if (isDefaultSite) {
                if (!confirm(`${site} is a default blocked site. Are you sure you want to remove it?`)) {
                    return;
                }
            }
            
            // Remove the site from the array
            blockedSites.splice(index, 1);
            
            // Update the UI
            renderBlockList();
            updateBlockListLimitUI();
            
            // Show success notification
            showNotification(`Removed ${site} from block list`, 'success');
            
            // Save changes immediately
            saveSettings();
        }
    }
    
    // Add site to whitelist
    function addWhitelistedSite(site) {
        console.log("DEBUG: Adding site to whitelist:", site);
        site = site.trim().toLowerCase();
        const LIMIT = 15;
        if ((whitelistedSites || []).length >= LIMIT) {
            showNotification('✨ Awesome! You\'ve used all 15 free whitelist slots. Need more? Try Premium! 💎', 'warning', { title: 'Upgrade Available' });
            updateWhitelistLimitUI();
            openPremiumModal();
            return;
        }
        
        if (!site) {
            console.log("DEBUG: Empty site name, aborting");
            return;
        }
        
        // Remove http://, https://, www. prefixes
        site = site.replace(/^(https?:\/\/)?(www\.)?/, '');
        
        // Remove path and get only domain
        site = site.split('/')[0];
        
        if (whitelistedSites.includes(site)) {
            console.log("DEBUG: Site already in whitelist, aborting");
            showNotification('This site is already in the whitelist', 'error');
            return;
        }
        
        // Add the site to the whitelist
        whitelistedSites.push(site);
        console.log("DEBUG: Added site to whitelist, now rendering");
        renderWhitelist();
        newWhitelistSiteInput.value = '';
        
        // Show success notification
        showNotification(`Added ${site} to whitelist`, 'success');
        
        // Save changes immediately
        console.log("DEBUG: Saving whitelist changes");
        saveSettings();
        
        // Send message to background script to immediately update blocking rules
        // This ensures that whitelisted sites are unblocked right away
        console.log("DEBUG: Sending update_whitelist message");
        sendMessageWithDebug({
            command: 'update_whitelist',
            action: 'add',
            site: site
        }, function(response) {
            console.log("DEBUG: Whitelist update response:", response);
            if (response && response.rulesRemoved > 0) {
                showNotification(`Removed ${response.rulesRemoved} blocking rules for ${site}`, 'success');
            }
        });
    }
    
    // Remove site from whitelist
    function removeWhitelistedSite(index) {
        const site = whitelistedSites[index];
        console.log("DEBUG: Removing site from whitelist:", site);
        whitelistedSites.splice(index, 1);
        renderWhitelist();
    updateWhitelistLimitUI();
        
        // Save changes immediately
        console.log("DEBUG: Saving whitelist changes after removal");
        saveSettings();
    }

    // Whitelist limit UI helper
    function updateWhitelistLimitUI() {
        try {
            const limit = 15;
            const reached = !premiumActive && (whitelistedSites || []).length >= limit;
            if (newWhitelistSiteInput) {
                newWhitelistSiteInput.disabled = reached ? true : false;
                newWhitelistSiteInput.setAttribute('placeholder', reached ? 'Upgrade to Premium to add more' : 'Enter domain to whitelist (e.g., example.com)');
            }
            if (addWhitelistSiteBtn) addWhitelistSiteBtn.disabled = reached ? true : false;
            const container = newWhitelistSiteInput ? newWhitelistSiteInput.closest('.setting-item') || newWhitelistSiteInput.parentElement : null;
            if (container) {
                let hint = container.querySelector('#whitelist-premium-hint');
                if (reached) {
                    if (!hint) {
                        hint = document.createElement('div');
                        hint.id = 'whitelist-premium-hint';
                        hint.className = 'message warning';
                        hint.style.marginTop = '8px';
                        hint.innerHTML = '<span>Limit reached: Upgrade to Premium to add more than 3 sites</span> <button type="button" class="inline-premium-btn" id="whitelist-inline-premium">Get Premium</button>';
                        const group = container.querySelector('.input-group.with-button');
                        if (group && group.parentNode) group.parentNode.appendChild(hint); else container.appendChild(hint);
                        const btn = hint.querySelector('#whitelist-inline-premium');
                        if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); if (typeof openPremiumModal === 'function') openPremiumModal(); });
                    } else {
                        if (!hint.querySelector('#whitelist-inline-premium')) {
                            const btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className = 'inline-premium-btn';
                            btn.id = 'whitelist-inline-premium';
                            btn.textContent = 'Get Premium';
                            btn.addEventListener('click', (e) => { e.preventDefault(); if (typeof openPremiumModal === 'function') openPremiumModal(); });
                            hint.appendChild(document.createTextNode(' '));
                            hint.appendChild(btn);
                        }
                    }
                } else if (hint) {
                    hint.remove();
                }
            }
        } catch (e) { console.warn('DEBUG: updateWhitelistLimitUI failed', e); }
    }

    // Premium modal helpers
    function openPremiumModal(fromRoute = false) {
        try {
            if (premiumModal) {
                // Close others
                try { closeLicenseModal(); } catch(_) {}
                try { closeGiftLicenseModal(); } catch(_) {}
                premiumModal.classList.remove('hidden');
                premiumModal.setAttribute('aria-hidden', 'false');
                if (!fromRoute) setModalRoute('premium');
                
                // Show fixed countdown timer
                const fixedCountdown = document.getElementById('discount-countdown');
                if (fixedCountdown) {
                    fixedCountdown.classList.remove('hidden');
                }
            }
        } catch(_){}
    }
    function closePremiumModal() {
        try {
            if (premiumModal) {
                premiumModal.classList.add('hidden');
                premiumModal.setAttribute('aria-hidden', 'true');
                clearRouteIfMatches(['premium','plans']);
                
                // Hide fixed countdown timer
                const fixedCountdown = document.getElementById('discount-countdown');
                if (fixedCountdown) {
                    fixedCountdown.classList.add('hidden');
                }
            }
        } catch(_){}
    }
    if (premiumCloseBtn) premiumCloseBtn.addEventListener('click', closePremiumModal);
    if (premiumDismissBtn) premiumDismissBtn.addEventListener('click', closePremiumModal);
    if (premiumModal) premiumModal.addEventListener('click', (e) => { if (e.target === premiumModal) closePremiumModal(); });

    // Topbar buttons
    if (getPremiumBtn) getPremiumBtn.addEventListener('click', () => { if (typeof openPremiumModal === 'function') openPremiumModal(); });
    
    // Sidebar countdown timer - click to open pricing modal
    const sidebarCountdown = document.getElementById('sidebar-countdown');
    if (sidebarCountdown) {
        sidebarCountdown.addEventListener('click', () => { if (typeof openPremiumModal === 'function') openPremiumModal(); });
    }

    // Gifted Premium button opens dedicated Gift License modal (prefill from inline form if present)
    if (giftOpenBtn) {
        giftOpenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // If premium plans modal is open, close it before opening gift
            try { closePremiumModal(); } catch(_) {}
            if (typeof openGiftLicenseModal === 'function') openGiftLicenseModal(true);
        });
    }

    function buildGiftEmailPayload() {
        const to = 'ixstudio.net@gmail.com'; // can be customized
    const subj = 'Ninja Premium Gift Request — 6‑month';
        const email = (giftEmailInput && giftEmailInput.value || '').trim();
    const reason = (giftReasonSelect && giftReasonSelect.value) || 'Financial hardship';
        const note = (giftMessage && giftMessage.value || '').trim();
        const ua = navigator.userAgent || '';
        const bodyLines = [
            'Hi Ninja team,',
            '',
            `I can’t afford Premium right now. Please consider a gifted license.`,
            '',
            `Email: ${email || '<your email>'}`,
            `Reason: ${reason}`,
            note ? `Message: ${note}` : '',
            '',
            `Browser: ${ua.includes('Chrome') ? 'Chrome' : ua.split(')')[0] || 'Unknown'}`,
            '',
            'Thank you!'
        ].filter(Boolean).join('\n');
        const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(bodyLines)}`;
        return { href, bodyText: bodyLines };
    }

    function validateGiftForm() {
        const email = (giftEmailInput && giftEmailInput.value || '').trim();
        const ok = /.+@.+\..+/.test(email);
        if (!ok) {
            showNotification && showNotification('Please enter a valid email', 'warning', { title: 'Gift request' });
            if (giftEmailInput) {
                giftEmailInput.focus();
                const field = giftEmailInput.closest('.gift-field');
                if (field) {
                    field.classList.add('invalid');
                    setTimeout(() => field.classList.remove('invalid'), 600);
                }
            }
        }
        return ok;
    }

    if (giftSendBtn) {
        giftSendBtn.addEventListener('click', () => {
            if (!validateGiftForm()) return;
            const { href } = buildGiftEmailPayload();
            try {
                // Prefer opening the mail client
                window.open(href, '_blank', 'noopener');
                showNotification && showNotification('Opening email draft…', 'info');
            } catch(_) {
                // Fallback
                location.href = href;
            }
        });
    }
    // removed inline gift mailto/copy listeners
    function setLicenseModalState(active, key) {
        // Toggle views
        if (licenseFormView && licenseFormActions && licenseActiveView && licenseActiveActions) {
            licenseFormView.classList.toggle('hidden', !!active);
            licenseFormActions.classList.toggle('hidden', !!active);
            licenseActiveView.classList.toggle('hidden', !active);
            licenseActiveActions.classList.toggle('hidden', !active);
        }
        if (licenseTitle) licenseTitle.textContent = active ? 'Premium Active' : 'Enter License';
        if (licenseSubtitle) licenseSubtitle.textContent = active ? 'Your license is active on this browser' : 'Paste your license key to activate Premium';
        if (licenseHint) licenseHint.classList.toggle('hidden', !!active);
        if (licenseKeyText) {
            const masked = (key || '').replace(/[A-Z0-9](?=[A-Z0-9]{0,3}(?:-|$))/g, '•');
            licenseKeyText.textContent = masked || '••••-••••-••••-••••';
        }
    }
    function openLicenseModal(fromRoute = false) { try { if (licenseOverlay) {
        // Close others
        try { closePremiumModal(); } catch(_) {}
        try { closeGiftLicenseModal(); } catch(_) {}
        chrome.storage.local.get(['premium_active','premium_license_key'], function(res){
            const isActive = res.premium_active === true;
            setLicenseModalState(isActive, res.premium_license_key || '');
            if (!isActive) {
                licenseInput && (licenseInput.value = '');
                if (licenseError) licenseError.classList.add('hidden');
                licenseSubmitBtn && (licenseSubmitBtn.disabled = true);
                setTimeout(() => licenseInput && licenseInput.focus(), 10);
            }
        });
        licenseOverlay.classList.remove('hidden'); licenseOverlay.setAttribute('aria-hidden', 'false');
        if (!fromRoute) setModalRoute('license');
    } } catch(_){} }
    function closeLicenseModal() { try { if (licenseOverlay) { licenseOverlay.classList.add('hidden'); licenseOverlay.setAttribute('aria-hidden', 'true'); clearRouteIfMatches('license'); } } catch(_){} }
    if (enterLicenseBtn) enterLicenseBtn.addEventListener('click', openLicenseModal);
    if (licenseCloseBtn) licenseCloseBtn.addEventListener('click', closeLicenseModal);
    if (licenseCancelBtn) licenseCancelBtn.addEventListener('click', closeLicenseModal);
    if (licenseOverlay) licenseOverlay.addEventListener('click', (e) => { if (e.target === licenseOverlay) closeLicenseModal(); });
    function formatLicenseKey(raw) {
        // No formatting - accept any format
        return (raw || '').trim();
    }
    function isLicenseValid(val) {
        // Accept any non-empty string as valid
        return !!(val && val.trim().length > 0);
    }
    if (licenseInput) {
        // Live format and validation
        licenseInput.addEventListener('input', () => {
            const pos = licenseInput.selectionStart;
            const before = licenseInput.value;
            const formatted = formatLicenseKey(before);
            licenseInput.value = formatted;
            if (licenseError) licenseError.classList.add('hidden');
            if (licenseSubmitBtn) licenseSubmitBtn.disabled = !isLicenseValid(formatted);
        });
        // Paste helper: format pasted content
        licenseInput.addEventListener('paste', (e) => {
            const data = (e.clipboardData || window.clipboardData).getData('text');
            if (data) {
                e.preventDefault();
                const formatted = formatLicenseKey(data);
                licenseInput.value = formatted;
                if (licenseSubmitBtn) licenseSubmitBtn.disabled = !isLicenseValid(formatted);
                if (licenseError) licenseError.classList.toggle('hidden', isLicenseValid(formatted));
            }
        });
    }
    if (licensePasteBtn && navigator.clipboard) {
        licensePasteBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                const formatted = formatLicenseKey(text);
                if (licenseInput) licenseInput.value = formatted;
                if (licenseSubmitBtn) licenseSubmitBtn.disabled = !isLicenseValid(formatted);
                if (licenseError) licenseError.classList.toggle('hidden', isLicenseValid(formatted));
                licenseInput && licenseInput.focus();
            } catch (e) {
                showNotification && showNotification('Clipboard access denied', 'error');
            }
        });
    }
    async function activateLicense() {
        try {
            const key = (licenseInput && licenseInput.value || '').trim();
            if (!isLicenseValid(key)) { 
                if (licenseError) licenseError.classList.remove('hidden'); 
                showNotification && showNotification('Please enter a valid license key', 'warning', { title: 'License' }); 
                return; 
            }
            
            // enter loading state
            licenseSubmitBtn && licenseSubmitBtn.classList.add('loading');
            licenseSubmitBtn && (licenseSubmitBtn.disabled = true);
            
            // Product IDs for verification
            const productIds = [
                'R9OZ-ECl7exk_RyHT5VlKA==',  // Monthly/Yearly subscription
                'AVbZxOa08Fs1NzbIkq0hZw=='   // Lifetime license
            ];
            
            let licenseValid = false;
            let validProduct = null;
            
            // Try to verify license with each product
            for (const productId of productIds) {
                try {
                    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            product_id: productId,
                            license_key: key,
                            increment_uses_count: 'false'
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success === true) {
                        licenseValid = true;
                        validProduct = data;
                        break; // Found valid license, no need to check other products
                    }
                } catch (error) {
                    console.log(`License verification failed for product ${productId}:`, error);
                }
            }
            
            if (licenseValid && validProduct) {
                // Check if license is not refunded, disputed, or cancelled
                const purchase = validProduct.purchase;
                if (purchase.refunded || purchase.disputed || purchase.chargebacked) {
                    if (licenseError) {
                        licenseError.textContent = 'This license has been refunded or disputed';
                        licenseError.classList.remove('hidden');
                    }
                    showNotification && showNotification('This license is no longer valid', 'error', { title: 'License' });
                    return;
                }
                
                // Check subscription status if applicable
                if (purchase.subscription_id) {
                    if (purchase.subscription_ended_at || purchase.subscription_cancelled_at || purchase.subscription_failed_at) {
                        if (licenseError) {
                            licenseError.textContent = 'This subscription is no longer active';
                            licenseError.classList.remove('hidden');
                        }
                        showNotification && showNotification('Subscription is not active', 'error', { title: 'License' });
                        return;
                    }
                }
                
                // License is valid, activate premium
                await chrome.storage.local.set({ 
                    premium_active: true, 
                    premium_license_key: key,
                    license_email: purchase.email || '',
                    license_product: purchase.product_name || '',
                    license_verified_at: new Date().toISOString()
                });
                
                premiumActive = true;
                showNotification && showNotification('Premium activated successfully', 'success', { title: 'License' });
                const modalDoc = licenseOverlay && licenseOverlay.querySelector('.license-modal');
                modalDoc && modalDoc.classList.add('success');
                setLicenseModalState(true, key);
                
                // Refresh limit UIs now that premium is active
                try { updateBlockListLimitUI(); updateWhitelistLimitUI(); } catch(_) {}
                setTimeout(() => closeLicenseModal(), 800);
            } else {
                // Invalid license
                if (licenseError) {
                    licenseError.textContent = 'Invalid license key. Please check and try again.';
                    licenseError.classList.remove('hidden');
                }
                showNotification && showNotification('Invalid license key', 'error', { title: 'License' });
            }
        } catch (error) {
            console.error('License activation error:', error);
            if (licenseError) {
                licenseError.textContent = 'Failed to verify license. Please try again.';
                licenseError.classList.remove('hidden');
            }
            showNotification && showNotification('Failed to verify license', 'error', { title: 'License' });
        } finally {
            licenseSubmitBtn && licenseSubmitBtn.classList.remove('loading');
            licenseSubmitBtn && (licenseSubmitBtn.disabled = false);
        }
    }
    if (licenseSubmitBtn) licenseSubmitBtn.addEventListener('click', activateLicense);
    if (licenseInput) licenseInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') activateLicense(); });
    // ESC to close
    document.addEventListener('keydown', (e) => {
        const isOpen = licenseOverlay && !licenseOverlay.classList.contains('hidden');
        if (!isOpen) return;
        if (e.key === 'Escape') closeLicenseModal();
    });

    // Hash-based routes for direct modal open (#license, #premium or #plans, #gift) and tab navigation
    function handleHashRoute() {
        if (__routeUpdating) return;
        const h = getCurrentHashKey();
        if (!h) { return; }
        // Modal routes
        if (h === 'license') return openLicenseModal(true);
        if (h === 'premium' || h === 'plans') return openPremiumModal(true);
        if (h === 'gift') return openGiftLicenseModal(true, true);
        // Tab navigation routes
        if (h === 'blocklist') return showTab('blocklist', false);
        if (h === 'whitelist') return showTab('whitelist', false);
        if (h === 'general') return showTab('general', false);
        if (h === 'security') return showTab('security', false);
        if (h === 'dashboard') return showTab('dashboard', false);
        if (h === 'about') return showTab('about', false);
        if (h === 'keywords') return showTab('keywords', false);
        if (h === 'uninstall-alert') return showTab('uninstall-alert', false);
        // Special route for general-safe-search
        if (h === 'general-safe-search') {
            showTab('general', false);
            // Smooth scroll to Safe Search card after a small delay
            setTimeout(() => {
                try {
                    const card = document.querySelector('.setting-card.safe-search-card');
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        // brief focus highlight (~1.8s)
                        card.classList.add('pulse');
                        setTimeout(() => card.classList.remove('pulse'), 1800);
                    }
                } catch(_) {}
            }, 100);
            return;
        }
    }
    window.addEventListener('hashchange', handleHashRoute);

    // Deactivate flow
    async function deactivateLicense() {
        try {
            await chrome.storage.local.set({ premium_active: false, premium_license_key: '' });
            premiumActive = false;
            setLicenseModalState(false, '');
            showNotification && showNotification('License deactivated', 'info', { title: 'License' });
            // Refresh limit UIs now that premium is inactive
            try { updateBlockListLimitUI(); updateWhitelistLimitUI(); } catch(_) {}
        } catch(_) {}
    }
    if (licenseDeactivateBtn) licenseDeactivateBtn.addEventListener('click', deactivateLicense);
    if (licenseCloseBtn2) licenseCloseBtn2.addEventListener('click', closeLicenseModal);
    
    // Modern toast notifications
    function ensureToastContainer() {
        let c = document.getElementById('toast-container');
        if (!c) {
            c = document.createElement('div');
            c.id = 'toast-container';
            document.body.appendChild(c);
        }
        return c;
    }

    // Make showNotification globally accessible
    window.showNotification = function(message, type = 'success', opts = {}) {
        // type: 'success' | 'error' | 'warning' | 'info'
        // opts: { title?: string, duration?: number, canClose?: boolean }
        const duration = Math.max(1200, Math.min(opts.duration || 3000, 10000));
        const container = ensureToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = document.createElement('div');
        icon.className = 'toast-icon';
        icon.innerHTML = type === 'success'
            ? '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(12 12) scale(0.88) translate(-12 -12)"><path d="M20 6L9 17l-5-5" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></g></svg>'
            : type === 'error'
            ? '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v5m0 4h.01M3.5 20.5l17-17" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>'
            : type === 'warning'
            ? '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 9v4m0 4h.01M10.29 3.86l-8 13.86A2 2 0 004 21h16a2 2 0 001.71-3.28l-8-13.86a2 2 0 00-3.42 0z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20 10 10 0 010-20z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        icon.classList.add('pop');

        const content = document.createElement('div');
        content.className = 'toast-content';
        if (opts.title) {
            const title = document.createElement('div');
            title.className = 'toast-title';
            title.textContent = opts.title;
            content.appendChild(title);
        }
        const msg = document.createElement('div');
        msg.className = 'toast-message';
        msg.textContent = message;
        content.appendChild(msg);

        const close = document.createElement('button');
        close.className = 'toast-close';
        close.setAttribute('aria-label', 'Close');
        close.textContent = '×';
        close.addEventListener('click', () => dismiss(true));

        const progress = document.createElement('div');
        progress.className = 'toast-progress';

        // Assemble
        toast.appendChild(icon);
        toast.appendChild(content);
        toast.appendChild(close);
        toast.appendChild(progress);
        if (type === 'success') {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            for (let i = 0; i < 6; i++) {
                const piece = document.createElement('span');
                // small random vector per piece
                piece.style.setProperty('--dx', (Math.random() * 2 - 1).toFixed(2));
                piece.style.setProperty('--dy', (Math.random() * 2 - 1).toFixed(2));
                confetti.appendChild(piece);
            }
            toast.appendChild(confetti);
        }
        container.appendChild(toast);

        let hideTimer = null;
        function dismiss(immediate) {
            if (!toast.parentNode) return;
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
            if (immediate) {
                toast.parentNode.removeChild(toast);
            } else {
                toast.classList.add('hide');
                setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 220);
            }
        }

        // Auto-dismiss
        hideTimer = setTimeout(() => dismiss(false), duration);

        // Pause on hover
        toast.addEventListener('mouseenter', () => { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } });
        toast.addEventListener('mouseleave', () => { if (!hideTimer) hideTimer = setTimeout(() => dismiss(false), duration / 2); });

        return { dismiss };
    }
    
    // Show tab content
    function showTab(tabName, updateHash = true) {
        console.log("DEBUG: Showing tab:", tabName);
        // Update nav items
        navItems.forEach(item => {
            if (item.dataset.tab === tabName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update content tabs
        contentTabs.forEach(tab => {
            if (tab.id === `${tabName}-tab`) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update URL hash if requested
        if (updateHash) {
            const newHash = '#' + tabName;
            if (window.location.hash !== newHash) {
                history.replaceState(null, '', newHash);
            }
        }
        
        // Save the current tab in storage
        chrome.storage.local.set({ current_tab: tabName });
    }
    
    
    // Change password functionality
    async function changePassword() {
        console.log("DEBUG: Change password process started");
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validate inputs
        const passwordIsSet = await checkIfPasswordIsSet();
        
        if (passwordIsSet) {
            // Verify current password
            const isCurrentPasswordValid = await verifyPassword(currentPassword);
            
            if (!isCurrentPasswordValid) {
                showNotification('Current password is incorrect', 'error', { title: 'Password' });
                return;
            }
        } else {
            // If no password is set, the current password field should be empty
            // But we don't need to validate it
            if (currentPassword) {
                showNotification('No current password is set. Leave current password field empty to set a new password.', 'warning', { title: 'Password' });
                return;
            }
        }
        
        // Check new password
        if (newPassword.length < 4) {
            showNotification('Password must be at least 4 characters long', 'error', { title: 'Password' });
            return;
        }
        
        // Check if passwords match
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error', { title: 'Password' });
            return;
        }
        
        // Save new password
        chrome.storage.local.set({ ninja_password: newPassword }, function() {
            showNotification('Password has been updated successfully', 'success', { title: 'Password' });
            // Clear form
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
            // Update UI to show current password field is now needed
            updatePasswordUI();
            // If this was the first-time password set, refresh the page to fully apply gating and UI states
            try {
                if (!passwordIsSet) {
                    setTimeout(() => { location.reload(); }, 300);
                }
            } catch(_){}
        });
    }
    
    // Update password UI based on whether a password is set
    async function updatePasswordUI() {
        const passwordIsSet = await checkIfPasswordIsSet();
        const currentPasswordLabel = document.querySelector('label[for="current-password"]');
        const currentPasswordGroup = currentPasswordInput && currentPasswordInput.closest('.input-group');
        try {
            if (currentPasswordGroup) {
                // Hide the whole "Current Password" field if no password is set yet
                currentPasswordGroup.style.display = passwordIsSet ? '' : 'none';
                if (!passwordIsSet) {
                    currentPasswordInput.value = '';
                }
            }
            if (currentPasswordLabel) {
                currentPasswordLabel.textContent = passwordIsSet ? 'Current Password' : 'Current Password';
            }
        } catch(_){}
    }
    
    // Event Listeners
    
    // Add toggle handler for the enable/disable blocker switch
    ninjaEnableToggle.addEventListener('change', function() {
        console.log("DEBUG: Ninja enable toggle changed to:", ninjaEnableToggle.checked);
        updateStatusBar();
        if (ninjaEnableDash) ninjaEnableDash.checked = ninjaEnableToggle.checked;
    if (ninjaEnableSidebar) ninjaEnableSidebar.checked = ninjaEnableToggle.checked;
        if (sidebarControl) sidebarControl.classList.toggle('active', !!ninjaEnableToggle.checked);
        
        // Get the current ninja_config
        chrome.storage.local.get(['ninja_config'], function(result) {
            let ninjaConfig = result.ninja_config || { version: "2.5" };
            // Update the is_enable property directly with the checked state
            ninjaConfig.is_enable = ninjaEnableToggle.checked;
            
            console.log("DEBUG: Updating ninja_config with new state:", ninjaConfig);
            
            // Update the ninja_config in storage
            chrome.storage.local.set({ "ninja_config": ninjaConfig }, function() {
                console.log("DEBUG: Ninja config updated in storage");
                
                // Send message to update state
                sendMessageWithDebug({ command: 'update_ninja_state', is_enable: ninjaEnableToggle.checked }, function(response) {
                    console.log("DEBUG: Ninja state update complete, response:", response);
                    // Show notification to user
                    showNotification(`Blocker ${ninjaEnableToggle.checked ? 'enabled' : 'disabled'} successfully`, 'success');
                });
            });
        });
    });
    
    // Dashboard protection toggle removed from UI

    // Password submission
    submitPasswordBtn.addEventListener('click', async function() {
        console.log("DEBUG: Submit password button clicked");
        const enteredPassword = enterPasswordInput.value;
        const isValid = await verifyPassword(enteredPassword);
        
        if (isValid) {
            passwordProtection.classList.add('hidden');
            mainSettings.classList.remove('hidden');
            passwordError.classList.add('hidden');
            enterPasswordInput.value = '';
            // After successful login, apply current hash route (if any)
            try { handleHashRoute && handleHashRoute(); } catch(_) {}
        } else {
            passwordError.classList.remove('hidden');
        }
    });
    
    // Enter key in password field
    enterPasswordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            console.log("DEBUG: Enter key pressed in password field");
            submitPasswordBtn.click();
        }
    });
    
    // Tab navigation
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log("DEBUG: Tab navigation clicked:", this.dataset.tab);
            // Update URL hash instead of calling showTab directly
            window.location.hash = this.dataset.tab;
        });
    });
    
    // Listen for hash changes
    window.addEventListener('hashchange', function() {
        handleHashRoute();
    });

    // Dashboard helper link: go to General > Safe Search
    const dashOpenSafeSearch = document.getElementById('dash-open-safe-search');
    if (dashOpenSafeSearch) {
        dashOpenSafeSearch.addEventListener('click', function(e){
            e.preventDefault();
            // Use hash routing
            window.location.hash = 'general-safe-search';
        });
    }

    // Dashboard: App Icon link to App Icon section
    const dashOpenIcon = document.getElementById('dash-open-icon');
    const dashStealthBtn = document.getElementById('dash-stealth-btn');
    if (dashOpenIcon) {
        dashOpenIcon.addEventListener('click', function(){
            // Navigate to general tab and scroll to icon section
            showTab('general', true);
            setTimeout(() => {
                const card = document.getElementById('icon-card');
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    card.classList.add('pulse');
                    setTimeout(() => card.classList.remove('pulse'), 1800);
                }
            }, 100);
        });
    }
    if (dashStealthBtn) {
        dashStealthBtn.addEventListener('click', function(){
            // Jump to icon section and highlight
            if (dashOpenIcon) dashOpenIcon.click();
            try {
                chrome.storage.local.get(['premium_active'], function(s){
                    const premium = s.premium_active === true;
                    if (premium) {
                        // Apply hidden immediately
                        applyIconTheme('hidden');
                        // Reflect radio selection if present
                        const r = document.getElementById('icon-hidden');
                        if (r) r.checked = true;
                    } else {
                        // If trial dialog exists, show it with hidden pre-selected
                        const r = document.getElementById('icon-hidden');
                        if (r) r.checked = true;
                        if (iconTrialDialog) {
                            iconTrialDialog.classList.remove('hidden');
                        } else if (typeof openPremiumModal === 'function') {
                            openPremiumModal();
                        }
                    }
                });
            } catch(_) {}
        });
    }
    // Make thumbnail also open the icon section
    if (dashIconThumb) {
        dashIconThumb.style.cursor = 'pointer';
        dashIconThumb.addEventListener('click', function(){
            if (dashOpenIcon) dashOpenIcon.click();
        });
    }
    
    // Save settings button
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', function() {
        console.log("DEBUG: Save settings button clicked");
    setSaving(true);
    manualSavePending = true;
        // Watchdog: ensure spinner doesn't hang if background events are missed
        if (manualSaveTimer) { clearTimeout(manualSaveTimer); }
    manualSaveTimer = setTimeout(() => {
            if (manualSavePending) {
                manualSavePending = false;
                setSaving(false, { message: 'Settings applied', force: true });
            }
    }, 10000);
        try {
            saveSettings();
            console.log("DEBUG: Save settings function called successfully");
        } catch(error) {
            console.error("DEBUG ERROR: Error in saveSettings function:", error);
            setSaving(false);
        }
    });

    // Sidebar protection toggle mirrors and drives main/dashboard toggles
    if (ninjaEnableSidebar) {
        ninjaEnableSidebar.addEventListener('change', function(){
            ninjaEnableToggle.checked = ninjaEnableSidebar.checked;
            if (ninjaEnableDash) ninjaEnableDash.checked = ninjaEnableSidebar.checked;
            ninjaEnableToggle.dispatchEvent(new Event('change'));
        });
    }
    
    // Add site to whitelist
    addWhitelistSiteBtn.addEventListener('click', function() {
        console.log("DEBUG: Add whitelist site button clicked with value:", newWhitelistSiteInput.value);
        addWhitelistedSite(newWhitelistSiteInput.value);
    });
    
    // Enter key for adding whitelist site
    newWhitelistSiteInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            console.log("DEBUG: Enter key pressed in whitelist site input");
            addWhitelistSiteBtn.click();
        }
    });
    
    // Keywords event listeners
    if (addKeywordBtn) {
        addKeywordBtn.addEventListener('click', function() {
            console.log("DEBUG: Add keyword button clicked");
            addKeyword();
        });
    }
    
    if (newKeywordInput) {
        newKeywordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log("DEBUG: Enter key pressed in keyword input");
                addKeyword();
            }
        });
    }
    
    
    // Change password button
    changePasswordBtn.addEventListener('click', function() {
        console.log("DEBUG: Change password button clicked");
        changePassword();
    });
    
    // Initialize Block Action visual tiles and sync with select
    const blockActionGrid = document.getElementById('block-action-grid');
    function setActiveActionTile(value) {
        const grid = document.getElementById('block-action-grid');
        if (!grid) return;
        [...grid.querySelectorAll('.action-btn')].forEach(btn => {
            btn.classList.toggle('active', btn.dataset.action === value);
        });
    }
    let prevBlockActionValue = null;
    if (blockActionGrid) {
        blockActionGrid.addEventListener('click', function(e) {
            // If user clicks on the redirect preview area, open modal directly
            const preview = e.target.closest('.action-preview.redirect');
            if (preview) {
                e.preventDefault(); e.stopPropagation();
                openRedirectModalIfRedirect();
                return;
            }
            const btn = e.target.closest('.action-btn');
            if (!btn) return;
            const val = btn.dataset.action;
            if (!val) return;
            // Prevent locked premium tiles
            const isPremiumTile = btn.classList.contains('premium');
            if (isPremiumTile && !premiumActive) {
                e.preventDefault(); e.stopPropagation();
                try { openPremiumModal && openPremiumModal('These actions require Premium'); } catch(_) {}
                return;
            }
            if (blockActionSelect.value === val) return; // no-op if same
            blockActionSelect.value = val;
            setActiveActionTile(val);
            // Trigger existing change handler to persist and message background
            const evt = new Event('change', { bubbles: true });
            blockActionSelect.dispatchEvent(evt);
        });
    }

    // Show/hide custom redirect URL field based on block action selection + autosave
    blockActionSelect.addEventListener('change', function() {
        console.log("DEBUG: Block action changed to:", this.value);
        // Guard premium-only options
        const premiumOnly = new Set(['stealth-timeout','stealth-refused']);
        if (premiumOnly.has(this.value) && !premiumActive) {
            // revert
            if (prevBlockActionValue) {
                this.value = prevBlockActionValue;
                setActiveActionTile(prevBlockActionValue);
            }
            try { openPremiumModal && openPremiumModal('These actions require Premium'); } catch(_) {}
            return;
        }
        prevBlockActionValue = this.value;
        if (this.value === 'redirect') {
            // Open modal instead of inline input
            try {
                if (redirectModal) {
                    redirectUrlInput.value = (customRedirectUrlInput.value || '');
                    redirectModal.classList.remove('hidden');
                }
            } catch(_) {}
        } else {
            customRedirectUrlContainer.style.display = 'none';
        }
    // Open modal on pill click (for editing)
    function openRedirectModalIfRedirect(){
        if (redirectModal) {
            redirectUrlInput.value = (customRedirectUrlInput.value || '');
            redirectModal.classList.remove('hidden');
        }
    }
    if (redirectUrlPill) {
        redirectUrlPill.addEventListener('click', function(e){
            e.preventDefault(); e.stopPropagation();
            openRedirectModalIfRedirect();
        });
    }
    if (redirectPreview) {
        redirectPreview.addEventListener('click', function(e){
            e.preventDefault(); e.stopPropagation();
            openRedirectModalIfRedirect();
        });
    }

    function closeRedirectModal(){
        try { redirectModal.classList.add('hidden'); } catch(_) {}
    }
    function isValidUrl(u){
        try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:'; } catch(_) { return false; }
    }
    function formatRedirect(u){
        if (!u) return '';
        let v = u.trim();
        if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
        return v;
    }
    if (redirectCancelBtn) redirectCancelBtn.addEventListener('click', closeRedirectModal);
    if (redirectCloseBtn) redirectCloseBtn.addEventListener('click', closeRedirectModal);
    if (redirectSaveBtn) redirectSaveBtn.addEventListener('click', function(){
        let val = formatRedirect(redirectUrlInput.value || '');
        if (!isValidUrl(val)) {
            const err = document.getElementById('redirect-error');
            if (err) err.classList.remove('hidden');
            return;
        }
        const formatted = val;
        customRedirectUrlInput.value = formatted;
        if (redirectUrlPill) redirectUrlPill.textContent = formatted;
        setSaving(true);
        chrome.storage.local.set({ custom_redirect_url: formatted, block_action: 'redirect' }, function(){
            sendMessageWithDebug({ command: 'update_block_action', blockAction: 'redirect', customRedirectUrl: formatted });
            closeRedirectModal();
        });
    });

    // On load, lock premium tiles if needed
    (function lockPremiumTiles(){
        try {
            if (!blockActionGrid) return;
            const premiumTiles = blockActionGrid.querySelectorAll('.action-btn.premium');
            premiumTiles.forEach(tile => {
                if (!premiumActive) tile.classList.add('locked'); else tile.classList.remove('locked');
            });
        } catch(_) {}
    })();
        setActiveActionTile(this.value);
        // Persist immediately
        const formattedRedirectUrl = formatRedirectUrl(customRedirectUrlInput.value || '');
        setSaving(true);
        chrome.storage.local.set({ block_action: this.value, custom_redirect_url: formattedRedirectUrl }, function(){
            // Inform background to apply action (rebuild rules)
            sendMessageWithDebug({ 
                command: 'update_block_action', 
                blockAction: blockActionSelect.value, 
                customRedirectUrl: formattedRedirectUrl 
            });
        });
    });
    
    // Format the URL when the input field loses focus
    customRedirectUrlInput.addEventListener('blur', function() {
        console.log("DEBUG: Custom redirect URL input blur");
        if (this.value) {
            this.value = formatRedirectUrl(this.value);
            // Persist immediately and refresh rules if redirect mode is active
            const formatted = this.value;
            setSaving(true);
            chrome.storage.local.set({ custom_redirect_url: formatted }, function(){
                if (blockActionSelect.value === 'redirect') {
                    sendMessageWithDebug({ command: 'update_block_action', blockAction: 'redirect', customRedirectUrl: formatted });
                }
            });
        }
    });
    
    // Format the URL when the user presses Enter
    customRedirectUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            console.log("DEBUG: Enter key pressed in custom redirect URL input");
            this.value = formatRedirectUrl(this.value);
            const formatted = this.value;
            setSaving(true);
            chrome.storage.local.set({ custom_redirect_url: formatted }, function(){
                if (blockActionSelect.value === 'redirect') {
                    sendMessageWithDebug({ command: 'update_block_action', blockAction: 'redirect', customRedirectUrl: formatted });
                }
            });
        }
    });
    
    // Toggle safe search options visibility
    enableSafeSearchToggle.addEventListener('change', function() {
        console.log("DEBUG: Safe search toggle changed to:", this.checked);
        safeSearchOptionsContainer.style.display = this.checked ? 'block' : 'none';
        // If turning ON, ensure at least Google is enabled
        if (this.checked && safeSearchGoogleToggle && !safeSearchGoogleToggle.checked) {
            safeSearchGoogleToggle.checked = true;
        }
        updateStatusBar();
        if (safeSearchDash) safeSearchDash.checked = this.checked;
        // Persist immediately with current provider options
    const safeSearchOptions = {
            google: safeSearchGoogleToggle.checked,
            bing: safeSearchBingToggle.checked,
            yahoo: safeSearchYahooToggle.checked,
            duckduckgo: safeSearchDuckDuckGoToggle.checked,
            youtube: safeSearchYouTubeToggle.checked,
            facebook: safeSearchFacebookToggle.checked
        };
    try { renderDashSafeProviders(this.checked, safeSearchOptions); } catch(_) {}
        setSaving(true, { light: true });
        chrome.storage.local.set({ safe_search_enabled: this.checked, safe_search_options: safeSearchOptions }, function(){
            sendMessageWithDebug({ command: 'update_safe_search', enabled: enableSafeSearchToggle.checked, options: safeSearchOptions });
            // Explicitly finish light save
            setSaving(false, { force: true, clearGlobal: true, message: 'Settings applied' });
        });
    });

    // Safe Search provider toggles autosave (premium-gated for non-Google providers)
    [
        { el: safeSearchGoogleToggle, key: 'google', premium: false },
        { el: safeSearchBingToggle, key: 'bing', premium: false },
        { el: safeSearchYahooToggle, key: 'yahoo', premium: true },
        { el: safeSearchDuckDuckGoToggle, key: 'duckduckgo', premium: true },
        { el: safeSearchYouTubeToggle, key: 'youtube', premium: true },
        { el: safeSearchFacebookToggle, key: 'facebook', premium: true }
    ].forEach(({ el, premium }) => {
        if (!el) return;
        el.addEventListener('change', function(){
            if (premium && !premiumActive) {
                // revert toggle state and upsell
                this.checked = !this.checked;
                showNotification('Premium required for this provider', 'warning', { title: 'Premium feature' });
                if (typeof openPremiumModal === 'function') openPremiumModal();
                return;
            }
            const opts = {
                google: safeSearchGoogleToggle.checked,
                bing: safeSearchBingToggle.checked,
                yahoo: safeSearchYahooToggle.checked,
                duckduckgo: safeSearchDuckDuckGoToggle.checked,
                youtube: safeSearchYouTubeToggle.checked,
                facebook: safeSearchFacebookToggle.checked
            };
            // Auto-sync master switch: any provider ON => master ON; all OFF => master OFF
            const anyOn = !!(opts.google || opts.bing || opts.yahoo || opts.duckduckgo || opts.youtube || opts.facebook);
            enableSafeSearchToggle.checked = anyOn;
            if (safeSearchDash) safeSearchDash.checked = anyOn;
            if (safeSearchOptionsContainer) safeSearchOptionsContainer.style.display = anyOn ? 'block' : 'none';
            updateStatusBar();
            try { renderDashSafeProviders(anyOn, opts); } catch(_) {}
            setSaving(true, { light: true });
            chrome.storage.local.set({ safe_search_options: opts, safe_search_enabled: anyOn }, function(){
                sendMessageWithDebug({ command: 'update_safe_search', enabled: anyOn, options: opts });
                setSaving(false, { force: true, clearGlobal: true, message: 'Settings applied' });
            });
        });
    });

    // Dashboard: block level quick buttons
    if (blockBtns) {
        blockBtns.addEventListener('click', function(e) {
            const btn = e.target.closest('.btn');
            if (!btn) return;
            const level = btn.dataset.level;
            const requiresPremium = (level === 'very-strict');
            if (requiresPremium && !premiumActive) {
                showNotification('Premium required for this level', 'warning', { title: 'Premium feature' });
                if (typeof openPremiumModal === 'function') openPremiumModal();
                return; // do not change level
            }
            blockLevelSelect.value = level;
            [...blockBtns.querySelectorAll('.btn')].forEach(b => b.classList.toggle('active', b === btn));
            prevBlockLevel = level;
            updateStatusBar();
            // Persist immediately and refresh rules
            setMetricsLoading(true);
            setSaving(true);
            chrome.storage.local.set({ block_level: level }, function(){
                sendMessageWithDebug({ command: 'refresh_rules' });
            });
        });
    }

    // General block level select autosave
    blockLevelSelect.addEventListener('change', function(){
        const level = blockLevelSelect.value;
        console.log('DEBUG: Block level select changed to:', level);
        const requiresPremium = (level === 'very-strict');
        if (requiresPremium && !premiumActive) {
            showNotification('Premium required for this level', 'warning', { title: 'Premium feature' });
            blockLevelSelect.value = prevBlockLevel; // revert
            if (blockBtns) {
                [...blockBtns.querySelectorAll('.btn')].forEach(b => b.classList.toggle('active', b.dataset.level === prevBlockLevel));
            }
            if (typeof openPremiumModal === 'function') openPremiumModal();
            return;
        }
        if (blockBtns) {
            [...blockBtns.querySelectorAll('.btn')].forEach(b => b.classList.toggle('active', b.dataset.level === level));
        }
    prevBlockLevel = level;
    updateStatusBar();
        setMetricsLoading(true);
        setSaving(true);
        chrome.storage.local.set({ block_level: level }, function(){
            sendMessageWithDebug({ command: 'refresh_rules' });
        });
    });

    // Dashboard: safe search mirror
    if (safeSearchDash) {
        safeSearchDash.addEventListener('change', function() {
            enableSafeSearchToggle.checked = safeSearchDash.checked;
            enableSafeSearchToggle.dispatchEvent(new Event('change'));
        });
    }

    // Show notifications autosave
    if (showNotificationsToggle) {
        showNotificationsToggle.addEventListener('change', function(){
            chrome.storage.local.set({ show_notifications: showNotificationsToggle.checked });
        });
    }

    // Require password autosave with guard: must have a password set first
    requirePasswordToggle.addEventListener('change', function(){
        const desired = !!requirePasswordToggle.checked;
        chrome.storage.local.get(['ninja_password'], function(res){
            const hasPwd = !!res.ninja_password;
            if (desired && !hasPwd) {
                // Revert toggle and guide user
                requirePasswordToggle.checked = false;
                showTab('security');
                passwordMessage.textContent = 'Set a password first, then enable "Require Password"';
                passwordMessage.className = 'message error';
                passwordMessage.classList.remove('hidden');
                showNotification('Please set a password first', 'warning', { title: 'Require Password' });
                return;
            }
            chrome.storage.local.set({ require_password: desired }, function(){
                showNotification(desired ? 'Password required for settings' : 'Password requirement disabled', 'info');
            });
        });
    });

    // Onboarding minimal stepper wiring
    const onbOverlay = document.getElementById('onboarding-overlay');
    const onbNext = document.getElementById('onb-next');
    const onbSkip = document.getElementById('onb-skip');
    let onbStep = 1;
    function setOnbStep(step) {
        onbStep = step;
        document.querySelectorAll('.onboard-step').forEach(s => s.classList.toggle('active', Number(s.dataset.step) === step));
        const prog = document.getElementById('onb-progress');
        if (prog) prog.textContent = `Step ${step} of 3`;
        if (onbNext) onbNext.textContent = step === 3 ? 'Get Started! 🚀' : 'Next';
    }
    function closeOnboarding() { 
        if (onbOverlay) onbOverlay.classList.add('hidden'); 
        // Auto-enable protection after onboarding
        chrome.storage.local.set({ 
            ninja_config: { is_enable: true, version: "2.8" },
            show_onboarding: false  // Mark onboarding as completed
        });
    }
    if (onbNext) onbNext.addEventListener('click', function() { if (onbStep < 3) setOnbStep(onbStep + 1); else closeOnboarding(); });
    if (onbSkip) onbSkip.addEventListener('click', closeOnboarding);
    
    // Check if onboarding should be shown (first install)
    chrome.storage.local.get(['show_onboarding'], function(result) {
        if (result.show_onboarding === true) {
            console.log('DEBUG: Showing onboarding for first time');
            if (onbOverlay) {
                onbOverlay.classList.remove('hidden');
                onbOverlay.setAttribute('aria-hidden', 'false');
                setOnbStep(1);
            }
        }
    });
    
    // Manual onboarding trigger button - opens new onboarding page
    const showOnboardingBtn = document.getElementById('show-onboarding-btn');
    if (showOnboardingBtn) {
        showOnboardingBtn.addEventListener('click', function() {
            console.log('DEBUG: Opening onboarding page');
            chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
        });
    }

    // Feedback Modal Handler
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackBtn = document.getElementById('feedback-btn');
    const feedbackCloseBtn = document.getElementById('feedback-close-btn');
    const feedbackCancelBtn = document.getElementById('feedback-cancel-btn');
    const feedbackSubmitBtn = document.getElementById('feedback-submit-btn');
    const feedbackRating = document.getElementById('feedback-rating');
    const feedbackMessage = document.getElementById('feedback-message');
    const feedbackEmail = document.getElementById('feedback-email');
    
    let selectedRating = 0;
    
    // Star rating interaction
    document.querySelectorAll('.rating-star').forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            feedbackRating.value = selectedRating;
            // Visual feedback
            document.querySelectorAll('.rating-star').forEach((s, idx) => {
                if (idx < selectedRating) {
                    s.style.transform = 'scale(1.2)';
                    s.style.filter = 'grayscale(0%)';
                } else {
                    s.style.transform = 'scale(1)';
                    s.style.filter = 'grayscale(100%)';
                }
            });
        });
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            document.querySelectorAll('.rating-star').forEach((s, idx) => {
                s.style.filter = idx < rating ? 'grayscale(0%)' : 'grayscale(100%)';
            });
        });
    });
    
    // Reset stars on mouse leave
    if (feedbackModal) {
        feedbackModal.addEventListener('mouseleave', function() {
            document.querySelectorAll('.rating-star').forEach((s, idx) => {
                if (idx < selectedRating) {
                    s.style.filter = 'grayscale(0%)';
                } else {
                    s.style.filter = 'grayscale(100%)';
                }
            });
        });
    }
    
    // Open feedback modal
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', function() {
            feedbackModal.classList.remove('hidden');
            feedbackModal.setAttribute('aria-hidden', 'false');
            // Reset form
            selectedRating = 0;
            feedbackRating.value = '0';
            feedbackMessage.value = '';
            feedbackEmail.value = '';
            document.querySelectorAll('.rating-star').forEach(s => {
                s.style.transform = 'scale(1)';
                s.style.filter = 'grayscale(100%)';
            });
        });
    }
    
    // Close feedback modal
    function closeFeedbackModal() {
        if (feedbackModal) {
            feedbackModal.classList.add('hidden');
            feedbackModal.setAttribute('aria-hidden', 'true');
        }
    }
    
    if (feedbackCloseBtn) feedbackCloseBtn.addEventListener('click', closeFeedbackModal);
    if (feedbackCancelBtn) feedbackCancelBtn.addEventListener('click', closeFeedbackModal);
    
    // Submit feedback
    if (feedbackSubmitBtn) {
        feedbackSubmitBtn.addEventListener('click', function() {
            const rating = feedbackRating.value;
            const message = feedbackMessage.value.trim();
            const email = feedbackEmail.value.trim();
            
            if (!message) {
                showNotification('Please share your feedback!', 'warning');
                return;
            }
            
            // Send feedback via email
            const subject = encodeURIComponent(`Ninja Blocker Feedback - ${rating} Stars`);
            const body = encodeURIComponent(`Rating: ${rating}/5 stars\n\nFeedback:\n${message}\n\n${email ? 'Email: ' + email : 'No email provided'}\n\n---\nVersion: 2.8`);
            
            window.open(`mailto:ixstudio.net@gmail.com?subject=${subject}&body=${body}`, '_blank');
            
            showNotification('Thank you for your feedback! 💚', 'success');
            closeFeedbackModal();
        });
    }

    // Initialize page
    initSettings();
    // After basic init, apply any direct route
    setTimeout(() => { try { handleHashRoute(); } catch(_){} }, 0);
    
    // Initialize countdown timers after page load
    setTimeout(() => {
        try {
            if (typeof initDiscountCountdown === 'function') initDiscountCountdown();
            if (typeof initSidebarCountdown === 'function') initSidebarCountdown();
        } catch(e) {
            console.error('Countdown init error:', e);
        }
    }, 100);
    
    // Live updates: reflect storage changes in UI immediately (no refresh needed)
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        let needsStatusUpdate = false;
        // Premium flag updates
        if (typeof changes.premium_active !== 'undefined') {
            premiumActive = changes.premium_active.newValue === true;
            // Re-evaluate input limits and hints
            try { updateBlockListLimitUI(); updateWhitelistLimitUI(); } catch(_) {}
            // Update premium lock state on provider toggles
            const premiumLocked = !premiumActive;
            [{ el: safeSearchBingToggle }, { el: safeSearchYahooToggle }, { el: safeSearchDuckDuckGoToggle }, { el: safeSearchYouTubeToggle }, { el: safeSearchFacebookToggle }]
                .forEach(({ el }) => {
                    if (!el) return;
                    el.disabled = premiumLocked;
                    if (premiumLocked) el.checked = false; // keep off while locked
                    el.title = premiumLocked ? 'Premium required' : '';
                    const row = el.closest('.setting-item.provider');
                    if (row) {
                        row.classList.toggle('premium-locked', premiumLocked);
                        // cleanup any old title badge
                        const oldTitleBadge = row.querySelector('.setting-info h3 .level-prem');
                        if (!premiumLocked && oldTitleBadge) oldTitleBadge.remove();
                        const control = row.querySelector('.setting-control');
                        if (!control) return;
                        let badge = control.querySelector('.level-prem');
                        if (premiumLocked) {
                            if (!badge) {
                                badge = document.createElement('span');
                                badge.className = 'level-prem';
                                badge.textContent = 'Premium';
                                const toggleLabel = control.querySelector('label.toggle-switch');
                                if (toggleLabel && toggleLabel.parentNode === control) {
                                    control.insertBefore(badge, toggleLabel);
                                } else {
                                    control.prepend(badge);
                                }
                            }
                            if (!control.dataset.premiumGate) {
                                control.dataset.premiumGate = '1';
                                control._premiumGateHandler = function(e){
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (typeof openPremiumModal === 'function') openPremiumModal();
                                };
                                control.addEventListener('click', control._premiumGateHandler);
                            }
                        } else {
                            if (badge) badge.remove();
                            if (control.dataset.premiumGate) {
                                delete control.dataset.premiumGate;
                                if (control._premiumGateHandler) control.removeEventListener('click', control._premiumGateHandler);
                                delete control._premiumGateHandler;
                            }
                        }
                    }
                });
            
            // Update Uninstall Alert inputs when premium status changes
            try {
                const emailInput = document.getElementById('uninstall-alert-email');
                const enabledToggle = document.getElementById('uninstall-alert-enabled');
                const saveBtn = document.getElementById('uninstall-alert-save');
                const dashToggle = document.getElementById('dash-uninstall-alert-toggle');
                
                if (premiumLocked) {
                    if (emailInput) {
                        emailInput.disabled = true;
                        emailInput.placeholder = 'Premium feature - Upgrade to unlock';
                    }
                    if (enabledToggle) {
                        enabledToggle.disabled = true;
                        enabledToggle.checked = false;
                    }
                    if (saveBtn) {
                        saveBtn.disabled = true;
                        saveBtn.style.opacity = '0.5';
                        saveBtn.style.cursor = 'not-allowed';
                    }
                    // Don't disable dashToggle - keep it clickable so change event fires and navigates to settings
                    if (dashToggle) {
                        dashToggle.checked = false;
                    }
                } else {
                    if (emailInput) {
                        emailInput.disabled = false;
                        emailInput.placeholder = 'your@email.com';
                    }
                    if (enabledToggle) {
                        enabledToggle.disabled = false;
                    }
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.style.opacity = '1';
                        saveBtn.style.cursor = 'pointer';
                    }
                    if (dashToggle) {
                        dashToggle.disabled = false;
                    }
                }
            } catch(_) {}
        }

        // Blocked sites list/count
        if (changes.blocked_sites) {
            blockedSites = Array.isArray(changes.blocked_sites.newValue) ? changes.blocked_sites.newValue : [];
            if (statCustom) animateCount(statCustom, blockedSites.length);
            // Re-render only if the Blocklist tab is visible
            const activeTab = document.querySelector('.content-tab.active');
            if (activeTab && activeTab.id === 'blocklist-tab') {
                renderBlockList();
            }
        }

        // Whitelist list/count
        if (changes.whitelisted_sites) {
            whitelistedSites = Array.isArray(changes.whitelisted_sites.newValue) ? changes.whitelisted_sites.newValue : [];
            if (statWhitelist) animateCount(statWhitelist, whitelistedSites.length);
            // Re-render only if the Whitelist tab is visible
            const activeTab = document.querySelector('.content-tab.active');
            if (activeTab && activeTab.id === 'whitelist-tab') {
                renderWhitelist();
            }
        }

    // Total rules in effect
    if (changes.RULE_INDEX) {
            const ri = changes.RULE_INDEX.newValue;
            const count = ri ? (Array.isArray(ri) ? ri.length : Object.keys(ri).length) : 0;
            latestRulesCount = count;
            // Debug-style logs in settings console for visibility
            const ts = new Date().toISOString();
            console.log(`DEBUG [${ts}]: RULE_INDEX saved with keys: ${count}`);
            const hasGet = !!(chrome.declarativeNetRequest && typeof chrome.declarativeNetRequest.getDynamicRules === 'function');
            if (hasGet) {
                try {
                    chrome.declarativeNetRequest.getDynamicRules(function(rules){
                        const ts2 = new Date().toISOString();
                        const installed = (rules && rules.length) || 0;
                        console.log(`DEBUG [${ts2}]: Dynamic rules installed: ${installed}`);
                        // Clear watchdog if any
                        if (manualSaveTimer) { clearTimeout(manualSaveTimer); manualSaveTimer = null; }
                        // Finish only if background says build is not active anymore
                        chrome.storage.local.get(['RULES_BUILD_ACTIVE'], function(s){
                            const active = !!s.RULES_BUILD_ACTIVE;
                            if (!active) {
                                if (manualSaveTimer) { clearTimeout(manualSaveTimer); manualSaveTimer = null; }
                                if (manualSavePending) {
                                    manualSavePending = false;
                                    setSaving(false, { message: `Settings applied • Rules installed: ${installed}`, force: true });
                                } else {
                                    setSaving(false);
                                }
                            }
                        });
                    });
                } catch(_) {
                    if (manualSaveTimer) { clearTimeout(manualSaveTimer); manualSaveTimer = null; }
                    if (manualSavePending) {
                        manualSavePending = false;
                        setSaving(false, { message: `Settings applied • Rules installed: ${count}`, force: true });
                    } else {
                        setSaving(false);
                    }
                }
            } else {
                // No getDynamicRules support; use RULE_INDEX count
                if (manualSaveTimer) { clearTimeout(manualSaveTimer); manualSaveTimer = null; }
                if (manualSavePending) {
                    manualSavePending = false;
                    setSaving(false, { message: `Settings applied • Rules installed: ${count}`, force: true });
                } else {
                    setSaving(false);
                }
            }
        }

        // Ninja protection toggle
    if (changes.ninja_config && changes.ninja_config.newValue) {
            const nc = changes.ninja_config.newValue;
            if (typeof nc.is_enable !== 'undefined') {
                ninjaEnableToggle.checked = !!nc.is_enable;
                // dashboard protection toggle removed
                if (ninjaEnableSidebar) ninjaEnableSidebar.checked = !!nc.is_enable;
                if (sidebarControl) sidebarControl.classList.toggle('active', !!nc.is_enable);
                needsStatusUpdate = true;
            }
        }

        // Block level updates (sync select + quick buttons)
        if (changes.block_level) {
            const level = changes.block_level.newValue || 'normal';
            blockLevelSelect.value = level;
            if (blockBtns) {
                [...blockBtns.querySelectorAll('.btn')].forEach(b => b.classList.toggle('active', b.dataset.level === level));
            }
            needsStatusUpdate = true;
            // Active rules value will update after build completes (see RULES_BUILD_ACTIVE handler)
        }

        // Safe Search main toggle
        if (changes.safe_search_enabled) {
            const enabled = changes.safe_search_enabled.newValue !== false; // default true
            enableSafeSearchToggle.checked = enabled;
            if (safeSearchDash) safeSearchDash.checked = enabled;
            // Show/hide options container inline
            if (safeSearchOptionsContainer) safeSearchOptionsContainer.style.display = enabled ? 'block' : 'none';
            needsStatusUpdate = true;
            try { renderDashSafeProviders(enabled, {
                google: safeSearchGoogleToggle && safeSearchGoogleToggle.checked,
                bing: safeSearchBingToggle && safeSearchBingToggle.checked,
                yahoo: safeSearchYahooToggle && safeSearchYahooToggle.checked,
                duckduckgo: safeSearchDuckDuckGoToggle && safeSearchDuckDuckGoToggle.checked,
                youtube: safeSearchYouTubeToggle && safeSearchYouTubeToggle.checked,
                facebook: safeSearchFacebookToggle && safeSearchFacebookToggle.checked,
            }); } catch(_) {}
            if (!manualSavePending) setSaving(false, { clearGlobal: true, silent: true });
        }

        // Safe Search per-provider options (keep checkboxes in sync if present)
        if (changes.safe_search_options && changes.safe_search_options.newValue) {
            const opts = changes.safe_search_options.newValue;
            if (safeSearchGoogleToggle) safeSearchGoogleToggle.checked = opts.google !== false;
            if (safeSearchBingToggle) safeSearchBingToggle.checked = opts.bing !== false;
            if (safeSearchYahooToggle) safeSearchYahooToggle.checked = opts.yahoo !== false;
            if (safeSearchDuckDuckGoToggle) safeSearchDuckDuckGoToggle.checked = opts.duckduckgo !== false;
            if (safeSearchYouTubeToggle) safeSearchYouTubeToggle.checked = opts.youtube !== false;
            if (safeSearchFacebookToggle) safeSearchFacebookToggle.checked = opts.facebook !== false;
            try { renderDashSafeProviders(enableSafeSearchToggle && enableSafeSearchToggle.checked, opts); } catch(_) {}
            if (!manualSavePending) setSaving(false, { clearGlobal: true, silent: true });
        }

        // Icon theme updates
        if (typeof changes.icon_theme !== 'undefined') {
            const theme = changes.icon_theme.newValue || 'classic';
            const meta = getIconThemeMeta(theme);
            if (dashIconLabel) dashIconLabel.textContent = meta.label;
            if (dashIconThumb) dashIconThumb.src = meta.src;
        }

    // Background build activity flag
    if (typeof changes.RULES_BUILD_ACTIVE !== 'undefined') {
            const active = !!changes.RULES_BUILD_ACTIVE.newValue;
            setGlobalLoading(active);
            if (!active) {
                // Build finished; clear spinner if it was a manual save
                if (manualSaveTimer) { clearTimeout(manualSaveTimer); manualSaveTimer = null; }
        // Now that save/build is fully complete, update Active rules metric
        try { updateActiveRulesMetric(blockLevelSelect.value); } catch(_) {}
                // stop tiny loaders on metrics now that values are applied
                setMetricsLoading(false);
                if (manualSavePending) {
                    manualSavePending = false;
                    // Prefer latestRulesCount for message if getDynamicRules hasn't run yet
                    setSaving(false, { message: `Settings applied • Rules installed: ${latestRulesCount || ''}`.trim(), force: true });
                } else {
                    setSaving(false);
                }
            }
        }

        if (needsStatusUpdate) {
            updateStatusBar();
        }
    });
    
    // Add some CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: rgba(76, 175, 80, 0.9);
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            transition: all 0.3s ease;
            animation: slideIn 0.3s ease forwards;
        }
        
        .notification.error {
            background-color: rgba(255, 60, 60, 0.9);
        }
        
        .notification.hide {
            transform: translateX(100%);
            opacity: 0;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // ===== UNINSTALL ALERT FEATURE =====
    initUninstallAlert();
    
    // ===== PREMIUM BADGE CLICK HANDLERS =====
    // Make all premium badges clickable to open premium modal
    document.addEventListener('click', function(e) {
        const premiumBadge = e.target.closest('.level-prem');
        if (premiumBadge) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof openPremiumModal === 'function') {
                openPremiumModal();
            }
        }
    });
});

function initUninstallAlert() {
    // Dashboard elements
    const dashToggle = document.getElementById('dash-uninstall-alert-toggle');
    const dashStatus = document.getElementById('dash-uninstall-alert-status');
    const dashLink = document.getElementById('dash-open-uninstall-alert');
    
    // Settings page elements
    const emailInput = document.getElementById('uninstall-alert-email');
    const enabledToggle = document.getElementById('uninstall-alert-enabled');
    const saveBtn = document.getElementById('uninstall-alert-save');
    
    // Check premium status
    chrome.storage.local.get(['premium_active'], function(result) {
        const isPremium = result.premium_active === true;
        
        // Disable inputs for non-premium users (but NOT dashboard toggle - it needs to be clickable to navigate)
        if (!isPremium) {
            if (emailInput) {
                emailInput.disabled = true;
                emailInput.placeholder = 'Premium feature - Upgrade to unlock';
            }
            if (enabledToggle) {
                enabledToggle.disabled = true;
            }
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.style.opacity = '0.5';
                saveBtn.style.cursor = 'not-allowed';
            }
            // Don't disable dashToggle - let it be clickable so the change event fires and navigates to settings
        }
    });
    
    // Email validation
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    // Update Chrome uninstall URL
    function updateUninstallURL(email, enabled) {
        if (enabled && email) {
            // Get extension ID
            const extId = chrome.runtime.id || 'ninja-adult-blocker';
            const uninstallURL = `https://ninja-blocker-alert-api.vercel.app/redirect.html?ext=${encodeURIComponent(extId)}&email=${encodeURIComponent(email)}`;
            chrome.runtime.setUninstallURL(uninstallURL, function() {
                console.log('🔔 Uninstall URL set:', uninstallURL);
            });
        } else {
            chrome.runtime.setUninstallURL('', function() {
                console.log('🔕 Uninstall URL cleared');
            });
        }
    }
    
    // Update all status displays
    function updateAllDisplays(email, enabled) {
        // Dashboard toggle
        if (dashToggle) dashToggle.checked = enabled;
        
        // Dashboard status text
        if (dashStatus) {
            if (enabled && email) {
                const shortEmail = email.length > 16 ? email.substring(0, 14) + '…' : email;
                dashStatus.textContent = shortEmail;
                dashStatus.classList.add('on');
                dashStatus.title = email;
            } else {
                dashStatus.textContent = 'Off';
                dashStatus.classList.remove('on');
                dashStatus.title = '';
            }
        }
        
        // Settings page inputs
        if (emailInput) emailInput.value = email;
        if (enabledToggle) enabledToggle.checked = enabled;
    }
    
    // Load saved settings
    function loadSettings() {
        chrome.storage.local.get(['removal_alert_email', 'removal_alert_enabled'], function(result) {
            const email = result.removal_alert_email || '';
            const enabled = result.removal_alert_enabled || false;
            updateAllDisplays(email, enabled);
        });
    }
    
    // Dashboard toggle - quick enable/disable (with premium gate)
    if (dashToggle) {
        dashToggle.addEventListener('change', function() {
            chrome.storage.local.get(['premium_active', 'removal_alert_email'], function(result) {
                const isPremium = result.premium_active === true;
                
                // Premium gate - navigate to settings page to see feature
                if (!isPremium) {
                    dashToggle.checked = false;
                    showNotification('Uninstall Alert is a Premium feature', 'warning');
                    window.location.hash = 'uninstall-alert';
                    return;
                }
                
                const email = result.removal_alert_email || '';
                const enabled = dashToggle.checked;
                
                // If enabling without email, redirect to settings
                if (enabled && !email) {
                    dashToggle.checked = false;
                    showNotification('Please configure your email first', 'warning');
                    window.location.hash = 'uninstall-alert';
                    return;
                }
                
                chrome.storage.local.set({ removal_alert_enabled: enabled }, function() {
                    updateUninstallURL(email, enabled);
                    updateAllDisplays(email, enabled);
                    showNotification(enabled ? 'Uninstall Alert is now active' : 'Uninstall Alert disabled', 'success');
                });
            });
        });
    }
    
    // Dashboard link - navigate to settings
    if (dashLink) {
        dashLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.hash = 'uninstall-alert';
        });
    }
    
    // Settings page toggle - prevent enabling without email (with premium gate)
    if (enabledToggle) {
        enabledToggle.addEventListener('change', function() {
            chrome.storage.local.get(['premium_active'], function(result) {
                const isPremium = result.premium_active === true;
                
                // Premium gate
                if (!isPremium) {
                    enabledToggle.checked = false;
                    showNotification('Uninstall Alert is a Premium feature', 'warning');
                    if (typeof openPremiumModal === 'function') openPremiumModal();
                    return;
                }
                
                const email = emailInput ? emailInput.value.trim() : '';
                
                // If enabling without email, revert and show warning
                if (enabledToggle.checked && !email) {
                    enabledToggle.checked = false;
                    showNotification('Please enter your email first', 'warning');
                    if (emailInput) emailInput.focus();
                    return;
                }
                
                // If enabling with invalid email, revert and show error
                if (enabledToggle.checked && !isValidEmail(email)) {
                    enabledToggle.checked = false;
                    showNotification('Please enter a valid email address', 'error');
                    if (emailInput) emailInput.focus();
                    return;
                }
            });
        });
    }
    
    // Save button on settings page (with premium gate)
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            chrome.storage.local.get(['premium_active'], function(result) {
                const isPremium = result.premium_active === true;
                
                // Premium gate
                if (!isPremium) {
                    showNotification('Uninstall Alert is a Premium feature', 'warning');
                    if (typeof openPremiumModal === 'function') openPremiumModal();
                    return;
                }
                
                const email = emailInput ? emailInput.value.trim() : '';
                const enabled = enabledToggle ? enabledToggle.checked : false;
                
                // Case 1: Enabled but no email
                if (enabled && !email) {
                    showNotification('Please enter your email address', 'error');
                    if (emailInput) emailInput.focus();
                    return;
                }
                
                // Case 2: Enabled but invalid email
                if (enabled && !isValidEmail(email)) {
                    showNotification('Please enter a valid email address', 'error');
                    if (emailInput) emailInput.focus();
                    return;
                }
                
                // Case 3: Email provided but not enabled - just save email
                // Case 4: Both email and enabled - full activation
                // Case 5: Disabled - turn off alerts
                
                chrome.storage.local.set({
                    removal_alert_email: email,
                    removal_alert_enabled: enabled
                }, function() {
                    updateUninstallURL(email, enabled);
                    updateAllDisplays(email, enabled);
                    
                    // Show appropriate message
                    if (enabled && email) {
                        showNotification('Uninstall Alert is now active', 'success');
                    } else if (!enabled && email) {
                        showNotification('Email saved. Enable toggle to activate alerts.', 'info');
                    } else if (!enabled && !email) {
                        showNotification('Uninstall Alert disabled', 'success');
                    }
                });
            });
        });
    }
    
    // Load on init
    loadSettings();
    
    // Set uninstall URL on page load if already configured
    chrome.storage.local.get(['removal_alert_email', 'removal_alert_enabled'], function(result) {
        if (result.removal_alert_enabled && result.removal_alert_email) {
            updateUninstallURL(result.removal_alert_email, true);
        }
    });
}

// Load remote pricing from MD file hosted on Vercel (with caching)
function loadRemotePricing() {
    const PRICING_URL = 'https://ninja-blocker-alert-api.vercel.app/pricing.md';
    const CACHE_KEY = 'ninja_pricing_cache';
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    // Try to load from cache first (instant load, no flicker)
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { pricing, timestamp } = JSON.parse(cached);
            if (pricing && timestamp) {
                // Apply cached pricing immediately
                applyPricing(pricing);
                console.log('🏷️ Pricing loaded from cache');
                
                // If cache is still fresh, don't fetch
                if (Date.now() - timestamp < CACHE_TTL) {
                    return;
                }
            }
        }
    } catch (e) {
        console.warn('Cache read error:', e);
    }
    
    // Fetch fresh pricing in background
    fetch(PRICING_URL, { cache: 'no-cache' })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch pricing');
            return response.text();
        })
        .then(md => {
            const pricing = parsePricingMD(md);
            applyPricing(pricing);
            
            // Save to cache
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    pricing: pricing,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.warn('Cache write error:', e);
            }
            
            console.log('🏷️ Remote pricing loaded & cached:', pricing);
        })
        .catch(err => {
            console.warn('⚠️ Could not load remote pricing, using cache/defaults:', err.message);
        });
}

// Parse the pricing.md file
function parsePricingMD(md) {
    const pricing = {};
    const sections = md.split(/^## /m).filter(s => s.trim());
    
    sections.forEach(section => {
        const lines = section.trim().split('\n');
        const planName = lines[0].trim().toLowerCase();
        const plan = {};
        
        lines.slice(1).forEach(line => {
            const match = line.match(/^- (\w+): (.+)$/);
            if (match) {
                plan[match[1]] = match[2].trim();
            }
        });
        
        if (planName && Object.keys(plan).length > 0) {
            pricing[planName] = plan;
        }
    });
    
    return pricing;
}

// Apply pricing to the DOM
function applyPricing(pricing) {
    // Monthly (commented out but update anyway for future)
    if (pricing.monthly) {
        const monthlyCard = document.querySelector('[data-plan="monthly"]');
        if (monthlyCard) {
            updatePlanCard(monthlyCard, pricing.monthly);
        }
    }
    
    // Yearly
    if (pricing.yearly) {
        const yearlyCard = document.querySelector('[data-plan="yearly"]');
        if (yearlyCard) {
            updatePlanCard(yearlyCard, pricing.yearly);
        }
    }
    
    // Lifetime
    if (pricing.lifetime) {
        const lifetimeCard = document.querySelector('[data-plan="lifetime"]');
        if (lifetimeCard) {
            updatePlanCard(lifetimeCard, pricing.lifetime);
        }
    }
}

// Update a single plan card with pricing data
function updatePlanCard(card, plan) {
    // Update was price
    const wasPrice = card.querySelector('.was-price');
    if (wasPrice && plan.was) {
        wasPrice.textContent = plan.was;
    }
    
    // Update current price
    const amount = card.querySelector('.amount');
    if (amount && plan.price) {
        amount.textContent = plan.price;
        amount.classList.add('loaded'); // Fade in
    }
    
    // Update per (period)
    const per = card.querySelector('.per');
    if (per && plan.per) {
        per.textContent = plan.per;
        per.classList.add('loaded'); // Fade in
    }
    
    // Update links
    if (plan.link) {
        const links = card.querySelectorAll('a[href*="gumroad"]');
        links.forEach(link => {
            link.href = plan.link;
        });
    }
}

// ===== COUNTDOWN TIMER FOR 70% DISCOUNT =====
function initDiscountCountdown() {
    const countdownEl = document.getElementById('discount-countdown');
    if (!countdownEl) return;
    
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (!hoursEl || !minutesEl || !secondsEl) return;
    
    // Storage key for deadline
    const DEADLINE_KEY = 'ninja_discount_deadline';
    
    // Get or set deadline (24 hours from first view)
    let deadline = localStorage.getItem(DEADLINE_KEY);
    if (!deadline) {
        // Set deadline to 24 hours from now
        deadline = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem(DEADLINE_KEY, deadline);
    } else {
        deadline = parseInt(deadline, 10);
    }
    
    function updateCountdown() {
        const now = Date.now();
        const remaining = deadline - now;
        
        // If expired, show zeros and stop
        if (remaining <= 0) {
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            countdownEl.classList.add('urgent');
            return;
        }
        
        // Calculate time units
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        // Update display with zero-padding
        hoursEl.textContent = String(hours).padStart(2, '0');
        minutesEl.textContent = String(minutes).padStart(2, '0');
        secondsEl.textContent = String(seconds).padStart(2, '0');
        
        // Add urgent class when less than 1 hour
        if (hours < 1) {
            countdownEl.classList.add('urgent');
        } else {
            countdownEl.classList.remove('urgent');
        }
    }
    
    // Initial update
    updateCountdown();
    
    // Update every second
    const intervalId = setInterval(updateCountdown, 1000);
    
    // Store interval ID for cleanup if needed
    countdownEl._intervalId = intervalId;
}

// Initialize countdown when premium modal is opened
const premiumModal = document.getElementById('premium-modal');
if (premiumModal) {
    // Initialize on page load if modal exists
    initDiscountCountdown();
    
    // Re-initialize when modal opens (in case it was closed and reopened)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const isVisible = !premiumModal.classList.contains('hidden');
                if (isVisible) {
                    initDiscountCountdown();
                }
            }
        });
    });
    
    observer.observe(premiumModal, { attributes: true });
}

// ===== SIDEBAR COUNTDOWN TIMER =====
function initSidebarCountdown() {
    const sidebarCountdownEl = document.getElementById('sidebar-countdown');
    if (!sidebarCountdownEl) return;
    
    const sidebarHoursEl = document.getElementById('sidebar-hours');
    const sidebarMinutesEl = document.getElementById('sidebar-minutes');
    const sidebarSecondsEl = document.getElementById('sidebar-seconds');
    
    if (!sidebarHoursEl || !sidebarMinutesEl || !sidebarSecondsEl) return;
    
    // Use same deadline as main countdown
    const DEADLINE_KEY = 'ninja_discount_deadline';
    let deadline = localStorage.getItem(DEADLINE_KEY);
    if (!deadline) {
        deadline = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem(DEADLINE_KEY, deadline);
    } else {
        deadline = parseInt(deadline, 10);
    }
    
    function updateSidebarCountdown() {
        const now = Date.now();
        const remaining = deadline - now;
        
        if (remaining <= 0) {
            sidebarHoursEl.textContent = '00';
            sidebarMinutesEl.textContent = '00';
            sidebarSecondsEl.textContent = '00';
            sidebarCountdownEl.classList.add('urgent');
            return;
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        sidebarHoursEl.textContent = String(hours).padStart(2, '0');
        sidebarMinutesEl.textContent = String(minutes).padStart(2, '0');
        sidebarSecondsEl.textContent = String(seconds).padStart(2, '0');
        
        if (hours < 1) {
            sidebarCountdownEl.classList.add('urgent');
        } else {
            sidebarCountdownEl.classList.remove('urgent');
        }
    }
    
    updateSidebarCountdown();
    const intervalId = setInterval(updateSidebarCountdown, 1000);
    sidebarCountdownEl._intervalId = intervalId;
}

// Initialize sidebar countdown on page load
initSidebarCountdown();