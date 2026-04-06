// license.js - License verification functionality for Ninja Adult Blocker

async function verifyLicense(productId, licenseKey) {
    if (typeof licenseKey !== 'string' || licenseKey.trim() === '') {
        throw new Error('Invalid license key');
    }
    const url = 'https://api.gumroad.com/v2/licenses/verify';
    
    const params = new URLSearchParams({
        product_id: productId,
        license_key: licenseKey,
        increment_uses_count: incrementUsesCount
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('License verification failed:', error);
        return { success: false, error: error.message };
    }
}

// Example usage for two products
async function checkLicenses() {
    const product1Id = '32-nPAicqbLj8B_WswVlMw=='; // Replace with actual product ID
    const product2Id = 'another-product-id'; // Replace with actual product ID
    const licenseKey = 'YOUR_CUSTOMERS_LICENSE_KEY'; // Replace with actual license key

    const result1 = await verifyLicense(product1Id, licenseKey);
    const result2 = await verifyLicense(product2Id, licenseKey);

    console.log('Product 1 Verification:', result1);
    console.log('Product 2 Verification:', result2);
}

// Uncomment to run license checks
// checkLicenses();
