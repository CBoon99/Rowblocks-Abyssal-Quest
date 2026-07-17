/**
 * Buddy Dive skeleton — 2-player Ocean Ranger co-op.
 * Transport: BroadcastChannel (same browser/tabs) + optional PeerJS-free room code via localStorage bus for same-device testing.
 * Protocol ready for WebSocket relay later without rewriting Game.
 */

export type BuddyRole = 'host' | 'guest' | 'offline';

export type BuddyPose = {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    name: string;
    air: number;
    t: number;
};

export type BuddyMsg =
    | { type: 'hello'; role: BuddyRole; name: string; code: string }
    | { type: 'pose'; pose: BuddyPose }
    | { type: 'action'; action: 'collect' | 'clean' | 'net' | 'boost'; }
    | { type: 'alert'; title: string; body: string }
    | { type: 'ping'; x: number; z: number }
    | { type: 'bye' };

function makeCode(): string {
    return String(1000 + Math.floor(Math.random() * 9000));
}

export class BuddySession {
    role: BuddyRole = 'offline';
    code: string | null = null;
    localName = 'Ranger';
    remote: BuddyPose | null = null;
    connected = false;

    private channel: BroadcastChannel | null = null;
    private storageKey = '';
    private pollTimer: number | null = null;
    private lastPoseSend = 0;

    onRemotePose?: (pose: BuddyPose) => void;
    onRemoteAction?: (action: string) => void;
    onStatus?: (msg: string) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;

    isActive(): boolean {
        return this.role !== 'offline' && this.connected;
    }

    /** Host creates a 4-digit room */
    host(displayName: string): string {
        this.leave();
        this.role = 'host';
        this.localName = displayName || 'Ranger';
        this.code = makeCode();
        this.openBus(this.code);
        this.connected = true;
        this.broadcast({ type: 'hello', role: 'host', name: this.localName, code: this.code });
        this.onStatus?.(`Room ${this.code} — friends join with this code`);
        this.onConnected?.();
        return this.code;
    }

    /** Guest joins by code */
    join(code: string, displayName: string): boolean {
        const c = (code || '').trim();
        if (!/^\d{4}$/.test(c)) {
            this.onStatus?.('Enter a 4-digit code');
            return false;
        }
        this.leave();
        this.role = 'guest';
        this.localName = displayName || 'Friend';
        this.code = c;
        this.openBus(c);
        this.connected = true;
        this.broadcast({ type: 'hello', role: 'guest', name: this.localName, code: c });
        this.onStatus?.(`Joining room ${c}…`);
        this.onConnected?.();
        return true;
    }

    leave(): void {
        if (this.channel) {
            try {
                this.broadcast({ type: 'bye' });
            } catch {
                /* ignore */
            }
            this.channel.close();
        }
        this.channel = null;
        if (this.pollTimer != null) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        this.role = 'offline';
        this.code = null;
        this.remote = null;
        this.connected = false;
        this.onDisconnected?.();
    }

    private openBus(code: string): void {
        this.storageKey = `rowblocks_buddy_${code}`;
        try {
            this.channel = new BroadcastChannel(this.storageKey);
            this.channel.onmessage = (ev) => this.handle(ev.data as BuddyMsg);
        } catch {
            this.channel = null;
        }
        // Cross-tab fallback via localStorage events
        window.addEventListener('storage', this.onStorage);
        this.pollTimer = window.setInterval(() => {
            // keep-alive noop; storage events handle cross-tab
        }, 5000) as unknown as number;
    }

    private onStorage = (e: StorageEvent): void => {
        if (!e.key || e.key !== this.storageKey + '_msg' || !e.newValue) return;
        try {
            const msg = JSON.parse(e.newValue) as BuddyMsg & { _from?: string };
            if (msg._from === this.localName) return;
            this.handle(msg);
        } catch {
            /* ignore */
        }
    };

    private broadcast(msg: BuddyMsg): void {
        try {
            this.channel?.postMessage(msg);
        } catch {
            /* ignore */
        }
        try {
            const payload = { ...msg, _from: this.localName, _t: Date.now() };
            localStorage.setItem(this.storageKey + '_msg', JSON.stringify(payload));
        } catch {
            /* ignore */
        }
    }

    private handle(msg: BuddyMsg): void {
        if (!msg || !msg.type) return;
        switch (msg.type) {
            case 'hello':
                this.connected = true;
                this.onStatus?.(`${msg.name} is diving with you!`);
                this.onConnected?.();
                break;
            case 'pose':
                this.remote = msg.pose;
                this.onRemotePose?.(msg.pose);
                break;
            case 'action':
                this.onRemoteAction?.(msg.action);
                break;
            case 'alert':
                this.onStatus?.(`${msg.title}: ${msg.body}`);
                break;
            case 'bye':
                this.remote = null;
                this.onStatus?.('Buddy left the dive');
                this.onDisconnected?.();
                break;
            default:
                break;
        }
    }

    sendPose(pose: Omit<BuddyPose, 'name' | 't'>): void {
        if (!this.isActive()) return;
        const now = performance.now();
        if (now - this.lastPoseSend < 80) return; // ~12 Hz
        this.lastPoseSend = now;
        this.broadcast({
            type: 'pose',
            pose: { ...pose, name: this.localName, t: now },
        });
    }

    sendAction(action: 'collect' | 'clean' | 'net' | 'boost'): void {
        if (!this.isActive()) return;
        this.broadcast({ type: 'action', action });
    }

    sendAlert(title: string, body: string): void {
        if (!this.isActive()) return;
        this.broadcast({ type: 'alert', title, body });
    }
}

let _buddy: BuddySession | null = null;
export function getBuddySession(): BuddySession {
    if (!_buddy) _buddy = new BuddySession();
    return _buddy;
}
