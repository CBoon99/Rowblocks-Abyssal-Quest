/**
 * Ocean-themed discovery toast — top-center, kid-friendly, auto-dismiss.
 * Queues multiple discoveries so they show one after another.
 *
 * API:
 *   DiscoveryToast.show(text, { icon?, subtitle?, durationMs? })
 *   DiscoveryToast.clear()
 */

export interface DiscoveryToastOptions {
    icon?: string;
    subtitle?: string;
    durationMs?: number;
}

interface QueuedToast {
    text: string;
    icon: string;
    subtitle?: string;
    durationMs: number;
}

const DEFAULT_DURATION_MS = 3200;
const EXIT_ANIM_MS = 320;

export class DiscoveryToast {
    private static queue: QueuedToast[] = [];
    private static showing = false;
    private static el: HTMLElement | null = null;
    private static hideTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * Show a discovery toast. If one is already visible, enqueue.
     */
    static show(text: string, opts?: DiscoveryToastOptions): void {
        const entry: QueuedToast = {
            text: text || 'New discovery!',
            icon: opts?.icon ?? '✨',
            subtitle: opts?.subtitle,
            durationMs: opts?.durationMs ?? DEFAULT_DURATION_MS,
        };
        DiscoveryToast.queue.push(entry);
        if (!DiscoveryToast.showing) {
            DiscoveryToast.pump();
        }
    }

    /** Clear queue and hide current toast immediately. */
    static clear(): void {
        DiscoveryToast.queue = [];
        if (DiscoveryToast.hideTimer) {
            clearTimeout(DiscoveryToast.hideTimer);
            DiscoveryToast.hideTimer = null;
        }
        DiscoveryToast.removeEl(false);
        DiscoveryToast.showing = false;
    }

    private static pump(): void {
        const next = DiscoveryToast.queue.shift();
        if (!next) {
            DiscoveryToast.showing = false;
            return;
        }
        DiscoveryToast.showing = true;
        DiscoveryToast.render(next);

        DiscoveryToast.hideTimer = setTimeout(() => {
            DiscoveryToast.hideTimer = null;
            DiscoveryToast.removeEl(true, () => {
                DiscoveryToast.pump();
            });
        }, next.durationMs);
    }

    private static render(item: QueuedToast): void {
        DiscoveryToast.removeEl(false);

        const el = document.createElement('div');
        el.className = 'discovery-toast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.innerHTML = `
            <div class="discovery-toast-inner">
                <div class="discovery-toast-icon" aria-hidden="true">${item.icon}</div>
                <div class="discovery-toast-body">
                    <div class="discovery-toast-title">${DiscoveryToast.escape(item.text)}</div>
                    ${
                        item.subtitle
                            ? `<div class="discovery-toast-subtitle">${DiscoveryToast.escape(item.subtitle)}</div>`
                            : ''
                    }
                </div>
                <div class="discovery-toast-wave" aria-hidden="true"></div>
            </div>
        `;

        document.body.appendChild(el);
        DiscoveryToast.el = el;

        // Enter animation
        requestAnimationFrame(() => {
            el.classList.add('discovery-toast--visible');
        });
    }

    private static removeEl(animate: boolean, onDone?: () => void): void {
        const el = DiscoveryToast.el;
        DiscoveryToast.el = null;
        if (!el) {
            onDone?.();
            return;
        }
        if (!animate) {
            el.remove();
            onDone?.();
            return;
        }
        el.classList.remove('discovery-toast--visible');
        el.classList.add('discovery-toast--exit');
        setTimeout(() => {
            el.remove();
            onDone?.();
        }, EXIT_ANIM_MS);
    }

    private static escape(s: string): string {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

export default DiscoveryToast;
