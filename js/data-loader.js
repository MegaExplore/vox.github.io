/**
 * Data Loader Module
 * Handles fetching content from GitHub Raw CDN.
 */

// Replace these with your actual details
const GITHUB_BASE = 'https://raw.githubusercontent.com/MegaExplore/vox.github.io/main/';

/**
 * Fetches JSON data from a given path or full URL.
 * @param {string} path - The relative path in your GitHub repo (e.g., 'schemas/manifest.json')
 * @returns {Promise<Object>} The parsed JSON data.
 */
export async function fetchData(path) {
    // 1. If path is a full URL (external), use it directly
    if (path.startsWith('http')) {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to fetch ${path}`);
        return await response.json();
    }

    // 2. Otherwise, treat it as a path relative to your GitHub repo
    // Remove leading slash if user included one
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const url = `${GITHUB_BASE}${cleanPath}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (e) {
        console.error("Critical Data Load Error:", e);
        throw e;
    }
}