/* Onboarding JavaScript - Enhanced Version with Password & Incognito */

// State Management
const state = {
    currentStep: 1,
    totalSteps: 4,
    userData: {
        password: '',
        passwordSet: false,
        safeSearch: true,
        blockAction: 'goback'
    },
    browser: detectBrowser()
};

// Configuration
const config = {
    typingSpeed: 50,
    typingDeleteSpeed: 30,
    typingPauseBeforeDelete: 2000,
    typingPauseBeforeNext: 500,
    typingPhrases: [
        '✨ Safe Browsing. Clear Mind. Total Peace.',
        '🛡️ Protect your family from harmful content.',
        '🔒 Block 500+ adult sites instantly.',
        '🚀 Fast, lightweight, and always on guard.'
    ]
};

// Detect browser
function detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('edg/')) return 'edge';
    if (userAgent.includes('opr/') || userAgent.includes('opera')) return 'opera';
    if (userAgent.includes('brave')) return 'brave';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('chrome')) return 'chrome';
    
    return 'chrome'; // default
}

// Save current state (called on every step change)
function saveCurrentState() {
    const stateToSave = {
        currentStep: state.currentStep,
        userData: state.userData,
        timestamp: Date.now()
    };
    
    chrome.storage.local.set({ 
        onboarding_state: stateToSave
    }, () => {
        console.log('💾 State saved:', stateToSave);
    });
}


// Show toast notification after restore
function showRestoreToast() {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'restore-toast';
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 13l4 4L19 7"/>
        </svg>
        <span>Welcome back! Checking your setup...</span>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Restore state after extension reload
function restoreStateAfterReload() {
    chrome.storage.local.get(['onboarding_state', 'onboarding_in_progress'], (result) => {
        // Set flag that onboarding is in progress (if not already complete)
        if (result.onboarding_in_progress !== false) {
            chrome.storage.local.set({ onboarding_in_progress: true });
        }
        
        // Try to restore state if available
        if (result.onboarding_state) {
            const savedState = result.onboarding_state;
            const timeElapsed = Date.now() - savedState.timestamp;
            
            // Only restore if less than 5 minutes have passed
            if (timeElapsed < 300000) {
                console.log('♻️ Restoring state after reload:', savedState);
                
                // Restore state
                state.currentStep = savedState.currentStep;
                state.userData = savedState.userData;
                
                // Skip welcome screen and show onboarding immediately
                const welcomeScreen = document.getElementById('welcome-screen');
                const onboardingScreen = document.getElementById('onboarding-screen');
                
                if (welcomeScreen && onboardingScreen) {
                    welcomeScreen.classList.remove('active');
                    welcomeScreen.style.display = 'none';
                    onboardingScreen.classList.add('active');
                    onboardingScreen.style.display = 'flex';
                    
                    updateUI();
                    
                    // If on step 2, check incognito status
                    if (savedState.currentStep === 2) {
                        autoCheckIncognitoOnStepChange();
                    }
                    
                    console.log('✅ State restored');
                }
            } else {
                // Clear old expired state
                chrome.storage.local.remove('onboarding_state');
                console.log('⏰ State expired, starting fresh');
            }
        } else {
            console.log('🆕 No saved state, fresh start');
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🥷 Ninja Adult Blocker - Enhanced Onboarding initialized');
    console.log('Detected browser:', state.browser);
    
    // Restore state if extension was reloaded (after enabling incognito)
    restoreStateAfterReload();
    
    initWelcomeScreen();
    initOnboardingScreen();
    setupKeyboardNavigation();
});

// ===== WELCOME SCREEN =====
function initWelcomeScreen() {
    const startBtn = document.getElementById('start-btn');
    
    // Start cycling typing animation
    setTimeout(() => {
        cycleTypingPhrases();
    }, 800);
    
    // Handle start button click
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            transitionToOnboarding();
        });
    }
}

// Typing animation with multiple phrases
let currentPhraseIndex = 0;
let isTyping = true;

function typeText(text, onComplete) {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;
    
    let index = 0;
    typingElement.textContent = '';
    
    const interval = setInterval(() => {
        if (index < text.length) {
            typingElement.textContent += text.charAt(index);
            index++;
        } else {
            clearInterval(interval);
            if (onComplete) onComplete();
        }
    }, config.typingSpeed);
}

