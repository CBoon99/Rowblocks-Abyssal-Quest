/**
 * Species personality — not "good/bad fish".
 * Every creature behaves naturally. Children understand Trust.
 */

export type TrustState = 'curious' | 'calm' | 'wary' | 'scared' | 'trusting';

export type PersonalityRole =
    | 'school'
    | 'protective' // clownfish near anemone
    | 'shy' // turtle, seahorse
    | 'curious_smart' // octopus
    | 'gentle_giant' // manta
    | 'confident' // shark — ignores until space invaded
    | 'jelly' // exists; tentacles tingle if you swim through
    | 'deep';

export interface SpeciesPersonality {
    /** Kid-facing one-word personality */
    trait: string;
    role: PersonalityRole;
    /** Base trust 0–1 when first met this dive */
    baseTrust: number;
    /** How fast trust rises when gentle nearby */
    trustGain: number;
    /** How fast trust drops when thrashed/chased */
    trustLoss: number;
    /** Soft respect zone radius (0 = none). Shark uses this. */
    respectRadius: number;
    /** Jelly tentacle radius */
    tingleRadius: number;
    /** Prefers clean reefs (boosts approach when reef health high) */
    lovesCleanReefs: boolean;
    /** Will escort trusted divers (manta) */
    escortsWhenTrusted: boolean;
    /** Investigates diver when curious (watches YOU) */
    watchesDiver: boolean;
    kidLine: {
        scared: string;
        calm: string;
        trusting: string;
        respect?: string;
    };
}

