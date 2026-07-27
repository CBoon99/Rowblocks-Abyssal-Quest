/**
 * Graphics quality tiers — iPad / mobile first, desktop high.
 * Keeps species-true creatures; reduces cost (count, post, shadows, DPR).
 */

export type QualityTier = 'high' | 'medium' | 'low';

export interface QualityConfig {
    tier: QualityTier;
    pixelRatioMax: number;
    antialias: boolean;
    shadows: boolean;
    shadowMapSize: number;
    postOutline: boolean;
    postBloom: boolean;
    postBloomStrength: number;
    postCaustics: boolean;
    terrainSegments: number;
    marineSnow: number;
    fishCount: number;
    kelpFactor: number;
    coralFactor: number;
    rockFactor: number;
    bubblesMax: number;
}

/** Pass 6: keep art direction when effects reduce */
const TIERS: Record<QualityTier, QualityConfig> = {
    high: {
        tier: 'high',
        pixelRatioMax: 2,
        antialias: true,
        shadows: true,
        shadowMapSize: 2048,
        postOutline: false,
        postBloom: true,
        postBloomStrength: 0.28, // Memory: don't bleach coral
        postCaustics: true,
        terrainSegments: 192,
        marineSnow: 480, // was confetti
        fishCount: 22, // fewer ambient — protect hero moments
        kelpFactor: 1,
        coralFactor: 1.15,
        rockFactor: 1,
        bubblesMax: 160,
    },
    medium: {
        tier: 'medium',
        pixelRatioMax: 1.25,
        antialias: false,
        shadows: true,
        shadowMapSize: 1024,
        postOutline: false,
        postBloom: false,
        postBloomStrength: 0.22,
        postCaustics: true,
        terrainSegments: 96,
        marineSnow: 220,
        fishCount: 14,
        kelpFactor: 0.55,
        coralFactor: 0.85, // keep colour density
        rockFactor: 0.6,
        bubblesMax: 70,
    },
    low: {
        tier: 'low',
        pixelRatioMax: 1,
        antialias: false,
        shadows: false,
        shadowMapSize: 512,
        postOutline: false,
        postBloom: false,
        postBloomStrength: 0.2,
        postCaustics: false,
        terrainSegments: 48,
        marineSnow: 120,
        fishCount: 12,
        kelpFactor: 0.35,
        coralFactor: 0.55, // still colourful, fewer meshes
        rockFactor: 0.4,
        bubblesMax: 30,
    },
};

export function isTouchPrimary(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        if (window.matchMedia('(pointer: coarse)').matches) return true;
        if (navigator.maxTouchPoints > 0 && window.matchMedia('(hover: none)').matches) {
            return true;
        }
    } catch {
        /* ignore */
    }
    // iPadOS desktop mode still has touch
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
    return false;
}

export function detectQualityTier(): QualityTier {
    if (typeof window === 'undefined') return 'medium';
    const touch = isTouchPrimary();
    const cores = (navigator as any).hardwareConcurrency || 4;
    const mem = (navigator as any).deviceMemory; // GB, Chrome only

    if (touch) {
        // Default iPad to medium; older/low cores → low
        if (cores <= 4 || (typeof mem === 'number' && mem <= 4)) return 'low';
        return 'medium';
    }
    if (cores >= 8 && (!mem || mem >= 8)) return 'high';
    return 'medium';
}

let _current: QualityConfig | null = null;

export function getQualityConfig(forceTier?: QualityTier): QualityConfig {
    if (forceTier) {
        _current = { ...TIERS[forceTier] };
        return _current;
    }
    if (!_current) {
        _current = { ...TIERS[detectQualityTier()] };
    }
    return _current;
}

export function setQualityTier(tier: QualityTier): QualityConfig {
    _current = { ...TIERS[tier] };
    try {
        localStorage.setItem('rowblocks_quality_tier', tier);
    } catch {
        /* ignore */
    }
    return _current;
}

export function loadSavedQualityTier(): QualityTier | null {
    try {
        const t = localStorage.getItem('rowblocks_quality_tier') as QualityTier | null;
        if (t === 'high' || t === 'medium' || t === 'low') return t;
    } catch {
        /* ignore */
    }
    return null;
}

export function initQuality(): QualityConfig {
    const saved = loadSavedQualityTier();
    return getQualityConfig(saved || undefined);
}