function deleteText(onComplete) {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;
    
    const interval = setInterval(() => {
        const currentText = typingElement.textContent;
        if (currentText.length > 0) {
            typingElement.textContent = currentText.slice(0, -1);
        } else {
            clearInterval(interval);
            if (onComplete) onComplete();
        }
    }, config.typingDeleteSpeed);
}

function cycleTypingPhrases() {
    const phrases = config.typingPhrases;
    
    function typeNextPhrase() {
        typeText(phrases[currentPhraseIndex], () => {
            setTimeout(() => {
                deleteText(() => {
                    currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
                    setTimeout(typeNextPhrase, config.typingPauseBeforeNext);
                });
            }, config.typingPauseBeforeDelete);
        });
    }
    
    typeNextPhrase();
}

function transitionToOnboarding() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const onboardingScreen = document.getElementById('onboarding-screen');
    
    // Save initial state when starting onboarding
    saveCurrentState();
    
    if (welcomeScreen) {
        welcomeScreen.classList.remove('active');
    }
    
    setTimeout(() => {
        if (onboardingScreen) {
            onboardingScreen.classList.add('active');
        }
    }, 300);
}

// ===== ONBOARDING SCREEN =====
function initOnboardingScreen() {
    initPasswordSetup();
    initIncognitoSetup();
    initFeatureToggles();
    initNavigation();
    
    updateProgressBar();
    
    // Initialize button state for password step
    updateNextButtonForPassword();
}

// ===== PASSWORD SETUP =====
function initPasswordSetup() {
    const passwordInput = document.getElementById('password-input');
    const passwordConfirm = document.getElementById('password-confirm');
    const passwordError = document.getElementById('password-error');
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            updatePasswordStrength(password, strengthFill, strengthText);
            validatePasswords(passwordInput, passwordConfirm, passwordError);
            updateNextButtonForPassword();
        });
    }
    
    if (passwordConfirm) {
        passwordConfirm.addEventListener('input', () => {
            validatePasswords(passwordInput, passwordConfirm, passwordError);
            updateNextButtonForPassword();
        });
    }
    
    // Initialize toggle password buttons
    initTogglePasswordButtons();
}

// Toggle password visibility
function initTogglePasswordButtons() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const eyeOpen = button.querySelector('.eye-open');
            const eyeClosed = button.querySelector('.eye-closed');
            
            if (!input) return;
            
            if (input.type === 'password') {
                input.type = 'text';
                input.classList.add('password-visible');
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            } else {
                input.type = 'password';
                input.classList.remove('password-visible');
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            }
            
            // Keep focus on input
            input.focus();
        });
    });
}

function updatePasswordStrength(password, strengthFill, strengthText) {
    if (!strengthFill || !strengthText) return;
    
    const length = password.length;
    
    if (length === 0) {
        strengthFill.className = 'strength-fill';
        strengthText.textContent = 'Enter a password';
    } else if (length < 4) {
        strengthFill.className = 'strength-fill weak';
        strengthText.textContent = 'Too short';
    } else if (length < 8) {
        strengthFill.className = 'strength-fill medium';
        strengthText.textContent = 'Good';
    } else {
        strengthFill.className = 'strength-fill strong';
        strengthText.textContent = 'Strong';
    }
}