export const PERSONALITIES: Record<string, SpeciesPersonality> = {
    seaturtle: {
        trait: 'Shy',
        role: 'shy',
        baseTrust: 0.25,
        trustGain: 0.12,
        trustLoss: 0.35,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: true,
        escortsWhenTrusted: false,
        watchesDiver: true,
        kidLine: {
            scared: 'You scared it — sit still…',
            calm: 'The turtle is watching you.',
            trusting: 'She trusts you. Look how close she came.',
        },
    },
    octopus: {
        trait: 'Curious',
        role: 'curious_smart',
        baseTrust: 0.3,
        trustGain: 0.1,
        trustLoss: 0.4,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: false,
        escortsWhenTrusted: false,
        watchesDiver: true,
        kidLine: {
            scared: 'It hid — too much chasing.',
            calm: 'Something is studying you from the rocks…',
            trusting: 'Curious arms — it wants a closer look.',
        },
    },
    manta: {
        trait: 'Gentle giant',
        role: 'gentle_giant',
        baseTrust: 0.4,
        trustGain: 0.08,
        trustLoss: 0.25,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: true,
        escortsWhenTrusted: true,
        watchesDiver: true,
        kidLine: {
            scared: 'The manta glided away — give it space.',
            calm: 'A gentle giant passes.',
            trusting: 'She escorts you — clean water friends.',
        },
    },
    clownfish: {
        trait: 'Protective',
        role: 'protective',
        baseTrust: 0.35,
        trustGain: 0.15,
        trustLoss: 0.2,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: true,
        escortsWhenTrusted: false,
        watchesDiver: false,
        kidLine: {
            scared: 'Back to the anemone — they feel safer there.',
            calm: 'Busy little protectors of the garden.',
            trusting: 'They let you near the anemone. That’s rare.',
        },
    },
    shark: {
        trait: 'Confident',
        role: 'confident',
        baseTrust: 0.55,
        trustGain: 0.05,
        trustLoss: 0.15,
        respectRadius: 5.8,
        tingleRadius: 0,
        lovesCleanReefs: true,
        escortsWhenTrusted: false,
        watchesDiver: false,
        kidLine: {
            scared: 'Back up — she needs space.',
            calm: 'She doesn’t mind you. Keep your distance.',
            trusting: 'A quiet pass. Mutual respect.',
            respect: 'Too close. Back up.',
        },
    },
    jellyfish: {
        trait: 'Drifting',
        role: 'jelly',
        baseTrust: 0.5,
        trustGain: 0.02,
        trustLoss: 0.05,
        respectRadius: 0,
        tingleRadius: 1.45,
        lovesCleanReefs: false,
        escortsWhenTrusted: false,
        watchesDiver: false,
        kidLine: {
            scared: '…',
            calm: 'Just drifting. Soft light in the blue.',
            trusting: 'Observe from the side — not through the tentacles.',
        },
    },
    angelfish: {
        trait: 'Graceful',
        role: 'school',
        baseTrust: 0.4,
        trustGain: 0.12,
        trustLoss: 0.3,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: true,
        escortsWhenTrusted: false,
        watchesDiver: true,
        kidLine: {
            scared: 'The school scattered — swim softer.',
            calm: 'Graceful fins in the light.',
            trusting: 'They circle you like dancers.',
        },
    },
    blue_tang: {
        trait: 'Bold',
        role: 'school',
        baseTrust: 0.45,
        trustGain: 0.12,
        trustLoss: 0.28,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: true,
        escortsWhenTrusted: false,
        watchesDiver: true,
        kidLine: {
            scared: 'They bolted — try not to zoom.',
            calm: 'Electric blue in the coral.',
            trusting: 'Bold enough to inspect your mask.',
        },
    },
    seahorse: {
        trait: 'Timid',
        role: 'shy',
        baseTrust: 0.15,
        trustGain: 0.14,
        trustLoss: 0.45,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: true,
        escortsWhenTrusted: false,
        watchesDiver: true,
        kidLine: {
            scared: 'Gone into the grass.',
            calm: 'Almost invisible among the kelp.',
            trusting: 'A tiny head peeks out — for you.',
        },
    },
    parrotfish: {
        trait: 'Busy',
        role: 'school',
        baseTrust: 0.45,
        trustGain: 0.1,
        trustLoss: 0.25,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: true,
        escortsWhenTrusted: false,
        watchesDiver: false,
        kidLine: {
            scared: 'Back to crunching coral.',
            calm: 'Reef gardeners at work.',
            trusting: 'They keep grazing near you — good sign.',
        },
    },
    goldfish: {
        trait: 'Friendly',
        role: 'school',
        baseTrust: 0.5,
        trustGain: 0.14,
        trustLoss: 0.25,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: false,
        escortsWhenTrusted: false,
        watchesDiver: true,
        kidLine: {
            scared: 'Splash! Away they go.',
            calm: 'Sunny flashes of orange.',
            trusting: 'Hello, little friend.',
        },
    },
    butterfly_fish: {
        trait: 'Delicate',
        role: 'school',
        baseTrust: 0.38,
        trustGain: 0.12,
        trustLoss: 0.32,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: true,
        escortsWhenTrusted: false,
        watchesDiver: true,
        kidLine: {
            scared: 'Delicate wings vanish into coral.',
            calm: 'Fluttering pairs.',
            trusting: 'They hold still for a perfect look.',
        },
    },
    mandarin_fish: {
        trait: 'Shy jewel',
        role: 'shy',
        baseTrust: 0.28,
        trustGain: 0.13,
        trustLoss: 0.38,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: true,
        escortsWhenTrusted: false,
        watchesDiver: true,
        kidLine: {
            scared: 'Jewel gone — too much noise.',
            calm: 'A flash of pattern in the rock.',
            trusting: 'The jewel stays in the open for you.',
        },
    },
    barramundi: {
        trait: 'Steady',
        role: 'school',
        baseTrust: 0.42,
        trustGain: 0.1,
        trustLoss: 0.25,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: false,
        escortsWhenTrusted: false,
        watchesDiver: false,
        kidLine: {
            scared: 'Deep silver turns and goes.',
            calm: 'A solid, steady swimmer.',
            trusting: 'Calm company on the reef edge.',
        },
    },
    cleaner_shrimp: {
        trait: 'Helpful',
        role: 'school',
        baseTrust: 0.55,
        trustGain: 0.1,
        trustLoss: 0.2,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: true,
        escortsWhenTrusted: false,
        watchesDiver: false,
        kidLine: {
            scared: 'Station closed — try later.',
            calm: 'Tiny doctors of the reef.',
            trusting: 'They wave you closer — cleaning station open!',
        },
    },
    lanternfish: {
        trait: 'Shy light',
        role: 'deep',
        baseTrust: 0.3,
        trustGain: 0.09,
        trustLoss: 0.3,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: false,
        escortsWhenTrusted: false,
        watchesDiver: true,
        kidLine: {
            scared: 'Lights out in the deep.',
            calm: 'Soft living lanterns.',
            trusting: 'They glow for quiet rangers.',
        },
    },
    giant_squid: {
        trait: 'Mysterious',
        role: 'deep',
        baseTrust: 0.2,
        trustGain: 0.06,
        trustLoss: 0.35,
        respectRadius: 0,
        tingleRadius: 0,
        lovesCleanReefs: false,
        escortsWhenTrusted: false,
        watchesDiver: true,
        kidLine: {
            scared: 'Back into the dark.',
            calm: 'A shadow of the deep.',
            trusting: 'It lingers — a rare gift.',
        },
    },
};

export function getPersonality(speciesId: string): SpeciesPersonality {
    return (
        PERSONALITIES[speciesId] || {
            trait: 'Wild',
            role: 'school',
            baseTrust: 0.4,
            trustGain: 0.1,
            trustLoss: 0.3,
            respectRadius: 0,
            tingleRadius: 0,
            lovesCleanReefs: true,
            escortsWhenTrusted: false,
            watchesDiver: true,
            kidLine: {
                scared: 'You scared it.',
                calm: 'Living its ocean life.',
                trusting: 'It trusts you.',
            },
        }
    );
}

/** Map continuous trust 0–1 → kid-readable state */
export function trustToState(trust: number, thrashing: boolean, tooCloseRespect: boolean): TrustState {
    if (tooCloseRespect) return 'wary';
    if (thrashing && trust < 0.55) return 'scared';
    if (trust >= 0.72) return 'trusting';
    if (trust >= 0.55) return 'curious';
    if (trust >= 0.35) return 'calm';
    if (trust >= 0.18) return 'wary';
    return 'scared';
}
