import { Fish } from './Fish.js';

export class FishManager {
    constructor(ctx, canvasWidth, canvasHeight) {
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.fish = [];
        this.fishDatabase = this.initializeFishDatabase();
        this.spawnFish();
    }
    
    initializeFishDatabase() {
        return [
            // Common fish
            { 
                id: 'clownfish', 
                name: 'Clownfish', 
                rarity: 'common', 
                emoji: '🐠', 
                biome: 'shallows',
                size: '3-4 inches',
                habitat: 'Coral reefs in warm waters',
                funFact: 'Did you know? Clownfish can change their gender! All clownfish are born male, and the largest one becomes female.',
                diet: 'Small invertebrates and algae',
                lifespan: '6-10 years'
            },
            { 
                id: 'tang', 
                name: 'Regal Tang', 
                rarity: 'common', 
                emoji: '🐟', 
                biome: 'shallows',
                size: '10-12 inches',
                habitat: 'Coral reefs in tropical waters',
                funFact: 'Fun fact: Regal Tangs are also called "Dory" fish! They have a special slime coating that protects them from parasites.',
                diet: 'Algae and small invertebrates',
                lifespan: '8-12 years'
            },
            { 
                id: 'parrotfish', 
                name: 'Parrotfish', 
                rarity: 'common', 
                emoji: '🐡', 
                biome: 'shallows',
                size: '12-20 inches',
                habitat: 'Coral reefs worldwide',
                funFact: 'Amazing! Parrotfish help create beaches! They eat coral and poop out sand - up to 200 pounds per year!',
                diet: 'Coral and algae',
                lifespan: '5-7 years'
            },
            { 
                id: 'angelfish', 
                name: 'Angelfish', 
                rarity: 'common', 
                emoji: '🐠', 
                biome: 'shallows',
                size: '6-8 inches',
                habitat: 'Coral reefs in warm waters',
                funFact: 'Cool fact: Angelfish are very territorial! They defend their coral homes from other fish.',
                diet: 'Sponges, algae, and small fish',
                lifespan: '10-15 years'
            },
            
            // Uncommon fish
            { 
                id: 'seahorse', 
                name: 'Seahorse', 
                rarity: 'uncommon', 
                emoji: '🐴', 
                biome: 'kelp',
                size: '1-14 inches (varies by species)',
                habitat: 'Seagrass beds and coral reefs',
                funFact: 'Wow! Male seahorses give birth! The female deposits eggs in the male\'s pouch, and he carries them until they hatch!',
                diet: 'Tiny crustaceans and plankton',
                lifespan: '1-5 years'
            },
            { 
                id: 'jellyfish', 
                name: 'Jellyfish', 
                rarity: 'uncommon', 
                emoji: '🎐', 
                biome: 'abyssal',
                size: 'Up to 6 feet wide!',
                habitat: 'All ocean depths worldwide',
                funFact: 'Incredible! Jellyfish are 95% water! They don\'t have a brain, heart, or bones - just a simple nervous system.',
                diet: 'Plankton, small fish, and other jellyfish',
                lifespan: 'A few months to several years'
            },
            { 
                id: 'ray', 
                name: 'Manta Ray', 
                rarity: 'uncommon', 
                emoji: '🐋', 
                biome: 'blue',
                size: 'Up to 23 feet wide!',
                habitat: 'Open ocean and coral reefs',
                funFact: 'Amazing! Manta rays are the largest rays in the ocean! They can jump 6 feet out of the water!',
                diet: 'Plankton and small fish',
                lifespan: '40-50 years'
            },
            
            // Rare fish
            { 
                id: 'octopus', 
                name: 'Octopus', 
                rarity: 'rare', 
                emoji: '🐙', 
                biome: 'abyssal',
                size: '1-16 feet (varies by species)',
                habitat: 'All ocean depths, from shallow reefs to deep sea',
                funFact: 'Mind-blowing! Octopuses have 3 hearts and blue blood! They can change color instantly to match their surroundings.',
                diet: 'Crabs, shrimp, and small fish',
                lifespan: '1-5 years'
            },
            { 
                id: 'eel', 
                name: 'Moray Eel', 
                rarity: 'rare', 
                emoji: '🐍', 
                biome: 'abyssal',
                size: 'Up to 10 feet long!',
                habitat: 'Coral reefs and rocky areas',
                funFact: 'Scary but cool! Moray eels have a second set of jaws in their throat that shoot forward to grab prey!',
                diet: 'Fish, octopuses, and crustaceans',
                lifespan: '10-30 years'
            },
            { 
                id: 'squid', 
                name: 'Giant Squid', 
                rarity: 'rare', 
                emoji: '🦑', 
                biome: 'abyssal',
                size: 'Up to 43 feet long!',
                habitat: 'Deep ocean, 1000-2000 feet down',
                funFact: 'Legendary! Giant squids have the largest eyes in the animal kingdom - as big as dinner plates! They\'re rarely seen alive.',
                diet: 'Deep-sea fish and other squid',
                lifespan: 'Unknown (very mysterious!)'
            },
            
            // Legendary fish
            { 
                id: 'leviathan', 
                name: 'Kael, the Leviathan', 
                rarity: 'legendary', 
                emoji: '🐉', 
                biome: 'sunken',
                size: 'Mythical size - as big as a whale!',
                habitat: 'The deepest, darkest parts of the ocean',
                funFact: 'LEGENDARY DISCOVERY! Kael is said to be the guardian of the deep. Ancient legends say it protects the ocean\'s greatest secrets. You\'re one of the few who has ever seen it!',
                diet: 'Unknown (legendary creatures are mysterious)',
                lifespan: 'Eternal (according to legends)'
            },
            { 
                id: 'kraken', 
                name: 'The Ancient Kraken', 
                rarity: 'legendary', 
                emoji: '🌊', 
                biome: 'sunken',
                size: 'Mythical - larger than any known creature!',
                habitat: 'The abyssal depths where legends are born',
                funFact: 'ULTRA RARE! The Ancient Kraken is said to be older than the ocean itself. Finding it is a once-in-a-lifetime discovery! Sailors have told stories about it for thousands of years!',
                diet: 'Unknown (too mysterious to study)',
                lifespan: 'Ancient beyond measure'
            },
            
            // Additional Common Fish (20 more)
            { 
                id: 'pufferfish', 
                name: 'Pufferfish', 
                rarity: 'common', 
                emoji: '🐡', 
                biome: 'shallows',
                size: '1-2 feet',
                habitat: 'Tropical and subtropical waters worldwide',
                funFact: 'Amazing! Pufferfish can inflate themselves to 3 times their normal size! They\'re one of the most poisonous fish in the ocean!',
                diet: 'Algae, small invertebrates, and shellfish',
                lifespan: '4-8 years'
            },
            { 
                id: 'butterflyfish', 
                name: 'Butterflyfish', 
                rarity: 'common', 
                emoji: '🦋', 
                biome: 'shallows',
                size: '4-8 inches',
                habitat: 'Coral reefs in tropical waters',
                funFact: 'Beautiful! Butterflyfish are named for their colorful patterns! They often swim in pairs and mate for life!',
                diet: 'Coral polyps, small invertebrates, and algae',
                lifespan: '7-10 years'
            },
            { 
                id: 'damselfish', 
                name: 'Damselfish', 
                rarity: 'common', 
                emoji: '🐠', 
                biome: 'shallows',
                size: '2-4 inches',
                habitat: 'Coral reefs worldwide',
                funFact: 'Cool! Damselfish are super territorial! They\'ll defend their algae gardens from fish 10 times their size!',
                diet: 'Algae, plankton, and small invertebrates',
                lifespan: '2-6 years'
            },
            { 
                id: 'wrasse', 
                name: 'Wrasse', 
                rarity: 'common', 
                emoji: '🐟', 
                biome: 'shallows',
                size: '4-12 inches',
                habitat: 'Coral reefs and rocky areas',
                funFact: 'Interesting! Some wrasse species clean other fish! They eat parasites off larger fish - a helpful service!',
                diet: 'Small invertebrates, crustaceans, and parasites',
                lifespan: '5-10 years'
            },
            { 
                id: 'goby', 
                name: 'Goby', 
                rarity: 'common', 
                emoji: '🐠', 
                biome: 'shallows',
                size: '1-4 inches',
                habitat: 'Coral reefs, seagrass beds, and sandy areas',
                funFact: 'Tiny but mighty! Gobies are some of the smallest fish in the ocean! Some species can climb waterfalls!',
                diet: 'Small invertebrates and plankton',
                lifespan: '1-3 years'
            },
            { 
                id: 'cardinalfish', 
                name: 'Cardinalfish', 
                rarity: 'common', 
                emoji: '🐠', 
                biome: 'shallows',
                size: '2-5 inches',
                habitat: 'Coral reefs and rocky areas',
                funFact: 'Sweet! Male cardinalfish carry eggs in their mouth! They protect the eggs until they hatch - super dads!',
                diet: 'Small crustaceans and plankton',
                lifespan: '2-4 years'
            },
            { 
                id: 'blenny', 
                name: 'Blenny', 
                rarity: 'common', 
                emoji: '🐠', 
                biome: 'shallows',
                size: '2-6 inches',
                habitat: 'Coral reefs, tide pools, and rocky areas',
                funFact: 'Fun! Blennies can walk on land! They use their fins like legs to hop between tide pools!',
                diet: 'Algae, small invertebrates, and plankton',
                lifespan: '2-5 years'
            },
            { 
                id: 'surgeonfish', 
                name: 'Surgeonfish', 
                rarity: 'common', 
                emoji: '🐟', 
                biome: 'shallows',
                size: '6-15 inches',
                habitat: 'Coral reefs in tropical waters',
                funFact: 'Watch out! Surgeonfish have sharp spines near their tail like a scalpel! They use them for defense!',
                diet: 'Algae and seagrass',
                lifespan: '5-10 years'
            },
            { 
                id: 'triggerfish', 
                name: 'Triggerfish', 
                rarity: 'common', 
                emoji: '🐡', 
                biome: 'shallows',
                size: '8-20 inches',
                habitat: 'Coral reefs and rocky areas',
                funFact: 'Clever! Triggerfish can lock their dorsal fin upright! It\'s like a trigger - once locked, it\'s hard to remove!',
                diet: 'Sea urchins, crustaceans, and small fish',
                lifespan: '8-12 years'
            },
            { 
                id: 'filefish', 
                name: 'Filefish', 
                rarity: 'common', 
                emoji: '🐠', 
                biome: 'shallows',
                size: '4-10 inches',
                habitat: 'Coral reefs and seagrass beds',
                funFact: 'Cool! Filefish can change color to match their surroundings! They\'re masters of camouflage!',
                diet: 'Algae, coral polyps, and small invertebrates',
                lifespan: '3-7 years'
            },
            { 
                id: 'rabbitfish', 
                name: 'Rabbitfish', 
                rarity: 'common', 
                emoji: '🐰', 
                biome: 'shallows',
                size: '8-16 inches',
                habitat: 'Coral reefs and lagoons',
                funFact: 'Cute! Rabbitfish are named for their rabbit-like face! They have venomous spines for protection!',
                diet: 'Algae and seagrass',
                lifespan: '5-8 years'
            },
            { 
                id: 'squirrelfish', 
                name: 'Squirrelfish', 
                rarity: 'common', 
                emoji: '🐠', 
                biome: 'shallows',
                size: '4-8 inches',
                habitat: 'Coral reefs and rocky areas',
                funFact: 'Nocturnal! Squirrelfish are most active at night! They have huge eyes to see in the dark!',
                diet: 'Small fish and crustaceans',
                lifespan: '3-6 years'
            },
            { 
                id: 'soldierfish', 
                name: 'Soldierfish', 
                rarity: 'common', 
                emoji: '🐠', 
                biome: 'shallows',
                size: '4-8 inches',
                habitat: 'Coral reefs and caves',
                funFact: 'Red alert! Soldierfish are bright red! Their color helps them blend into deep red coral!',
                diet: 'Small fish and crustaceans',
                lifespan: '4-8 years'
            },
            { 
                id: 'sweetlips', 
                name: 'Sweetlips', 
                rarity: 'common', 
                emoji: '🐠', 
                biome: 'shallows',
                size: '8-20 inches',
                habitat: 'Coral reefs in tropical waters',
                funFact: 'Pretty! Sweetlips have beautiful patterns that look like painted designs! They\'re also called "grunts"!',
                diet: 'Small fish and crustaceans',
                lifespan: '6-10 years'
            },
            { 
                id: 'grouper', 
                name: 'Grouper', 
                rarity: 'common', 
                emoji: '🐟', 
                biome: 'shallows',
                size: '1-8 feet (varies by species)',
                habitat: 'Coral reefs and rocky areas',
                funFact: 'Big! Groupers can grow huge! Some species can change from female to male as they grow!',
                diet: 'Fish, crustaceans, and octopuses',
                lifespan: '20-40 years'
            },
            { 
                id: 'snapper', 
                name: 'Snapper', 
                rarity: 'common', 
                emoji: '🐟', 
                biome: 'shallows',
                size: '1-3 feet',
                habitat: 'Coral reefs and rocky areas',
                funFact: 'Popular! Snappers are one of the most popular fish for eating! They have sharp teeth for catching prey!',
                diet: 'Fish, crustaceans, and mollusks',
                lifespan: '10-20 years'
            },
            { 
                id: 'grunt', 
                name: 'Grunter', 
                rarity: 'common', 
                emoji: '🐠', 
                biome: 'shallows',
                size: '4-12 inches',
                habitat: 'Coral reefs and seagrass beds',
                funFact: 'Noisy! Grunters make grunting sounds by grinding their teeth! They communicate with each other!',
                diet: 'Small invertebrates and fish',
                lifespan: '5-8 years'
            },
            { 
                id: 'porcupinefish', 
                name: 'Porcupinefish', 
                rarity: 'common', 
                emoji: '🐡', 
                biome: 'shallows',
                size: '1-2 feet',
                habitat: 'Coral reefs and rocky areas',
                funFact: 'Spiky! Porcupinefish have sharp spines all over! When threatened, they inflate and become a spiky ball!',
                diet: 'Sea urchins, crabs, and shellfish',
                lifespan: '5-10 years'
            },
            { 
                id: 'boxfish', 
                name: 'Boxfish', 
                rarity: 'common', 
                emoji: '📦', 
                biome: 'shallows',
                size: '3-6 inches',
                habitat: 'Coral reefs and lagoons',
                funFact: 'Boxy! Boxfish have a hard box-like shell! They\'re slow swimmers but super protected!',
                diet: 'Algae, small invertebrates, and worms',
                lifespan: '3-5 years'
            },
            { 
                id: 'cowfish', 
                name: 'Cowfish', 
                rarity: 'common', 
                emoji: '🐄', 
                biome: 'shallows',
                size: '4-8 inches',
                habitat: 'Coral reefs and seagrass beds',
                funFact: 'Cute! Cowfish have horns like a cow! They\'re related to boxfish and have the same hard shell!',
                diet: 'Algae, small invertebrates, and worms',
                lifespan: '3-6 years'
            },
            { 
                id: 'lionfish', 
                name: 'Lionfish', 
                rarity: 'common', 
                emoji: '🦁', 
                biome: 'shallows',
                size: '6-15 inches',
                habitat: 'Coral reefs and rocky areas',
                funFact: 'Dangerous! Lionfish have venomous spines! Their beautiful stripes warn predators to stay away!',
                diet: 'Small fish and crustaceans',
                lifespan: '5-10 years'
            },
            
            // Additional Uncommon Fish (15 more)
            { 
                id: 'dolphin', 
                name: 'Dolphin', 
                rarity: 'uncommon', 
                emoji: '🐬', 
                biome: 'blue',
                size: '6-12 feet',
                habitat: 'Open ocean and coastal waters worldwide',
                funFact: 'Super smart! Dolphins are one of the smartest animals! They have names for each other and can recognize themselves in mirrors!',
                diet: 'Fish and squid',
                lifespan: '20-50 years'
            },
            { 
                id: 'seaturtle', 
                name: 'Sea Turtle', 
                rarity: 'uncommon', 
                emoji: '🐢', 
                biome: 'shallows',
                size: '2-6 feet (varies by species)',
                habitat: 'Tropical and subtropical waters worldwide',
                funFact: 'Ancient! Sea turtles have been around for 110 million years! They can hold their breath for hours!',
                diet: 'Jellyfish, seagrass, and algae',
                lifespan: '50-100 years'
            },
            { 
                id: 'whaleshark', 
                name: 'Whale Shark', 
                rarity: 'uncommon', 
                emoji: '🦈', 
                biome: 'blue',
                size: 'Up to 40 feet long!',
                habitat: 'Warm tropical waters worldwide',
                funFact: 'Gentle giant! Whale sharks are the largest fish in the ocean! Despite their size, they only eat tiny plankton!',
                diet: 'Plankton and small fish',
                lifespan: '70-100 years'
            },
            { 
                id: 'stingray', 
                name: 'Stingray', 
                rarity: 'uncommon', 
                emoji: '🐟', 
                biome: 'shallows',
                size: '2-6 feet wide',
                habitat: 'Sandy bottoms and coral reefs',
                funFact: 'Flat! Stingrays are super flat! They hide in the sand and have a venomous tail for defense!',
                diet: 'Small fish, crustaceans, and mollusks',
                lifespan: '15-25 years'
            },
            { 
                id: 'eagle_ray', 
                name: 'Eagle Ray', 
                rarity: 'uncommon', 
                emoji: '🦅', 
                biome: 'blue',
                size: 'Up to 10 feet wide!',
                habitat: 'Open ocean and coral reefs',
                funFact: 'Graceful! Eagle rays can jump 6 feet out of the water! They have spots that look like eyes!',
                diet: 'Mollusks, crustaceans, and small fish',
                lifespan: '20-30 years'
            },
            { 
                id: 'hammerhead', 
                name: 'Hammerhead Shark', 
                rarity: 'uncommon', 
                emoji: '🔨', 
                biome: 'blue',
                size: 'Up to 20 feet long!',
                habitat: 'Warm coastal waters worldwide',
                funFact: 'Unique! Hammerhead sharks have eyes on the sides of their head! This gives them 360-degree vision!',
                diet: 'Fish, rays, and squid',
                lifespan: '20-30 years'
            },
            { 
                id: 'nurse_shark', 
                name: 'Nurse Shark', 
                rarity: 'uncommon', 
                emoji: '🦈', 
                biome: 'shallows',
                size: '7-10 feet long',
                habitat: 'Coral reefs and sandy bottoms',
                funFact: 'Gentle! Nurse sharks are very calm! They rest on the ocean floor during the day and hunt at night!',
                diet: 'Fish, crustaceans, and mollusks',
                lifespan: '25-35 years'
            },
            { 
                id: 'barracuda', 
                name: 'Barracuda', 
                rarity: 'uncommon', 
                emoji: '🐟', 
                biome: 'blue',
                size: '2-6 feet long',
                habitat: 'Coral reefs and open ocean',
                funFact: 'Fast! Barracudas are super fast swimmers! They can reach speeds of 25 miles per hour!',
                diet: 'Fish and squid',
                lifespan: '10-15 years'
            },
            { 
                id: 'tuna', 
                name: 'Tuna', 
                rarity: 'uncommon', 
                emoji: '🐟', 
                biome: 'blue',
                size: '2-10 feet (varies by species)',
                habitat: 'Open ocean worldwide',
                funFact: 'Speedy! Tuna can swim up to 47 miles per hour! They\'re warm-blooded fish - very rare!',
                diet: 'Fish, squid, and crustaceans',
                lifespan: '15-30 years'
            },
            { 
                id: 'marlin', 
                name: 'Marlin', 
                rarity: 'uncommon', 
                emoji: '🐟', 
                biome: 'blue',
                size: 'Up to 14 feet long!',
                habitat: 'Open ocean in tropical and temperate waters',
                funFact: 'Powerful! Marlins have a long sword-like bill! They can swim 50 miles per hour - one of the fastest fish!',
                diet: 'Fish and squid',
                lifespan: '10-15 years'
            },
            { 
                id: 'sailfish', 
                name: 'Sailfish', 
                rarity: 'uncommon', 
                emoji: '⛵', 
                biome: 'blue',
                size: 'Up to 11 feet long!',
                habitat: 'Warm open ocean waters',
                funFact: 'Fastest! Sailfish are the fastest fish in the ocean! They can reach 68 miles per hour!',
                diet: 'Fish and squid',
                lifespan: '4-7 years'
            },
            { 
                id: 'swordfish', 
                name: 'Swordfish', 
                rarity: 'uncommon', 
                emoji: '⚔️', 
                biome: 'blue',
                size: 'Up to 15 feet long!',
                habitat: 'Open ocean worldwide',
                funFact: 'Sharp! Swordfish have a long, flat bill like a sword! They use it to slash at prey!',
                diet: 'Fish and squid',
                lifespan: '9-10 years'
            },
            { 
                id: 'moonfish', 
                name: 'Moonfish', 
                rarity: 'uncommon', 
                emoji: '🌙', 
                biome: 'blue',
                size: '3-6 feet',
                habitat: 'Open ocean worldwide',
                funFact: 'Round! Moonfish are super round and flat! They look like a full moon swimming through the water!',
                diet: 'Jellyfish, small fish, and plankton',
                lifespan: 'Unknown'
            },
            { 
                id: 'sunfish', 
                name: 'Ocean Sunfish', 
                rarity: 'uncommon', 
                emoji: '☀️', 
                biome: 'blue',
                size: 'Up to 11 feet tall and 10 feet wide!',
                habitat: 'Open ocean worldwide',
                funFact: 'Huge! Ocean sunfish are the heaviest bony fish! They can weigh up to 5,000 pounds! They love to sunbathe at the surface!',
                diet: 'Jellyfish and small fish',
                lifespan: '10-20 years'
            },
            { 
                id: 'flying_fish', 
                name: 'Flying Fish', 
                rarity: 'uncommon', 
                emoji: '✈️', 
                biome: 'blue',
                size: '6-18 inches',
                habitat: 'Open ocean in warm waters',
                funFact: 'Amazing! Flying fish can glide through the air! They can fly up to 200 meters to escape predators!',
                diet: 'Plankton and small fish',
                lifespan: '1-2 years'
            },
            
            // Additional Rare Fish (10 more)
            { 
                id: 'great_white', 
                name: 'Great White Shark', 
                rarity: 'rare', 
                emoji: '🦈', 
                biome: 'blue',
                size: 'Up to 20 feet long!',
                habitat: 'Coastal and open ocean waters worldwide',
                funFact: 'Famous! Great white sharks are apex predators! They can detect a single drop of blood in 25 gallons of water!',
                diet: 'Seals, sea lions, fish, and dolphins',
                lifespan: '30-70 years'
            },
            { 
                id: 'tiger_shark', 
                name: 'Tiger Shark', 
                rarity: 'rare', 
                emoji: '🐅', 
                biome: 'blue',
                size: 'Up to 18 feet long!',
                habitat: 'Tropical and subtropical waters',
                funFact: 'Striped! Tiger sharks have dark stripes like a tiger! They\'re known as "wastebaskets of the sea" - they eat almost anything!',
                diet: 'Fish, seals, turtles, and almost anything',
                lifespan: '20-30 years'
            },
            { 
                id: 'blue_whale', 
                name: 'Blue Whale', 
                rarity: 'rare', 
                emoji: '🐋', 
                biome: 'blue',
                size: 'Up to 100 feet long!',
                habitat: 'All oceans worldwide',
                funFact: 'LARGEST ANIMAL EVER! Blue whales are the biggest animals that have ever lived! Their heart is as big as a car!',
                diet: 'Tiny krill (up to 4 tons per day!)',
                lifespan: '80-90 years'
            },
            { 
                id: 'humpback', 
                name: 'Humpback Whale', 
                rarity: 'rare', 
                emoji: '🐋', 
                biome: 'blue',
                size: 'Up to 60 feet long!',
                habitat: 'All oceans worldwide',
                funFact: 'Musical! Humpback whales sing beautiful songs! Their songs can travel for miles underwater!',
                diet: 'Krill and small fish',
                lifespan: '45-50 years'
            },
            { 
                id: 'orca', 
                name: 'Orca (Killer Whale)', 
                rarity: 'rare', 
                emoji: '🐋', 
                biome: 'blue',
                size: 'Up to 32 feet long!',
                habitat: 'All oceans worldwide',
                funFact: 'Apex predator! Orcas are actually dolphins, not whales! They hunt in packs and are super intelligent!',
                diet: 'Fish, seals, and even other whales',
                lifespan: '50-80 years'
            },
            { 
                id: 'giant_clam', 
                name: 'Giant Clam', 
                rarity: 'rare', 
                emoji: '🦪', 
                biome: 'shallows',
                size: 'Up to 4 feet wide!',
                habitat: 'Coral reefs in tropical waters',
                funFact: 'Huge! Giant clams can weigh up to 500 pounds! They can live for over 100 years!',
                diet: 'Algae (they farm it inside their shells!)',
                lifespan: '100+ years'
            },
            { 
                id: 'cuttlefish', 
                name: 'Cuttlefish', 
                rarity: 'rare', 
                emoji: '🐙', 
                biome: 'abyssal',
                size: '1-2 feet',
                habitat: 'Shallow and deep waters worldwide',
                funFact: 'Master of disguise! Cuttlefish can change color instantly! They have the most complex skin of any animal!',
                diet: 'Fish, crustaceans, and other cuttlefish',
                lifespan: '1-2 years'
            },
            { 
                id: 'nautilus', 
                name: 'Chambered Nautilus', 
                rarity: 'rare', 
                emoji: '🐚', 
                biome: 'abyssal',
                size: '6-10 inches',
                habitat: 'Deep ocean slopes',
                funFact: 'Living fossil! Nautiluses have been around for 500 million years! They\'re related to octopuses but have a shell!',
                diet: 'Small fish and crustaceans',
                lifespan: '15-20 years'
            },
            { 
                id: 'anglerfish', 
                name: 'Anglerfish', 
                rarity: 'rare', 
                emoji: '🎣', 
                biome: 'abyssal',
                size: 'Up to 3 feet long',
                habitat: 'Deep ocean, 1000-8000 feet down',
                funFact: 'Scary! Anglerfish have a glowing lure on their head! They use it to attract prey in the dark depths!',
                diet: 'Fish and crustaceans',
                lifespan: 'Unknown'
            },
            { 
                id: 'vampire_squid', 
                name: 'Vampire Squid', 
                rarity: 'rare', 
                emoji: '🧛', 
                biome: 'abyssal',
                size: 'Up to 1 foot long',
                habitat: 'Deep ocean, 2000-3000 feet down',
                funFact: 'Mysterious! Vampire squids live in the "twilight zone"! They have webbing between their arms like a cape!',
                diet: 'Marine snow (dead organic matter)',
                lifespan: 'Unknown'
            },
            
            // Additional Legendary Fish (5 more)
            { 
                id: 'megalodon', 
                name: 'Megalodon (Ancient)', 
                rarity: 'legendary', 
                emoji: '🦈', 
                biome: 'sunken',
                size: 'Up to 60 feet long!',
                habitat: 'Ancient oceans (extinct)',
                funFact: 'LEGENDARY! Megalodon was the largest shark that ever lived! Its teeth are bigger than your hand! Finding one is discovering ancient history!',
                diet: 'Whales and large marine animals',
                lifespan: 'Extinct (lived 23-3.6 million years ago)'
            },
            { 
                id: 'sea_serpent', 
                name: 'The Great Sea Serpent', 
                rarity: 'legendary', 
                emoji: '🐉', 
                biome: 'sunken',
                size: 'Mythical - hundreds of feet long!',
                habitat: 'The deepest, most mysterious parts of the ocean',
                funFact: 'LEGENDARY MYTH! Sailors have told stories of sea serpents for thousands of years! You\'ve found proof they exist! This is a discovery of a lifetime!',
                diet: 'Unknown (legendary creatures are mysterious)',
                lifespan: 'Eternal (according to legends)'
            },
            { 
                id: 'coral_guardian', 
                name: 'Coral, the Reef Guardian', 
                rarity: 'legendary', 
                emoji: '🏛️', 
                biome: 'sunken',
                size: 'Mythical - as large as a reef!',
                habitat: 'Ancient coral cities',
                funFact: 'LEGENDARY PROTECTOR! Coral is said to be the guardian spirit of all coral reefs! Finding it means you\'re chosen to protect the ocean!',
                diet: 'Unknown (spiritual being)',
                lifespan: 'Eternal'
            },
            { 
                id: 'pearl_dragon', 
                name: 'Pearl, the Dragon of the Deep', 
                rarity: 'legendary', 
                emoji: '🐲', 
                biome: 'sunken',
                size: 'Mythical - majestic and enormous!',
                habitat: 'The deepest ocean trenches',
                funFact: 'ULTRA LEGENDARY! Pearl is said to guard the ocean\'s greatest treasures! Legends say finding Pearl brings good luck to all ocean explorers!',
                diet: 'Unknown (legendary creatures are mysterious)',
                lifespan: 'Eternal'
            },
            { 
                id: 'ancient_turtle', 
                name: 'The Ancient Sea Turtle', 
                rarity: 'legendary', 
                emoji: '🐢', 
                biome: 'sunken',
                size: 'Mythical - larger than any known turtle!',
                habitat: 'Ancient underwater temples',
                funFact: 'LEGENDARY WISDOM! This ancient turtle is said to be thousands of years old! It knows all the secrets of the ocean! Finding it is discovering living history!',
                diet: 'Unknown (too ancient to study)',
                lifespan: 'Thousands of years (according to legends)'
            },
        ];
    }
    
