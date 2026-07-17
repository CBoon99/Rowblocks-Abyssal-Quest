/**
 * Buddy Dive UI — create/join room for Ocean Ranger co-op skeleton.
 */

import { getBuddySession } from '../systems/BuddySession';

export class BuddyDiveUI {
    private root: HTMLElement;
    private onClose?: () => void;

    constructor() {
        this.root = document.createElement('div');
        this.root.id = 'buddy-dive-ui';
        this.root.className = 'buddy-dive-ui hidden';
        this.root.innerHTML = `
      <div class="buddy-dive-panel">
        <div class="buddy-dive-head">
          <h2>Buddy Dive</h2>
          <button type="button" class="buddy-close" id="buddy-close">✕</button>
        </div>
        <p class="buddy-copy">Ocean Rangers dive together — same team only. Share a code with a friend (same browser tabs work now; full online rooms next).</p>
        <div class="buddy-row">
          <label>Your ranger name</label>
          <input id="buddy-name" type="text" maxlength="16" placeholder="Jasmine" />
        </div>
        <div class="buddy-actions">
          <button type="button" class="btn-primary" id="buddy-host">Create Room</button>
        </div>
        <div class="buddy-row">
          <label>Join code</label>
          <input id="buddy-code" type="text" maxlength="4" inputmode="numeric" placeholder="1234" />
        </div>
        <div class="buddy-actions">
          <button type="button" class="btn-secondary" id="buddy-join">Join Friend</button>
          <button type="button" class="btn-secondary" id="buddy-leave">Leave</button>
        </div>
        <div class="buddy-status" id="buddy-status">Not connected</div>
        <p class="buddy-tip">Tip: open two tabs, Create in one, Join with the code in the other.</p>
      </div>
    `;
        document.body.appendChild(this.root);
        this.bind();
    }

    private bind(): void {
        const session = getBuddySession();
        session.onStatus = (msg) => {
            const el = this.root.querySelector('#buddy-status');
            if (el) el.textContent = msg;
        };

        this.root.querySelector('#buddy-close')?.addEventListener('click', () => this.hide());
        this.root.addEventListener('click', (e) => {
            if (e.target === this.root) this.hide();
        });

        this.root.querySelector('#buddy-host')?.addEventListener('click', () => {
            const name =
                (this.root.querySelector('#buddy-name') as HTMLInputElement)?.value ||
                'Ranger';
            const code = session.host(name);
            const codeInput = this.root.querySelector('#buddy-code') as HTMLInputElement;
            if (codeInput) codeInput.value = code;
            const st = this.root.querySelector('#buddy-status');
            if (st) st.textContent = `Room ${code} ready — share this code!`;
        });

        this.root.querySelector('#buddy-join')?.addEventListener('click', () => {
            const name =
                (this.root.querySelector('#buddy-name') as HTMLInputElement)?.value ||
                'Friend';
            const code =
                (this.root.querySelector('#buddy-code') as HTMLInputElement)?.value || '';
            session.join(code, name);
        });

        this.root.querySelector('#buddy-leave')?.addEventListener('click', () => {
            session.leave();
            const st = this.root.querySelector('#buddy-status');
            if (st) st.textContent = 'Left Buddy Dive';
        });
    }

    show(defaultName?: string): void {
        this.root.classList.remove('hidden');
        const nameEl = this.root.querySelector('#buddy-name') as HTMLInputElement;
        if (nameEl && defaultName) nameEl.value = defaultName;
    }

    hide(): void {
        this.root.classList.add('hidden');
        this.onClose?.();
    }

    setOnClose(fn: () => void): void {
        this.onClose = fn;
    }
}
