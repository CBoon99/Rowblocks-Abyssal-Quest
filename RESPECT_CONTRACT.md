# Respect the Ocean — Swarm Contract (build now)

## Goal
Wildlife mood + soft hazards + Observe quality + reef health. No combat, no HP, no drown death.

## Shared API

### SwimmerController
- `getGentleness(): number` — 0 thrash … 1 calm (from recent speed)
- Keep existing movement

### FishSystem / each Fish
- `mood: 'curious'|'calm'|'wary'|'flee'|'annoyed'`
- `moodTimer`, `speciesTemperament`
- Update mood from player distance + gentleness
- Shark: respect radius soft push (callback to Game)
- Jelly: sting on contact (callback)

### Game
- `onWildlifeSting(amount)` → DiveBudget drain small
- `onSharkRespect()` → toast throttle
- Observe quality from nearest fish mood + gentleness
- `getReefHealth(reefId)` / update on clean

### ReefHealthSystem (new)
- per reef id: health 0–100
- dirty litter/net reduces; clean/rescue increases
- `getHealth(id)`, `addHealth(id, delta)`, `getVisualTint(id)`

### EducationSystem / collectFish
- Observe tiers: bolted | quick | calm | perfect
- CP crumb scales with tier

### UI
- Gentleness ring (optional DOM)
- Shark/jelly toasts
- Observe tier toast
- Reef health on minimap or small HUD chip near map

## Ownership
- A: FishSystem temperament + shark/jelly behavior
- B: ReefHealthSystem + ConservationWorld hooks
- C: Game Observe quality + DiveBudget sting + toasts
- D: UI (gentleness, alert flavors) + species.json temperament fields if needed
- E: SwimmerController gentleness signal

## Definition of done
npm run build green; thrash scatters fish; still approach; shark push; jelly tingle; clean improves reef health.