function validatePasswords(input1, input2, errorElement) {
    if (!input1 || !input2 || !errorElement) return true;
    
    const pass1 = input1.value;
    const pass2 = input2.value;
    
    if (pass1.length === 0 && pass2.length === 0) {
        errorElement.classList.add('hidden');
        return true;
    }
    
    if (pass1.length > 0 && pass1.length < 4) {
        errorElement.textContent = 'Password must be at least 4 characters';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    if (pass2.length > 0 && pass1 !== pass2) {
        errorElement.textContent = 'Passwords do not match';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    errorElement.classList.add('hidden');
    return true;
}

function updateNextButtonForPassword() {
    // Only update button if we're on step 1
    if (state.currentStep !== 1) return;
    
    const passwordInput = document.getElementById('password-input');
    const nextBtn = document.getElementById('next-btn');
    
    if (!passwordInput || !nextBtn) return;
    
    const hasPassword = passwordInput.value.length > 0;
    
    if (hasPassword) {
        // Show "Continue" with normal styling
        nextBtn.textContent = 'Continue';
        nextBtn.innerHTML = `
            Continue
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
        nextBtn.classList.remove('btn-skip');
    } else {
        // Show "Skip" with green tint styling
        nextBtn.textContent = 'Skip';
        nextBtn.innerHTML = `
            Skip
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
        nextBtn.classList.add('btn-skip');
    }
}

function canProceedFromPassword() {
    const passwordInput = document.getElementById('password-input');
    const passwordConfirm = document.getElementById('password-confirm');
    
    if (!passwordInput || !passwordConfirm) return true;
    
    const pass1 = passwordInput.value;
    const pass2 = passwordConfirm.value;
    
    // Allow skip (empty passwords)
    if (pass1.length === 0 && pass2.length === 0) {
        state.userData.passwordSet = false;
        state.userData.password = '';
        return true;
    }
    
    // Validate if passwords entered
    if (pass1.length < 4) {
        showError('Password must be at least 4 characters');
        return false;
    }
    
    if (pass1 !== pass2) {
        showError('Passwords do not match');
        return false;
    }
    
    state.userData.password = pass1;
    state.userData.passwordSet = true;
    return true;
}

// ===== INCOGNITO SETUP =====
function initIncognitoSetup() {
    const browserName = document.getElementById('browser-name');
    const openExtensionsBtn = document.getElementById('open-extensions-btn');
    const openAddonsBtn = document.getElementById('open-addons-btn');
    const checkIncognitoBtn = document.getElementById('check-incognito-btn');
    const toggleDemo = document.getElementById('toggle-demo');
    
    // Update browser name
    if (browserName) {
        const names = {
            chrome: 'Chrome',
            edge: 'Edge',
            brave: 'Brave',
            opera: 'Opera',
            firefox: 'Firefox'
        };
        browserName.textContent = names[state.browser] || 'Chrome';
    }
    
    // Toggle Demo - Click to open extension settings
    if (toggleDemo) {
        toggleDemo.addEventListener('click', () => {
            openExtensionSettings();
        });
    }
    
    // Check Incognito Status Button
    if (checkIncognitoBtn) {
        checkIncognitoBtn.addEventListener('click', checkIncognitoStatus);
    }
    
    // Setup visibility listener to re-check when user comes back to tab
    setupVisibilityListener();
    
    // Note: autoCheckIncognitoOnStepChange() is called from navigation functions
    // (handleNext, handleBack, handleSkip) when user actually navigates to step 2
    
    // Show/hide appropriate guide
    const guides = document.querySelectorAll('.browser-guide');
    guides.forEach(guide => {
        const browserType = guide.getAttribute('data-browser');
        if (state.browser === 'firefox' && browserType === 'firefox') {
            guide.classList.add('active');
            guide.style.display = 'block';
        } else if (state.browser !== 'firefox' && browserType === 'chrome') {
            guide.classList.add('active');
            guide.style.display = 'block';
        } else {
            guide.classList.remove('active');
            guide.style.display = 'none';
        }
    });
    
    // Open extensions page - directly to THIS extension
    if (openExtensionsBtn) {
        openExtensionsBtn.addEventListener('click', openExtensionSettings);
    }
    
    if (openAddonsBtn) {
        openAddonsBtn.addEventListener('click', openExtensionSettings);
    }
}

// Open extension settings page
function openExtensionSettings() {
    try {
        saveCurrentState();
        
        if (state.browser === 'firefox') {
            chrome.tabs.create({ url: 'about:addons' }, (tab) => {
                if (chrome.runtime.lastError) {
                    alert('Please manually open: about:addons');
                }
            });
        } else {
            const extensionId = chrome.runtime.id;
            const urls = {
                chrome: `chrome://extensions/?id=${extensionId}`,
                edge: `edge://extensions/?id=${extensionId}`,
                brave: `brave://extensions/?id=${extensionId}`,
                opera: `opera://extensions/?id=${extensionId}`
            };
            const url = urls[state.browser] || `chrome://extensions/?id=${extensionId}`;
            
            chrome.tabs.create({ url: url }, (tab) => {
                if (chrome.runtime.lastError) {
                    fallbackOpenExtensions(extensionId);
                }
            });
        }
    } catch (e) {
        console.error('Cannot open extensions page:', e);
        fallbackOpenExtensions();
    }
}

// Fallback function to open extensions page
function fallbackOpenExtensions(extensionId = null) {
    try {
        const urls = {
            chrome: 'chrome://extensions/',
            edge: 'edge://extensions/',
            brave: 'brave://extensions/',
            opera: 'opera://extensions/',
            firefox: 'about:addons'
        };
        
        const url = urls[state.browser] || 'chrome://extensions/';
        
        console.log('Fallback: Opening general extensions page:', url);
        
        chrome.tabs.create({ url: url }, (tab) => {
            if (chrome.runtime.lastError) {
                console.error('Fallback failed:', chrome.runtime.lastError);
                const message = extensionId 
                    ? `Please manually open: ${url}\n\nThen search for: Ninja Adult Blocker\nExtension ID: ${extensionId}`
                    : `Please manually open: ${url}\n\nThen find: Ninja Adult Blocker`;
                alert(message);
            }
        });
    } catch (e) {
        console.error('Fallback error:', e);
        alert('Please manually open your browser\'s extensions page and find "Ninja Adult Blocker"');
    }
}

// Setup visibility listener to re-check when user returns to tab
function setupVisibilityListener() {
    // Check if listener already added
    if (window.incognitoVisibilityListenerAdded) return;
    window.incognitoVisibilityListenerAdded = true;
    
    document.addEventListener('visibilitychange', () => {
        // Only check if we're on step 2 and tab becomes visible
        if (!document.hidden && state.currentStep === 2) {
            console.log('👁️ Tab became visible, re-checking incognito status...');
            
            // Wait a bit for any pending operations
            setTimeout(() => {
                const incognitoSetup = document.querySelector('.incognito-setup');
                
                // Only check if we haven't already shown success
                if (incognitoSetup && !incognitoSetup.classList.contains('enabled')) {
                    autoCheckIncognitoOnStepChange();
                }
            }, 500);
        }
    });
    
    console.log('👁️ Visibility listener setup for auto-check on tab return');
}

// Auto-check incognito status when navigating to step 2
function autoCheckIncognitoOnStepChange() {
    // Only check if we're actually on step 2 and element exists
    if (state.currentStep !== 2) {
        console.log('⏭️ Not on step 2 yet, skipping incognito check');
        return;
    }
    
    const incognitoSetup = document.querySelector('.incognito-setup');
    if (!incognitoSetup) {
        console.log('⏭️ Incognito setup element not found, skipping check');
        return;
    }
    
    // Check if already processed
    if (incognitoSetup.classList.contains('enabled')) {
        console.log('⏭️ Already showing success banner, skipping check');
        return;
    }
    
    if (typeof chrome !== 'undefined' && chrome.extension && chrome.extension.isAllowedIncognitoAccess) {
        chrome.extension.isAllowedIncognitoAccess(function(isAllowed) {
            if (isAllowed) {
                // If already enabled, show success immediately
                incognitoSetup.classList.add('enabled');
                incognitoSetup.innerHTML = `
                    <div class="success-state">
                        <div class="success-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <h4>Private Mode Enabled</h4>
                        <p>Protection is active in incognito windows</p>
                    </div>
                `;
                
                // Hide warning alert
                const warning = document.getElementById('incognito-warning');
                if (warning) warning.style.display = 'none';
                
                // Update navigation buttons to hide Skip
                updateNavigationButtons();
                
                console.log('✅ Auto-detected: Incognito mode is already enabled');
            } else {
                console.log('⚠️ Incognito mode is not enabled');
            }
        });
    }
}

// Check Incognito Status
function checkIncognitoStatus() {
    const btn = document.getElementById('check-incognito-btn');
    const incognitoSetup = document.querySelector('.incognito-setup');
    
    if (!btn || !incognitoSetup) return;
    
    // Show checking state
    btn.classList.add('checking');
    btn.querySelector('span').textContent = 'Checking...';
    
    // Check if API is available
    if (typeof chrome !== 'undefined' && chrome.extension && chrome.extension.isAllowedIncognitoAccess) {
        chrome.extension.isAllowedIncognitoAccess(function(isAllowed) {
            // Remove checking state
            btn.classList.remove('checking');
            btn.querySelector('span').textContent = 'Check if Incognito is Enabled';
            
            if (isAllowed) {
                // Success - Replace entire incognito-setup with success banner
                incognitoSetup.classList.add('enabled');
                incognitoSetup.innerHTML = `
                    <div class="success-state">
                        <div class="success-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <h4>Private Mode Enabled</h4>
                        <p>Protection is active in incognito windows</p>
                    </div>
                `;
                
                // Hide warning alert
                const warning = document.getElementById('incognito-warning');
                if (warning) warning.style.display = 'none';
                
                // Update navigation buttons to hide Skip
                updateNavigationButtons();
                
                console.log('✅ Incognito mode is enabled');
            } else {
                // Not enabled yet - show warning
                const statusDiv = document.getElementById('incognito-status');
                if (statusDiv) {
                    statusDiv.classList.remove('hidden');
                    statusDiv.className = 'status-result error';
                    statusDiv.innerHTML = `
                        <div class="status-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>
                        <div class="status-text">
                            <strong>Not Enabled Yet</strong>
                            <span>Please enable incognito mode using the button above, then check again.</span>
                        </div>
                    `;
                }
                
                console.log('⚠️ Incognito mode is not enabled');
            }
        });
    } else {
        // API not available (shouldn't happen in extensions)
        btn.classList.remove('checking');
        btn.querySelector('span').textContent = 'Check if Incognito is Enabled';
        
        const statusDiv = document.getElementById('incognito-status');
        if (statusDiv) {
            statusDiv.classList.remove('hidden');
            statusDiv.className = 'status-result error';
            statusDiv.innerHTML = `
                <div class="status-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M15 9l-6 6M9 9l6 6"/>
                    </svg>
                </div>
                <div class="status-text">
                    <strong>Unable to Check</strong>
                    <span>This feature requires proper extension installation.</span>
                </div>
            `;
        }
        
        console.error('❌ Chrome Extension API not available');
    }
}

// ===== FEATURE TOGGLES =====
function initFeatureToggles() {
    // Safe Search toggle
    const safeSearchToggle = document.getElementById('safe-search-toggle');
    if (safeSearchToggle) {
        // Default ON for strong protection UX
        safeSearchToggle.checked = true;
        state.userData.safeSearch = true;

        safeSearchToggle.addEventListener('change', (e) => {
            state.userData.safeSearch = e.target.checked;
            console.log('🔍 Safe Search:', state.userData.safeSearch);
        });
    }

    // Block Action radios mapped to real extension actions:
    // goback -> stealth-back
    // stealth-nxdomain -> stealth-nxdomain
    // connection-reset -> stealth-reset
    const blockActionRadios = document.querySelectorAll('input[name="block-action"]');
    
    // Set initial value from checked radio
    const checkedRadio = document.querySelector('input[name="block-action"]:checked');
    if (checkedRadio) {
        const val = checkedRadio.value;
        if (val === 'goback') state.userData.blockAction = 'stealth-back';
        else if (val === 'stealth-nxdomain') state.userData.blockAction = 'stealth-nxdomain';
        else if (val === 'connection-reset') state.userData.blockAction = 'stealth-reset';
        console.log('🚫 Block Action (initial):', val, '->', state.userData.blockAction);
    }
    
    blockActionRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const val = e.target.value;
            let mapped = 'stealth-back';
            if (val === 'goback') mapped = 'stealth-back';
            else if (val === 'stealth-nxdomain') mapped = 'stealth-nxdomain';
            else if (val === 'connection-reset') mapped = 'stealth-reset';
            state.userData.blockAction = mapped;
            console.log('🚫 Block Action (changed):', val, '->', mapped);
        });
    });
}

