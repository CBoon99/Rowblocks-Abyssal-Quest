import type { AccountSystem } from '../systems/AccountSystem';
import type { RowblocksProfile } from '../types/Progress';

/**
 * Underwater-themed profile gate: list / select / PIN / create.
 * Boot shows this before the main menu.
 */
export class ProfileSelectUI {
    private container: HTMLElement;
    private account: AccountSystem;
    private onProfileReady: () => void;
    private mode: 'list' | 'create' | 'pin' = 'list';
    private pendingProfileId: string | null = null;
    private pinError: string = '';
    private createError: string = '';

    constructor(
        container: HTMLElement,
        account: AccountSystem,
        onProfileReady: () => void
    ) {
        this.container = container;
        this.account = account;
        this.onProfileReady = onProfileReady;
        this.container.style.display = 'none';
        this.container.style.pointerEvents = 'auto';
    }

    show(): void {
        this.mode = 'list';
        this.pendingProfileId = null;
        this.pinError = '';
        this.createError = '';
        this.render();
        this.container.style.display = 'flex';
    }

    hide(): void {
        this.container.style.display = 'none';
        this.container.innerHTML = '';
    }

    private getProfiles(): RowblocksProfile[] {
        return this.account.listProfiles();
    }

    private formatLastPlayed(ts: number): string {
        if (!ts) return 'Never';
        const d = new Date(ts);
        const now = Date.now();
        const diff = now - ts;
        if (diff < 60_000) return 'Just now';
        if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
        if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
        return d.toLocaleDateString();
    }

    private render(): void {
        if (this.mode === 'create') {
            this.renderCreateForm();
            return;
        }
        if (this.mode === 'pin' && this.pendingProfileId) {
            this.renderPinPrompt();
            return;
        }
        this.renderList();
    }

    private renderList(): void {
        const profiles = this.getProfiles();
        const jasmine = profiles.find(
            (p) => p.displayName.toLowerCase() === 'jasmine'
        );

        this.container.innerHTML = `
            <div class="profile-select-screen">
                <div class="profile-select-panel">
                    <div class="profile-bubbles" aria-hidden="true">
                        <span class="bubble b1"></span>
                        <span class="bubble b2"></span>
                        <span class="bubble b3"></span>
                    </div>
                    <h1 class="profile-title">🌊 Choose Your Diver</h1>
                    <p class="profile-subtitle">Rowblocks Abyssal Quest</p>

                    ${jasmine ? `
                        <button class="profile-continue-jasmine" id="btn-continue-jasmine" type="button">
                            <span class="profile-continue-icon">🐠</span>
                            <span>
                                <strong>Continue as Jasmine</strong>
                                <small>Jump right in</small>
                            </span>
                        </button>
                    ` : ''}

                    <div class="profile-list" id="profile-list">
                        ${profiles.length === 0
                            ? '<p class="profile-empty">No divers yet — create one below!</p>'
                            : profiles.map((p) => this.renderProfileCard(p)).join('')}
                    </div>

                    <button class="profile-btn-create" id="btn-show-create" type="button">
                        ➕ Create New Diver
                    </button>
                </div>
            </div>
        `;

        document.getElementById('btn-continue-jasmine')?.addEventListener('click', () => {
            if (jasmine) this.trySelectProfile(jasmine.id);
        });

        document.getElementById('btn-show-create')?.addEventListener('click', () => {
            this.mode = 'create';
            this.createError = '';
            this.render();
        });

        profiles.forEach((p) => {
            const card = document.getElementById(`profile-card-${p.id}`);
            card?.addEventListener('click', () => this.trySelectProfile(p.id));
        });
    }

    private renderProfileCard(p: RowblocksProfile): string {
        const lock = p.pin ? '🔒' : '🐚';
        const stars = (p.levels || []).reduce((s, l) => s + (l.stars || 0), 0);
        return `
            <button class="profile-card" id="profile-card-${p.id}" type="button">
                <span class="profile-card-avatar">${lock}</span>
                <span class="profile-card-info">
                    <span class="profile-card-name">${this.escapeHtml(p.displayName)}</span>
                    <span class="profile-card-meta">
                        Last played: ${this.formatLastPlayed(p.lastPlayedAt)}
                        · ⭐ ${stars}
                        · 💎 ${p.pearls ?? 0}
                    </span>
                </span>
                <span class="profile-card-arrow">›</span>
            </button>
        `;
    }

