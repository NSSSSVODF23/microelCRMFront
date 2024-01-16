import {Component, Input, OnInit} from '@angular/core';
import {Attachment, AttachmentType} from "../../../types/transport-interfaces";
import {Router} from "@angular/router";

@Component({
    selector: 'app-file-attachment',
    templateUrl: './file-attachment.component.html',
    styleUrls: ['./file-attachment.component.scss']
})
export class FileAttachmentComponent implements OnInit {

    @Input() attachment?: Attachment;
    private baseUrl = '/api/private/attachment/'

    constructor(readonly router: Router) {
    }

    get hasAttachment(): boolean {
        return !!this.attachment;
    }

    get attachmentType(): string {
        return this.attachment?.type ?? "unknown";
    }

    get name(): string {
        return this.attachment?.name ?? "Не загружен";
    }

    get size(): string {
        if(this.attachment && this.attachment.size){
            // Если больше мегабайта вывести значение в мегабайтах если больше килобайта вывести значение в килобайтах если меньше выводить значение в байтах
            if(this.attachment.size > 1000000){
                return (this.attachment.size / 1000000).toFixed(2) + " MByte"
            }else if( this.attachment.size > 1000){
                return (this.attachment.size / 1000).toFixed(2) + " KByte"
            }else{
                return this.attachment.size + " byte"
            }
        }
        return "-- byte"
    }

    ngOnInit(): void {
    }

    open(event: MouseEvent) {
        if(this.attachment){
            window.open(this.baseUrl+this.attachment.name, '_blank');
        }
    }
}
