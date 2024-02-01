import {Injectable} from '@angular/core';

type Align =  'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type BlockZIndex = {
    zIndex?: number;
    pos?: Align;
}

export type BlockMessage = {
    message?: string;
    styleClass?: string;
}

export type BlockIcon = {
    icon?: string;
}

@Injectable({
    providedIn: 'root'
})
export class BlockUiService {

    blocked = false;
    message = '';
    isWait = false;
    icon = '';
    styleClass = '';
    zIndex = 0;
    private pos: Align = 'center';

    constructor() {
    }

    get align() {
        switch (this.pos) {
            case "center":
                return "center";
            case "top":
                return "flex-start";
            case "bottom":
                return "flex-end";
            case "left":
                return "center";
            case "right":
                return "center";
            case "top-left":
                return "flex-start";
            case "top-right":
                return "flex-start";
            case "bottom-left":
                return "flex-end";
            case "bottom-right":
                return "flex-end";
        }
    }

    get justify() {
        switch (this.pos) {
            case "center":
                return "center";
            case "top":
                return "center";
            case "bottom":
                return "center";
            case "left":
                return "flex-start";
            case "right":
                return "flex-end";
            case "top-left":
                return "flex-start";
            case "top-right":
                return "flex-end";
            case "bottom-left":
                return "flex-start";
            case "bottom-right":
                return "flex-end";
        }
    }

    wait(options?: BlockMessage & BlockZIndex) {
        this.blocked = true;
        this.isWait = true;
        this.message = options?.message ?? '';
        this.styleClass = options?.styleClass ?? '';
        this.zIndex = options?.zIndex ?? 0;
        this.icon = '';
        this.pos = options?.pos ?? 'center';
    }

    block(options?: BlockMessage & BlockZIndex & BlockIcon) {
        this.blocked = true;
        this.isWait = false;
        this.message = options?.message ?? '';
        this.styleClass = options?.styleClass ?? '';
        this.zIndex = options?.zIndex ?? 0;
        this.icon = options?.icon ?? '';
        this.pos = options?.pos ?? 'center';
    }

    unblock() {
        this.blocked = false;
    }

}
