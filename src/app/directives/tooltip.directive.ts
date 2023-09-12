import {Directive, ElementRef, HostListener} from '@angular/core';

@Directive({
    selector: '[appTooltip]'
})
export class TooltipDirective {
    tooltip = document.createElement('div');

    constructor(private el: ElementRef<HTMLElement>) {
    }

    @HostListener('mouseenter') onmouseenter() {
        const el = this.el.nativeElement;
        const elBbox = el.getBoundingClientRect();
        if (el.offsetHeight >= el.scrollHeight) return;
        this.tooltip.innerText = el.innerText;
        const computedStyle = window.getComputedStyle(el);
        this.tooltip.style.fontSize = computedStyle.fontSize;
        this.tooltip.style.fontFamily = computedStyle.fontFamily;
        this.tooltip.style.fontWeight = computedStyle.fontWeight;
        this.tooltip.style.fontStyle = computedStyle.fontStyle;
        this.tooltip.style.padding = computedStyle.padding;
        this.tooltip.style.lineHeight = computedStyle.lineHeight;
        this.tooltip.style.letterSpacing = computedStyle.letterSpacing;
        this.tooltip.style.color = computedStyle.color;
        this.tooltip.className = 'p-3 panel absolute pointer-events-none';
        document.body.appendChild(this.tooltip);
        this.tooltip.style.left = `${elBbox.left - 13}px`;
        this.tooltip.style.width = `${elBbox.width + 26}px`;
        const topPos = elBbox.top + window.scrollY - 13;
        this.tooltip.style.top = `${topPos}px`;
        setTimeout(() => {
            const bottomLine = this.tooltip.getBoundingClientRect().bottom + document.documentElement.scrollTop;
            const bottomScroll = document.documentElement.scrollTop + window.innerHeight;
            let diff = bottomLine - bottomScroll;
            if (diff < 0) {
                diff = 0;
            }
            this.tooltip.style.top = `${topPos - diff}px`;
        })
    }

    @HostListener('mouseleave') onmouseleave() {
        try {
            document.body.removeChild(this.tooltip);
        } catch (e) {
        }
    }
}
