import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {ClientEquipment, LoadingState, TaskTag, Wireframe} from "../../types/transport-interfaces";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {DynamicValueFactory, SubscriptionsHolder} from "../../util";
import {ConfirmationService} from "primeng/api";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {combineLatest, debounceTime, map, merge, of, shareReplay, startWith, switchMap, tap} from "rxjs";
import { AccessFlag } from 'src/app/types/access-flag';
import {PersonalityService} from "../../services/personality.service";

@Component({
    templateUrl: './templates-page.component.html',
    styleUrls: ['./templates-page.component.scss']
})
export class TemplatesPageComponent implements OnInit {

    AccessFlag = AccessFlag;
    LoadingState = LoadingState;

    deletedTemplatesSwitcher = new FormControl(false);
    templatesFilters$ = combineLatest([this.deletedTemplatesSwitcher.valueChanges.pipe(startWith(false))]);

    templates$ = DynamicValueFactory.ofWithFilter(
        this.templatesFilters$,
        this.api.getWireframes.bind(this.api),
        'wireframeId',
        this.rt.wireframeCreated(),
        this.rt.wireframeUpdated(),
        this.rt.wireframeDeleted(),
    )

    templateItems: Wireframe[] = [];
    availableTags: TaskTag[] = [];

    createTagDialogVisible = false;
    editTagDialogVisible = false;
    tagDialogForm = new FormGroup({
        id: new FormControl<number | null | undefined>(null),
        name: new FormControl('', Validators.required),
        color: new FormControl('', Validators.required),
        unbindAfterClose: new FormControl(false)
    });
    isTagSaving = false;

    tagsNameQueryControl = new FormControl('');
    deletedTagsSwitcher = new FormControl(false);
    tagFilters$ = combineLatest(
        [
            this.tagsNameQueryControl.valueChanges.pipe(debounceTime(500), startWith('')),
            this.deletedTagsSwitcher.valueChanges.pipe(startWith(false))
        ]
    );
    tags$ = DynamicValueFactory.ofWithFilter(
        this.tagFilters$,
        this.api.getTaskTags.bind(this.api),
        'taskTagId',
        this.rt.taskTagCreated(),
        this.rt.taskTagUpdated(),
        this.rt.taskTagDeleted(),
    )

    equipmentsFilterForm = new FormGroup({
        query: new FormControl(''),
        isDeleted: new FormControl(false)
    });
    changeEquipmentFilters$ = this.equipmentsFilterForm.valueChanges
        .pipe(
            debounceTime(500),
            map(({query,isDeleted})=>[query, isDeleted]),
            shareReplay(1),
            startWith(['', false])
        );
    equipments$ = DynamicValueFactory.ofWithFilter(
        this.changeEquipmentFilters$,
        this.api.getClientEquipments.bind(this.api),
        'clientEquipmentId',
        this.rt.clientEquipmentsCreated(),
        this.rt.clientEquipmentsUpdated(),
        this.rt.clientEquipmentsDeleted()
    )
    showEquipmentDialog = false;
    isEquipmentCreating = false;
    editionEquipmentId?: number;

