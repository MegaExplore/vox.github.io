/**
 * Data Loader Module
 * Handles fetching content from IPFS gateways.
 */

export const GATEWAY_URL = 'https://ipfs.io/ipfs/';

const IPFS_GATEWAYS = [
    GATEWAY_URL,
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
];

/**
 * Fetches JSON data from a given CID using IPFS gateways.
 * @param {string} cid - The Content Identifier.
 * @returns {Promise<Object>} The parsed JSON data.
 */
export async function fetchData(cid) {
    // If cid is a full URL (e.g., local testing), use it directly
    if (cid.startsWith('http') || cid.startsWith('/')) {
        const response = await fetch(cid);
        if (!response.ok) throw new Error(`Failed to fetch ${cid}`);
        return await response.json();
    }

    // Remove ipfs:// prefix if present
    const cleanCid = cid.replace('ipfs://', '');

    for (const gateway of IPFS_GATEWAYS) {
        try {
            const url = `${gateway}${cleanCid}`;
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.warn(`Fetch failed from ${gateway}`, e);
        }
    }
    throw new Error(`All gateways failed for CID: ${cleanCid}`);
}
