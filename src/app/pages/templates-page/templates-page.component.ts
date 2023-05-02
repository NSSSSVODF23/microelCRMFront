import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {TaskTag, Wireframe} from "../../transport-interfaces";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {SubscriptionsHolder} from "../../util";
import {ConfirmationService} from "primeng/api";

@Component({
    templateUrl: './templates-page.component.html',
    styleUrls: ['./templates-page.component.scss']
})
export class TemplatesPageComponent implements OnInit, OnDestroy {
    templateItems: Wireframe[] = [];
    availableTags: TaskTag[] = [];
    showCreateTagDialog = false;
    tagNameToCreate: string = '';
    tagColorToCreate: string = '';
    isTagCreating = false;
    subscription: SubscriptionsHolder = new SubscriptionsHolder();

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService, readonly confirmation: ConfirmationService) {
    }

    ngOnInit(): void {
        this.api.getWireframes().subscribe((response: any) => this.templateItems = response);
        this.api.getTaskTags().subscribe((response) => {
            this.availableTags = response;
            this.subscription.addSubscription('crTag', this.rt.taskTagCreated().subscribe(this.tagCreated.bind(this)));
            this.subscription.addSubscription('updTag', this.rt.taskTagUpdated().subscribe(this.tagUpdated.bind(this)));
            this.subscription.addSubscription('delTag', this.rt.taskTagDeleted().subscribe(this.tagDeleted.bind(this)));
        });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribeAll();
    }

    tagCreated(tag: TaskTag) {
        if (!this.availableTags.some(item => item.taskTagId === tag.taskTagId)) {
            this.availableTags.unshift(tag);
        }
    }

    tagUpdated(tag: TaskTag) {
        const index = this.availableTags.findIndex(item => item.taskTagId === tag.taskTagId);
        if (index >= 0) this.availableTags[index] = tag;
    }

    tagDeleted(tag: TaskTag) {
        const index = this.availableTags.findIndex(item => item.taskTagId === tag.taskTagId);
        if (index >= 0) this.availableTags.splice(index, 1);
    }

    createTag() {
        this.isTagCreating = true;
        this.api.createTaskTag({
            taskTagId: 0,
            deleted: false,
            name: this.tagNameToCreate,
            color: this.tagColorToCreate
        }).subscribe({
            next: () => {
                this.isTagCreating = false;
                this.showCreateTagDialog = false;
            },
            error: () => {
                this.isTagCreating = false;
            }
        })
    }

    openCreateTagDialog() {
        // Cleaning up old values
        this.tagNameToCreate = '';
        this.tagColorToCreate = this.generateRandomHslColor();
        // Opening dialog
        this.showCreateTagDialog = true;
    }

    confirmDeleteWireframe(event: Event, wireframeId: number) {
        event.stopPropagation();
        this.confirmation.confirm({
            header: "Подтверждение",
            message: "Удалить шаблон?",
            accept: () => this.api.deleteWireframe(wireframeId).subscribe()
        })
    }

    // Private methods to convert hsl color value to hex color value
    private hslToHex(h: number, s: number, l: number): string {
        h /= 360;
        s /= 100;
        l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        const toHex = (x: number) => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Private methods to generate random hsl color, with limits
    private generateRandomHslColor(minSaturation = 50, maxSaturation = 60, minLightness = 50, maxLightness = 60) {
        // Get random hue
        let hue = Math.floor(Math.random() * 360);
        // Get random saturation
        let saturation = Math.floor(Math.random() * (maxSaturation - minSaturation) + minSaturation);
        // Get random lightness
        let lightness = Math.floor(Math.random() * (maxLightness - minLightness) + minLightness);

        // Convert to hex value
        return this.hslToHex(hue, saturation, lightness);
    }
}
