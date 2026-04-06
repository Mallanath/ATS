/**
 * Icon Sync Module - Synchronizes UI icons with selected theme
 */

(function() {
    'use strict';
    
    // Icon theme mapping
    const ICON_THEMES = {
        'classic': 'ninja-enable.png',
        'dark': 'ninja-dark.png',
        'blue': 'ninja-blue.png',
        'pink': 'ninja-pink.png',
        'purple': 'ninja-purple.png',
        'orange': 'ninja-orange.png',
        'red': 'ninja-red.png',
        'teal': 'ninja-teal.png',
        'gray': 'ninja-gray.png',
        'hidden': 'ninja-hidden.png'
    };
    
    // Default icon
    const DEFAULT_ICON = 'ninja-enable.png';
    
    /**
     * Get the icon filename for a given theme
     */
    function getIconForTheme(theme) {
        return ICON_THEMES[theme] || DEFAULT_ICON;
    }
    
    /**
     * Update all brand icons in the current page
     */
    function updateBrandIcons(theme) {
        const iconFile = getIconForTheme(theme);
        
        // Update all brand icons
        const brandIcons = document.querySelectorAll('.brand-icon');
        brandIcons.forEach(icon => {
            if (icon.tagName === 'IMG') {
                // Preserve the path structure
                const currentSrc = icon.src;
                const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1);
                icon.src = basePath + iconFile;
            }
        });
        
        // Update sidebar header icon (settings page)
        const sidebarIcon = document.querySelector('.sidebar-header img');
        if (sidebarIcon) {
            const currentSrc = sidebarIcon.src;
            const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1);
            sidebarIcon.src = basePath + iconFile;
        }
        
        // Update password protection icon
        const passwordIcon = document.querySelector('.password-header img');
        if (passwordIcon) {
            const currentSrc = passwordIcon.src;
            const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1);
            passwordIcon.src = basePath + iconFile;
        }
        
        // Update about logo (settings page)
        const aboutLogo = document.querySelector('.about-logo img');
        if (aboutLogo) {
            const currentSrc = aboutLogo.src;
            const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1);
            aboutLogo.src = basePath + iconFile;
        }
        
        // Update onboarding header icon
        const onboardingIcon = document.querySelector('.onboarding-header img');
        if (onboardingIcon) {
            const currentSrc = onboardingIcon.src;
            const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1);
            onboardingIcon.src = basePath + iconFile;
        }
        
        // Special handling for hidden theme - make icons semi-transparent
        if (theme === 'hidden') {
            brandIcons.forEach(icon => {
                icon.style.opacity = '0.3';
                icon.title = 'Stealth Mode Active';
            });
        } else {
            brandIcons.forEach(icon => {
                icon.style.opacity = '';
                icon.title = '';
            });
        }
    }
    
    /**
     * Load current theme and update icons
     */
    function loadAndUpdateIcons() {
        chrome.storage.local.get(['icon_theme'], function(result) {
            const theme = result.icon_theme || 'classic';
            updateBrandIcons(theme);
        });
    }
    
    /**
     * Listen for theme changes
     */
    function setupThemeListener() {
        // Listen for storage changes
        chrome.storage.onChanged.addListener(function(changes, namespace) {
            if (namespace === 'local' && changes.icon_theme) {
                const newTheme = changes.icon_theme.newValue || 'classic';
                updateBrandIcons(newTheme);
            }
        });
        
        // Listen for runtime messages (from settings page)
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.command === 'icon_theme_changed') {
                updateBrandIcons(request.theme);
            }
        });
    }
    
    /**
     * Initialize icon sync
     */
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                loadAndUpdateIcons();
                setupThemeListener();
            });
        } else {
            loadAndUpdateIcons();
            setupThemeListener();
        }
    }
    
    // Auto-initialize
    init();
    
    // Export for manual use if needed
    window.IconSync = {
        updateBrandIcons: updateBrandIcons,
        loadAndUpdateIcons: loadAndUpdateIcons,
        getIconForTheme: getIconForTheme
    };
})();