    private renderPinPrompt(): void {
        const profile = this.getProfiles().find((p) => p.id === this.pendingProfileId);
        const name = profile?.displayName ?? 'Diver';

        this.container.innerHTML = `
            <div class="profile-select-screen">
                <div class="profile-select-panel profile-pin-panel">
                    <h1 class="profile-title">🔒 Enter PIN</h1>
                    <p class="profile-subtitle">For ${this.escapeHtml(name)}</p>
                    ${this.pinError ? `<p class="profile-error">${this.escapeHtml(this.pinError)}</p>` : ''}
                    <form id="profile-pin-form" class="profile-form" autocomplete="off">
                        <label class="profile-label" for="profile-pin-input">4-digit PIN</label>
                        <input
                            id="profile-pin-input"
                            class="profile-input profile-pin-input"
                            type="password"
                            inputmode="numeric"
                            pattern="[0-9]{4}"
                            maxlength="4"
                            placeholder="••••"
                            required
                            autofocus
                        />
                        <div class="profile-form-actions">
                            <button type="submit" class="profile-btn-primary">Unlock</button>
                            <button type="button" class="profile-btn-secondary" id="btn-pin-back">Back</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const form = document.getElementById('profile-pin-form') as HTMLFormElement | null;
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('profile-pin-input') as HTMLInputElement | null;
            const pin = (input?.value || '').trim();
            if (!this.pendingProfileId) return;
            if (!this.account.verifyPin(this.pendingProfileId, pin)) {
                this.pinError = 'Wrong PIN — try again!';
                this.render();
                return;
            }
            this.finishSelect(this.pendingProfileId);
        });

        document.getElementById('btn-pin-back')?.addEventListener('click', () => {
            this.mode = 'list';
            this.pendingProfileId = null;
            this.pinError = '';
            this.render();
        });

        // Focus pin field
        setTimeout(() => {
            document.getElementById('profile-pin-input')?.focus();
        }, 50);
    }

    private renderCreateForm(): void {
        this.container.innerHTML = `
            <div class="profile-select-screen">
                <div class="profile-select-panel">
                    <h1 class="profile-title">🐚 New Diver</h1>
                    <p class="profile-subtitle">Pick a name for your underwater hero</p>
                    ${this.createError ? `<p class="profile-error">${this.escapeHtml(this.createError)}</p>` : ''}
                    <form id="profile-create-form" class="profile-form" autocomplete="off">
                        <label class="profile-label" for="profile-name-input">Diver name</label>
                        <input
                            id="profile-name-input"
                            class="profile-input"
                            type="text"
                            maxlength="20"
                            placeholder="e.g. Jasmine"
                            required
                            autofocus
                        />
                        <label class="profile-label" for="profile-new-pin">
                            Optional 4-digit PIN
                        </label>
                        <input
                            id="profile-new-pin"
                            class="profile-input profile-pin-input"
                            type="password"
                            inputmode="numeric"
                            pattern="[0-9]{4}"
                            maxlength="4"
                            placeholder="Leave blank for none"
                        />
                        <div class="profile-form-actions">
                            <button type="submit" class="profile-btn-primary">Create &amp; Dive</button>
                            <button type="button" class="profile-btn-secondary" id="btn-create-back">Back</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const form = document.getElementById('profile-create-form') as HTMLFormElement | null;
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('profile-name-input') as HTMLInputElement | null;
            const pinInput = document.getElementById('profile-new-pin') as HTMLInputElement | null;
            const name = (nameInput?.value || '').trim();
            const pinRaw = (pinInput?.value || '').trim();

            if (!name) {
                this.createError = 'Please enter a name!';
                this.render();
                return;
            }
            if (pinRaw && !/^\d{4}$/.test(pinRaw)) {
                this.createError = 'PIN must be exactly 4 digits (or leave blank).';
                this.render();
                return;
            }

            const profile = this.account.createProfile(name, pinRaw || undefined);
            this.finishSelect(profile.id);
        });

        document.getElementById('btn-create-back')?.addEventListener('click', () => {
            this.mode = 'list';
            this.createError = '';
            this.render();
        });

        setTimeout(() => {
            document.getElementById('profile-name-input')?.focus();
        }, 50);
    }

    private trySelectProfile(id: string): void {
        const profile = this.getProfiles().find((p) => p.id === id);
        if (!profile) return;

        if (profile.pin) {
            this.pendingProfileId = id;
            this.mode = 'pin';
            this.pinError = '';
            this.render();
            return;
        }

        this.finishSelect(id);
    }

    private finishSelect(id: string): void {
        if (!this.account.selectProfile(id)) {
            this.pinError = 'Could not select profile.';
            this.mode = 'list';
            this.render();
            return;
        }
        this.hide();
        this.onProfileReady();
    }

    private escapeHtml(s: string): string {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
