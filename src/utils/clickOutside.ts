import type { Directive } from 'vue';

interface ElWithHandler extends HTMLElement {
    __clickOutsideHandler__?: (e: Event) => void;
}

export const clickOutside: Directive = {
    mounted(el: ElWithHandler, binding) {
        el.__clickOutsideHandler__ = (event: Event) => {
            if (!el.contains(event.target as Node)) {
                if (typeof binding.value === 'function') {
                    binding.value(event);
                }
            }
        };
        document.addEventListener('mousedown', el.__clickOutsideHandler__);
        document.addEventListener('touchstart', el.__clickOutsideHandler__);
    },
    unmounted(el: ElWithHandler) {
        document.removeEventListener('mousedown', el.__clickOutsideHandler__!);
        document.removeEventListener('touchstart', el.__clickOutsideHandler__!);
    }
};

export default clickOutside;
