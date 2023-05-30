import {Component, EventEmitter, HostListener, OnInit, Output, ViewChild} from '@angular/core';
import {Overlay} from "primeng/overlay";

export interface ContextButton {
    label: string;
    icon: string;
    disabled?: boolean;
    style?: ContextButtonStyle;
    command: () => void;
}

export enum ContextButtonStyle{
    DANGER = 'danger',
}

@Component({
    selector: 'app-context-menu',
    templateUrl: './context-menu.component.html',
    styleUrls: ['./context-menu.component.scss']
})
export class ContextMenuComponent implements OnInit {
    contextMenuVisible = false;
    contextButtons: ContextButton[] = [];
    @ViewChild('contextMenu') contextMenu?: Overlay;
    @Output() onShow = new EventEmitter();
    @Output() onHide = new EventEmitter();

    constructor() {
    }

    ngOnInit(): void {
    }

    show(event: MouseEvent, buttons: ContextButton[]) {
        if (!this.contextMenu) return;
        event.preventDefault();
        this.contextButtons = buttons;
        this.contextMenu.target = event.target;
        if (this.contextMenuVisible) {
            this.contextMenu.alignOverlay();
        } else {
            setTimeout(() => {
                if (!this.contextMenu) return;
                this.contextMenu.show();
            })
        }
    }

    @HostListener('window:scroll', ['$event']) onScrollEvent(event: any) {
        if (!this.contextMenu) return;
        if (this.contextMenu.visible) {
            this.contextMenu.alignOverlay();
        }
    }

}
