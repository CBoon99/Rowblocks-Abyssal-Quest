# Respect the Ocean — Trust philosophy (live in code)

## Philosophy

**Nobody is bad.** Every creature behaves naturally.

Not “good fish / bad fish.”  
Not annoyance meters.  
Not combat HP.

**Trust.**

Jasmine: *“Why won’t the turtle come near me?”*  
Answer: *“You scared it.”*  
Then sit still… five seconds later… it slowly swims over.

That is the magic.

## Trust states (kid language)

curious · calm · wary · scared · trusting

Internal system name: **Trust** (0–1 per animal, this dive only).  
Children never see a number called “annoyance.”

## Personalities (every species)

| Species | Trait | Natural behaviour |
|---------|--------|-------------------|
| Turtle | Shy | Slow approach if gentle; loves clean reefs; leaves if chased |
| Octopus | Curious | Watches you; hides if followed hard; ink if startled |
| Manta | Gentle giant | Never attacks; escorts trusted divers; likes clean water |
| Clownfish | Protective | Calm near anemone; approach if you’re gentle by the garden |
| Shark | Confident | Ignores you until space invaded → soft “Back up.” |
| Jelly | Drifting | Simply exists; tentacles tingle if you swim through |

Every species has personality — not just behaviour.

## Systems (live)

### Dive memory
`trust` 0–1 per animal **this dive**.  
Leave and return gently → *“She remembers you!”*  
No permanent save needed. Kids interpret it as love.

### Curiosity
Sometimes the fish watches **you**.  
Slow orbit. Head tilt. Follows for ~20 seconds.  
Children love that.

### Reef health changes behaviour
Cleaning reefs does more than Conservation Points:

- Dirty reef → few fish, nervous turtle, tight schools  
- Clean nets + litter → coral health rises on the map  
- Thriving reef → denser schools, calmer animals, mantas appear more confident  

The world literally thanks you.

### Respect zones (only soft “danger”)
No invisible HP. No combat.

Just:

- **Too close** (shark space)  
- Soft body push  
- Tiny Dive Budget nibble  
- Visual cue: *“Too close. Back up.”*  

She’s confident — not angry.

### Jellyfish
Don’t attack.  
They simply exist.  
Swim through tentacles → soft tingle, little blur/bubbles.  
Lesson learned. Exactly like real life.

### Reef gathering (emotional high point)
Finish a reef. Everything cleaned. Health thriving.  
The entire reef gathers. Turtles. Butterfly fish. Manta.  
They swim around Jasmine.

**No dialogue. No reward chest. No XP explosion.**  
The reef accepting you.

### Birthday secret — elder turtle
Not on the map. Not in the UI.  
One elderly sea turtle (Home Reef ~6, 1.5, −4).  
Maximum trust → she slowly comes over…  
drops a glowing pearl:

> Happy Birthday Jasmine  
> Guardian of the Reef

No arrows. No quest marker.  
Just something she discovers naturally.

Those are the memories that stick.

## Conservation alignment

Because every creature behaves naturally:

- Cleaning changes **behaviour**, not just a score  
- Respect teaches real ocean manners  
- Nobody is the villain — even the shark is herself  

This *is* the philosophy of the game.

## Files

- `SpeciesPersonality.ts` — traits + kid lines  
- `FishSystem.ts` — trust memory, curiosity orbit, gather climax, elder turtle  
- `ReefHealthSystem.ts` — reef thanks you  
- `Game.ts` — observe tiers, wildlife events, pearl card, gather moment  
- `SwimmerController.ts` — gentleness + soft push  
- `GameHUD.ts` — Trust bar (not annoyance)  