// ===== NAVIGATION =====
function initNavigation() {
    const nextBtn = document.getElementById('next-btn');
    const backBtn = document.getElementById('back-btn');
    const skipBtn = document.getElementById('skip-btn');
    
    if (nextBtn) {
        nextBtn.addEventListener('click', handleNext);
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', handleBack);
    }
    
    if (skipBtn) {
        skipBtn.addEventListener('click', handleSkip);
    }
}

function handleNext() {
    // Validate current step
    if (state.currentStep === 1) {
        if (!canProceedFromPassword()) {
            return;
        }
    }
    
    if (state.currentStep < state.totalSteps) {
        state.currentStep++;
        updateUI();
        scrollToTop();
        
        // Save state after step change
        saveCurrentState();
        
        // Auto-check incognito when arriving at step 2
        if (state.currentStep === 2) {
            setTimeout(() => {
                autoCheckIncognitoOnStepChange();
            }, 300);
        }
    } else {
        completeOnboarding();
    }
}

function handleBack() {
    if (state.currentStep > 1) {
        state.currentStep--;
        updateUI();
        scrollToTop();
        
        // Save state after step change
        saveCurrentState();
        
        // Auto-check incognito when going back to step 2
        if (state.currentStep === 2) {
            setTimeout(() => {
                autoCheckIncognitoOnStepChange();
            }, 300);
        }
    }
}