    spawnFish() {
        const fishCount = 15;
        
        for (let i = 0; i < fishCount; i++) {
            const fishData = this.fishDatabase[Math.floor(Math.random() * this.fishDatabase.length)];
            const x = Math.random() * this.canvasWidth;
            const y = Math.random() * this.canvasHeight;
            
            const fish = new Fish(
                x, y,
                fishData.id,
                fishData.name,
                fishData.rarity,
                fishData.emoji,
                this.ctx
            );
            
            this.fish.push(fish);
        }
    }
    
    update(deltaTime, player) {
        this.fish.forEach(fish => {
            fish.update(deltaTime, player);
            
            // Check if player collected fish
            const dx = fish.x - player.x;
            const dy = fish.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < player.radius + fish.radius && fish.state !== 'fleeing') {
                if (player.collectFish(fish)) {
                    this.removeFish(fish);
                }
            }
        });
    }
    
    removeFish(fish) {
        const index = this.fish.indexOf(fish);
        if (index > -1) {
            this.fish.splice(index, 1);
            
            // Spawn new fish after a delay
            setTimeout(() => {
                if (this.fish.length < 15) {
                    const fishData = this.fishDatabase[Math.floor(Math.random() * this.fishDatabase.length)];
                    const x = Math.random() * this.canvasWidth;
                    const y = Math.random() * this.canvasHeight;
                    
                    const newFish = new Fish(
                        x, y,
                        fishData.id,
                        fishData.name,
                        fishData.rarity,
                        fishData.emoji,
                        this.ctx
                    );
                    
                    this.fish.push(newFish);
                }
            }, 2000);
        }
    }
    
    render() {
        this.fish.forEach(fish => {
            fish.render(this.ctx);
        });
    }
    
    onSonarPing(x, y) {
        const pingRadius = 200;
        this.fish.forEach(fish => {
            const dx = fish.x - x;
            const dy = fish.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < pingRadius) {
                fish.onSonarDetected();
            }
        });
    }
    
    onEchoCall(x, y) {
        const echoRadius = 150;
        this.fish.forEach(fish => {
            const dx = fish.x - x;
            const dy = fish.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < echoRadius && fish.rarity !== 'legendary') {
                fish.onEchoAttracted();
            }
        });
    }
    
    onNudge(x, y) {
        const nudgeRadius = 100;
        const nudgeForce = 3;
        
        this.fish.forEach(fish => {
            const dx = fish.x - x;
            const dy = fish.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nudgeRadius) {
                const angle = Math.atan2(dy, dx);
                fish.vx += Math.cos(angle) * nudgeForce;
                fish.vy += Math.sin(angle) * nudgeForce;
                fish.onNudged();
            }
        });
    }
    
    getAllFishData() {
        return this.fishDatabase;
    }
}

