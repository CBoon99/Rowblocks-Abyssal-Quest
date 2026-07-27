/**
 * Mock-plate filled HUD icons — chunky, readable, cyan/teal on dark chrome.
 * Filled shapes (not thin stroke outlines) to match gift mock plate.
 */

const svg = (body: string, viewBox = '0 0 24 24') =>
    `<svg viewBox="${viewBox}" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export const ICONS = {
    /** Open book — Marinepedia */
    book: svg(`
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H11v18H6.5A2.5 2.5 0 0 0 4 22.5V4.5z" opacity="0.95"/>
      <path d="M13 2h4.5A2.5 2.5 0 0 1 20 4.5v18a2.5 2.5 0 0 0-2.5-2.5H13V2z"/>
      <path d="M7 6h3v1.5H7zm0 3h3v1.5H7zm7-3h3v1.5h-3zm0 3h3v1.5h-3z" fill="#021018" opacity="0.25"/>
    `),

    /** Map pin */
    mapPin: svg(`
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
      <circle cx="12" cy="9" r="1.2" fill="#021018" opacity="0.35"/>
    `),

    /** Clipboard / quests */
    clipboard: svg(`
      <path d="M9 2h6a1 1 0 0 1 1 1v1h2.5A1.5 1.5 0 0 1 20 5.5v15A1.5 1.5 0 0 1 18.5 22h-13A1.5 1.5 0 0 1 4 20.5v-15A1.5 1.5 0 0 1 5.5 4H8V3a1 1 0 0 1 1-1z"/>
      <rect x="8" y="2.5" width="8" height="3" rx="1" fill="#021018" opacity="0.3"/>
      <rect x="7.5" y="10" width="9" height="1.6" rx="0.5" fill="#021018" opacity="0.35"/>
      <rect x="7.5" y="13.5" width="9" height="1.6" rx="0.5" fill="#021018" opacity="0.35"/>
      <rect x="7.5" y="17" width="6" height="1.6" rx="0.5" fill="#021018" opacity="0.35"/>
    `),

    /** Shopping bag */
    shop: svg(`
      <path d="M6.5 8h11l1 12.5A1.5 1.5 0 0 1 17 22H7a1.5 1.5 0 0 1-1.5-1.5L6.5 8z"/>
      <path d="M9 8V6.5A3 3 0 0 1 12 3.5 3 3 0 0 1 15 6.5V8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M9 8v2.5M15 8v2.5" fill="none" stroke="#021018" stroke-width="1.6" stroke-linecap="round" opacity="0.4"/>
    `),

    /** Settings gear */
    settings: svg(`
      <path d="M19.4 13a7.7 7.7 0 0 0 .1-1 7.7 7.7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7.4 7.4 0 0 0-1.7-1l-.4-2.6H9.1l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.7 7.7 0 0 0-.1 1 7.7 7.7 0 0 0 .1 1l-2 1.5 2 3.5 2.4-1a7.4 7.4 0 0 0 1.7 1l.4 2.6h5.8l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/>
      <circle cx="12" cy="12" r="1.6" fill="#021018" opacity="0.35"/>
    `),

    /** Binoculars — Observe */
    binoculars: svg(`
      <circle cx="7" cy="14" r="4.2"/>
      <circle cx="17" cy="14" r="4.2"/>
      <path d="M9.5 11.5h5v2.2c0 1-1 1.8-2.5 1.8s-2.5-.8-2.5-1.8v-2.2z"/>
      <path d="M5.5 7.5h3.2l1.2 3.2H6.2zm9.6 0H18.3l-.8 3.2h-3.5z"/>
      <circle cx="7" cy="14" r="1.8" fill="#021018" opacity="0.4"/>
      <circle cx="17" cy="14" r="1.8" fill="#021018" opacity="0.4"/>
    `),

    /** Trash bag — Clean (mock plate uses bag) */
    trash: svg(`
      <path d="M8 4.5h8l.8 2H7.2L8 4.5z"/>
      <path d="M6.5 7h11l-1.1 13.2A1.6 1.6 0 0 1 14.8 21.5H9.2a1.6 1.6 0 0 1-1.6-1.3L6.5 7z"/>
      <path d="M9.5 10.5v7M12 10.5v7M14.5 10.5v7" fill="none" stroke="#021018" stroke-width="1.4" stroke-linecap="round" opacity="0.4"/>
      <path d="M10 4.5V3.2A1.2 1.2 0 0 1 11.2 2h1.6A1.2 1.2 0 0 1 14 3.2V4.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
    `),

    /** Puzzle piece */
    puzzle: svg(`
      <path d="M10 3h4v2.2a1.8 1.8 0 1 0 0 3.6V11h2.2a1.8 1.8 0 1 1 0 3.6H14V19a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-4.4H5.8a1.8 1.8 0 1 1 0-3.6H8V8.8A1.8 1.8 0 1 0 8 5.2V3h2z"/>
    `),

    /** Dive fin — Boost */
    fins: svg(`
      <path d="M4 8.5c2.5-1 5.5-.5 8 1.5 2.2 1.8 4.2 4.8 5 7.5.3 1.1-.2 1.8-1.2 1.6-3.5-.6-6.5-2.2-8.8-4.5C5.2 12.4 4 10 4 8.5z"/>
      <path d="M5.5 9.5c1.2 2 2.8 3.5 4.8 4.8"/>
      <path d="M11 5.5c1.5 0 3.5.8 5 2.2 1.2 1.2 2.2 2.8 2.8 4.5-1.5-.3-3-.8-4.2-1.6-1.5-1-2.8-2.5-3.6-5.1z" opacity="0.9"/>
    `),

    /** Lantern */
    lantern: svg(`
      <path d="M9.5 2.5h5v2.2h-5z"/>
      <path d="M10.5 4.7h3v2h-3z"/>
      <path d="M7.5 7h9l-.8 11.5A1.8 1.8 0 0 1 14 20.2H10a1.8 1.8 0 0 1-1.7-1.7L7.5 7z"/>
      <path d="M9 11h6v5H9z" fill="#021018" opacity="0.25"/>
      <circle cx="12" cy="13.5" r="1.4" opacity="0.95"/>
    `),

    /** Gold coin */
    coin: svg(`
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="#021018" stroke-width="1.4" opacity="0.35"/>
      <path d="M12 7.2v9.6M9.5 9.5c.6-1 1.6-1.5 2.5-1.5s2 .5 2.5 1.5c.4.8 0 1.8-1.2 2.2-1.3.5-2.5.4-3.5 1.1-.7.5-.9 1.2-.5 1.9.5 1 1.5 1.5 2.7 1.5 1.2 0 2.2-.5 2.7-1.3" fill="none" stroke="#021018" stroke-width="1.5" stroke-linecap="round" opacity="0.45"/>
    `),

    /** Starfish / star */
    star: svg(`
      <path d="M12 2.2l2.7 6.2 6.8.6-5.2 4.5 1.6 6.6L12 16.8 6.1 20.1l1.6-6.6L2.5 9l6.8-.6L12 2.2z"/>
    `),

    /** Shell */
    shell: svg(`
      <path d="M4 14c0-4.5 3.6-9 8-9s8 4.5 8 9c0 3.2-2.2 6.5-8 6.5S4 17.2 4 14z"/>
      <path d="M12 5.5v14M7.5 10c1.8 1.2 3.2 1.8 4.5 1.8s2.7-.6 4.5-1.8M7 14c2 1.2 3.5 1.8 5 1.8s3-.6 5-1.8" fill="none" stroke="#021018" stroke-width="1.3" stroke-linecap="round" opacity="0.4"/>
    `),

    /** Heart / trust */
    heart: svg(`
      <path d="M12 20.5S4.5 15.8 2.8 12.2C1.2 8.8 3.2 5.2 7 5.2c1.9 0 3.3 1.1 4.2 2.3.9-1.2 2.3-2.3 4.2-2.3 3.8 0 5.8 3.6 4.2 7-1.7 3.6-9.4 8.3-9.4 8.3z"/>
    `),

    /** Alert / objective */
    alert: svg(`
      <circle cx="12" cy="12" r="10"/>
      <rect x="11" y="7" width="2.2" height="7" rx="1" fill="#021018" opacity="0.5"/>
      <circle cx="12.1" cy="17" r="1.2" fill="#021018" opacity="0.5"/>
    `),

    /** Pause */
    pause: svg(`
      <rect x="5.5" y="4.5" width="4.5" height="15" rx="1.5"/>
      <rect x="14" y="4.5" width="4.5" height="15" rx="1.5"/>
    `),

    /** Bubbles / air (optional) */
    bubbles: svg(`
      <circle cx="8" cy="14" r="3.5"/>
      <circle cx="15" cy="10" r="4.2"/>
      <circle cx="17" cy="17" r="2.4"/>
      <circle cx="7" cy="13" r="1" fill="#fff" opacity="0.45"/>
      <circle cx="14" cy="8.5" r="1.2" fill="#fff" opacity="0.45"/>
    `),
} as const;