    equipmentForm = new FormGroup({
        name: new FormControl('', [Validators.required]),
        description: new FormControl(''),
        price: new FormControl(0, [Validators.required]),
    })

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService,
                readonly personality: PersonalityService, readonly confirmation: ConfirmationService) {
    }

    ngOnInit(): void {

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
        if (index >= 0) {
            if (tag.deleted && this.deletedTagsSwitcher.value) {
                this.availableTags[index].deleted = true;
                return;
            }
            this.availableTags.splice(index, 1)
        }
    }

    templateCreated(wireframe: Wireframe) {
        if (!this.templateItems.some(item => item.wireframeId === wireframe.wireframeId)) {
            this.templateItems.unshift(wireframe);
        }
    }

    templateUpdated(wireframe: Wireframe) {
        const index = this.templateItems.findIndex(item => item.wireframeId === wireframe.wireframeId);
        if (index >= 0) this.templateItems[index] = wireframe;
    }

    templateDeleted(wireframe: Wireframe) {
        const index = this.templateItems.findIndex(item => item.wireframeId === wireframe.wireframeId);
        if (index >= 0) {
            if (wireframe.deleted && this.deletedTemplatesSwitcher.value) {
                this.templateItems[index].deleted = true;
                return;
            }
            this.templateItems.splice(index, 1);
        }
    }

    createTag() {
        this.isTagSaving = true;
        this.api.createTaskTag(this.tagDialogForm.value).subscribe({
            next: () => {
                this.isTagSaving = false;
                this.createTagDialogVisible = false;
            },
            error: () => {
                this.isTagSaving = false;
            }
        })
    }

    editTag() {
        this.isTagSaving = true;
        this.api.modifyTaskTag(this.tagDialogForm.value).subscribe({
            next: () => {
                this.isTagSaving = false;
                this.editTagDialogVisible = false;
            },
            error: () => {
                this.isTagSaving = false;
            }
        })
    }

    openCreateTagDialog() {
        this.tagDialogForm.setValue({
            id: null,
            name: "",
            color: this.generateRandomHslColor(),
            unbindAfterClose: false
        })
        this.createTagDialogVisible = true;
        this.isTagSaving = false;
    }

    openEditTagDialog(tag: TaskTag) {
        this.tagDialogForm.setValue({
            id: tag.taskTagId,
            name: tag.name,
            color: tag.color,
            unbindAfterClose: tag.unbindAfterClose
        })
        this.editTagDialogVisible = true;
        this.isTagSaving = false;
    }

    confirmDeleteTag(event: any, tagId: any) {
        this.confirmation.confirm({
            header: "Подтверждение",
            message: "Удалить тег?",
            accept: () => this.api.deleteTaskTag(tagId).subscribe()
        })
    }

    openCreateEquipmentDialog() {
        this.equipmentForm.reset();
        this.showEquipmentDialog = true;
        this.editionEquipmentId = undefined;
    }

    openEditEquipmentDialog(equipment: ClientEquipment) {
        this.equipmentForm.patchValue(equipment);
        this.showEquipmentDialog = true;
        this.editionEquipmentId = equipment.clientEquipmentId;
    }

    confirmDeleteWireframe(event: Event, wireframeId: number) {
        event.stopPropagation();
        this.confirmation.confirm({
            header: "Подтверждение",
            message: "Удалить шаблон?",
            accept: () => this.api.deleteWireframe(wireframeId).subscribe()
        })
    }

    trackByTemplate(index: number, item: Wireframe) {
        return item.wireframeId + item.name + item.description;
    };

    trackByTag(index: number, item: TaskTag) {
        return item.taskTagId + item.name + item.color;
    }

    trackByClientEquipment(index: number, item: ClientEquipment) {
        return item.clientEquipmentId + item.name + item.description + item.price;
    };

    createEquipment() {
        this.isEquipmentCreating = true;
        this.api.createClientEquipment(this.equipmentForm.value).subscribe({
            next: () => {
                this.isEquipmentCreating = false;
                this.showEquipmentDialog = false;
            },
            error: () => {
                this.isEquipmentCreating = false;
            }
        })
    }

    editEquipment() {
        if (!this.editionEquipmentId) return;
        this.isEquipmentCreating = true;
        this.api.editClientEquipment(this.editionEquipmentId, this.equipmentForm.value).subscribe({
            next: () => {
                this.isEquipmentCreating = false;
                this.showEquipmentDialog = false;
            },
            error: () => {
                this.isEquipmentCreating = false;
            }
        })
    }

    confirmDeleteEquipment(event: MouseEvent, equipment: ClientEquipment) {
        event.stopPropagation();
        this.confirmation.confirm({
            header: "Подтверждение",
            message: "Удалить оборудование?",
            accept: () => this.api.deleteClientEquipment(equipment.clientEquipmentId).subscribe()
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