function handleSkip() {
    // Skip button behavior depends on current step
    if (state.currentStep === 1) {
        // Skip password
        state.userData.passwordSet = false;
        state.userData.password = '';
        state.currentStep++;
        updateUI();
        scrollToTop();
        
        // Save state after step change
        saveCurrentState();
        
        // Auto-check incognito when skipping to step 2
        if (state.currentStep === 2) {
            setTimeout(() => {
                autoCheckIncognitoOnStepChange();
            }, 300);
        }
    } else if (state.currentStep === 2) {
        // Skip incognito
        state.currentStep++;
        updateUI();
        scrollToTop();
        
        // Save state after step change
        saveCurrentState();
    } else {
        // Other steps - go to completion
        state.currentStep = state.totalSteps;
        updateUI();
        scrollToTop();
        
        // Save state after step change
        saveCurrentState();
    }
}

function updateUI() {
    updateStepContent();
    updateProgressBar();
    updateNavigationButtons();
    
    // Update completion summary if on final step
    if (state.currentStep === state.totalSteps) {
        updateCompletionSummary();
    }
}

function updateStepContent() {
    const stepContents = document.querySelectorAll('.ob-step');
    
    stepContents.forEach((content, index) => {
        const stepNumber = index + 1;
        if (stepNumber === state.currentStep) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

function updateProgressBar() {
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        // Step 1 = 25%, Step 2 = 50%, Step 3 = 75%, Step 4 = 100%
        const percentage = (state.currentStep / state.totalSteps) * 100;
        progressFill.style.width = percentage + '%';
    }
}

function updateNavigationButtons() {
    const navigation = document.querySelector('.ob-nav');
    const nextBtn = document.getElementById('next-btn');
    const backBtn = document.getElementById('back-btn');
    
    // Update back button visibility and navigation layout
    if (backBtn && navigation) {
        if (state.currentStep === 1) {
            backBtn.style.display = 'none';
            navigation.classList.add('single');
        } else {
            backBtn.style.display = 'inline-flex';
            navigation.classList.remove('single');
        }
    }
    
    // Update next button text and icon
    if (nextBtn) {
        if (state.currentStep === state.totalSteps) {
            nextBtn.innerHTML = `
                Finish
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 13l4 4L19 7"/>
                </svg>
            `;
            nextBtn.classList.remove('btn-skip');
        } else if (state.currentStep === 1) {
            // For step 1, use the password-specific button update
            updateNextButtonForPassword();
        } else {
            nextBtn.innerHTML = `
                Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            `;
            nextBtn.classList.remove('btn-skip');
        }
    }
}

function updateCompletionSummary() {
    // Password
    const passwordText = state.userData.passwordSet ? 'Protected ✓' : 'Not Set';
    const passwordElement = document.getElementById('final-password');
    if (passwordElement) {
        passwordElement.textContent = passwordText;
    }
    
    // Safe Search
    const safeSearchText = state.userData.safeSearch ? 'Enabled' : 'Disabled';
    const safeSearchElement = document.getElementById('final-safe-search');
    if (safeSearchElement) {
        safeSearchElement.textContent = safeSearchText;
    }
    
    // Block Action with icons
    const blockActionMap = {
        'goback': '↩️ Go Back',
        'stealth-back': '↩️ Go Back',
        'stealth-nxdomain': '🥷 Stealth',
        'stealth-reset': '⚠️ Error',
        'connection-reset': '⚠️ Error'
    };
    const blockActionText = blockActionMap[state.userData.blockAction] || '↩️ Go Back';
    const blockActionElement = document.getElementById('final-block-action');
    if (blockActionElement) {
        blockActionElement.textContent = blockActionText;
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(message) {
    const passwordError = document.getElementById('password-error');
    if (passwordError) {
        passwordError.textContent = message;
        passwordError.classList.remove('hidden');
    } else {
        alert(message);
    }
}

// ===== COMPLETION & SAVE =====
async function completeOnboarding() {
    console.log('✅ Completing onboarding with settings:', state.userData);
    
    // Show loading overlay
    showLoadingOverlay();
    
    try {
        // Prepare settings for Chrome storage
        const settings = prepareSettings();
        console.log('💾 Saving settings:', settings);
        console.log('🚫 Block Action being saved:', settings.block_action);
        
        // Save to Chrome storage
        await saveSettings(settings);
        
        // Trigger background script to apply settings
        await applySettings();
        
        // Wait a moment for visual feedback
        await delay(1500);
        
        // Clear saved onboarding state (onboarding is complete)
        chrome.storage.local.remove(['onboarding_state', 'onboarding_in_progress'], () => {
            console.log('🧹 Cleared onboarding state');
        });
        
        // Redirect to settings page
        window.location.href = 'settings/settings.html';
    } catch (error) {
        console.error('❌ Error completing onboarding:', error);
        hideLoadingOverlay();
        alert('Failed to save settings. Please try again.');
    }
}

function prepareSettings() {
    const settings = {
        // Core config
        ninja_config: {
            is_enable: true,
            version: '2.8'
        },

        // Protection level (always Lite/normal for onboarding)
        block_level: 'normal',

        // Safe Search
        safe_search_enabled: state.userData.safeSearch,

        // Block action (only allow safe, mapped choices from onboarding)
        block_action: (function () {
            const allowed = new Set(['stealth-back', 'stealth-nxdomain', 'stealth-reset']);
            const val = state.userData.blockAction || 'stealth-back';
            return allowed.has(val) ? val : 'stealth-back';
        })(),

        // Icon theme (default classic)
        icon_theme: 'classic',

        // Keyword blocking (always enabled for Lite)
        keyword_blocking_enabled: true,

        // Onboarding flags
        show_onboarding: false,
        onboarding_completed: true,
        onboarding_completed_at: Date.now(),
        onboarding_version: '3.0'
    };

    // Apply password using the same schema as settings.js if user set it
    if (state.userData.passwordSet && state.userData.password) {
        settings.ninja_password = state.userData.password;
        settings.require_password = true;
    }

    // Add safe search options if enabled
    if (state.userData.safeSearch) {
        settings.safe_search_options = {
            google: true,
            bing: true,
            yahoo: true,
            duckduckgo: true,
            youtube: true
        };
    }

    return settings;
}

function saveSettings(settings) {
    return new Promise((resolve, reject) => {
        if (!chrome.storage || !chrome.storage.local) {
            reject(new Error('Chrome storage API not available'));
            return;
        }
        
        chrome.storage.local.set(settings, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                console.log('💾 Settings saved successfully');
                resolve();
            }
        });
    });
}

function applySettings() {
    return new Promise((resolve) => {
        if (!chrome.runtime || !chrome.runtime.sendMessage) {
            console.warn('Chrome runtime API not available, skipping message');
            resolve();
            return;
        }
        
        // Notify background script to refresh rules
        chrome.runtime.sendMessage({ 
            command: 'refresh_rules' 
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('Background script message error:', chrome.runtime.lastError);
                // Don't reject, just log and continue
                resolve();
            } else {
                console.log('📡 Background script notified:', response);
                resolve();
            }
        });
    });
}

// ===== UTILITIES =====
function showLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== KEYBOARD NAVIGATION =====
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Enter key - Next/Complete
        if (e.key === 'Enter' && !e.shiftKey) {
            const activeElement = document.activeElement;
            const isInput = activeElement.tagName === 'INPUT' || 
                           activeElement.tagName === 'SELECT' || 
                           activeElement.tagName === 'TEXTAREA';
            
            if (!isInput) {
                e.preventDefault();
                if (document.getElementById('onboarding-screen').classList.contains('active')) {
                    handleNext();
                } else if (document.getElementById('welcome-screen').classList.contains('active')) {
                    transitionToOnboarding();
                }
            }
        }
        
        // Escape key - Back
        if (e.key === 'Escape') {
            if (document.getElementById('onboarding-screen').classList.contains('active') && 
                state.currentStep > 1) {
                e.preventDefault();
                handleBack();
            }
        }
        
        // Arrow keys for navigation
        if (e.key === 'ArrowRight' && e.ctrlKey) {
            e.preventDefault();
            handleNext();
        }
        
        if (e.key === 'ArrowLeft' && e.ctrlKey) {
            e.preventDefault();
            handleBack();
        }
    });
}

console.log('🥷 Ninja Adult Blocker - Enhanced Onboarding Ready');
console.log('💡 Keyboard shortcuts:');
console.log('   • Enter - Continue/Start');
console.log('   • Escape - Go back');
console.log('   • Ctrl + Arrow Keys - Navigate');
