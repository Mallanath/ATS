// Unit tests for porn blocker blocking logic
// Run with: node tests.js

// Import the blocked sites
const fs = require('fs');
const path = require('path');

// Read both files
const blockedSitesContent = fs.readFileSync(path.join(__dirname, 'blockedSites.js'), 'utf8');
const contentScriptContent = fs.readFileSync(path.join(__dirname, 'contentscript.js'), 'utf8');

// Parse BLOCKED_SITES directly from the file content
const BLOCKED_SITES = blockedSitesContent
    .replace('const BLOCKED_SITES = [', '[') // Remove the variable declaration
    .replace(/];\s*$/, ']') // Remove the closing semicolon and any trailing whitespace
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//')) // Remove empty lines and comments
    .map(line => line.replace(/[",]/g, '').trim()) // Remove quotes and commas
    .filter(site => site); // Remove any empty strings

// Then evaluate content script, but replace the CONFIG definition to use our BLOCKED_SITES
const modifiedContentScript = contentScriptContent
    .replace(/const CONFIG = {[^}]*};/, '') // Remove the CONFIG definition
    .replace(/checkAndBlockSite\(\);/, ''); // Remove auto-execution

// Define our own CONFIG
const CONFIG = {
    redirectUrl: "https://www.joinrelay.app/page-blocked",
    blockedSites: BLOCKED_SITES,
};

// Now evaluate the modified content script
eval(modifiedContentScript);

// Test helper function
function checkIfUrlIsBlocked(url) {
    return CONFIG.blockedSites.some(site => isUrlBlocked(url, site));
}

// Test cases
const testCases = [
    // Domain-only blocking tests
    {
        url: "https://aff.com",
        expected: true,
        description: "Should block aff.com (exact domain match)"
    },
    {
        url: "https://www.aff.com",
        expected: true,
        description: "Should block www.aff.com (subdomain match)"
    },
    {
        url: "https://secure.aff.com/login",
        expected: true,
        description: "Should block secure.aff.com (subdomain match)"
    },
    {
        url: "https://top-staff.com.pl",
        expected: false,
        description: "Should NOT block top-staff.com.pl (false positive fix)"
    },
    {
        url: "https://apple.com",
        expected: false,
        description: "Should NOT block apple.com"
    },
    {
        url: "https://staff-directory.com",
        expected: false,
        description: "Should NOT block staff-directory.com"
    },
    
    // Reddit path blocking tests
    {
        url: "https://reddit.com/r/kpopfap",
        expected: true,
        description: "Should block reddit.com/r/kpopfap"
    },
    {
        url: "https://reddit.com/r/kpopfap/comments/abc123/title",
        expected: true,
        description: "Should block reddit.com/r/kpopfap subpaths"
    },
    {
        url: "https://reddit.com/r/nsfw",
        expected: true,
        description: "Should block reddit.com/r/nsfw"
    },
    {
        url: "https://reddit.com/r/funny",
        expected: false,
        description: "Should NOT block reddit.com/r/funny"
    },
    {
        url: "https://reddit.com",
        expected: false,
        description: "Should NOT block reddit.com homepage"
    },
    {
        url: "https://reddit.com/r/programming",
        expected: false,
        description: "Should NOT block reddit.com/r/programming"
    },
    {
        url: "reddit.com/r/kpopfap",
        expected: true,
        description: "Should block www.reddit.com/r/kpopfap"
    },
    {
        url: "https://quitpornhub.com",
        expected: false,
        description: "Should block quitpornhub.com"
    },
    

    
    // Edge cases
    {
        url: "https://pornhub.com",
        expected: true,
        description: "Should block pornhub.com"
    },
    {
        url: "https://notpornhub.com",
        expected: false,
        description: "Should NOT block notpornhub.com (different domain)"
    },
    {
        url: "https://xvideos.com/categories",
        expected: true,
        description: "Should block xvideos.com"
    },
    {
        url: "https://example.com",
        expected: false,
        description: "Should NOT block example.com"
    },
    {
        url: "test.com",
        expected: true,
        description: "Should block test.com"
    },
    {
        url: "https://test.com",
        expected: true,
        description: "Should block https://test.com"
    },
    {
        url: "https://actual4test.com",
        expected: false,
        description: "Should NOT block https://actual4test.com"
    },
    {
        url: "actual4test.com",
        expected: false,
        description: "Should NOT block actual4test.com"
    },
];

// Run tests
console.log("🧪 Running Porn Blocker Unit Tests");
console.log(`📋 Testing with ${CONFIG.blockedSites.length} blocked sites\n`);

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    try {
        const result = checkIfUrlIsBlocked(testCase.url);
        const success = result === testCase.expected;
        
        if (success) {
            console.log(`✅ Test ${index + 1}: ${testCase.description}`);
            passed++;
        } else {
            console.log(`❌ Test ${index + 1}: ${testCase.description}`);
            console.log(`   URL: ${testCase.url}`);
            console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
            failed++;
        }
    } catch (error) {
        console.log(`💥 Test ${index + 1}: ${testCase.description}`);
        console.log(`   ERROR: ${error.message}`);
        failed++;
    }
});

console.log(`\n📊 Test Results:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
    console.log("\n🎉 All tests passed! The blocking logic is working correctly.");
} else {
    console.log("\n⚠️  Some tests failed. Please review the blocking logic.");
}
