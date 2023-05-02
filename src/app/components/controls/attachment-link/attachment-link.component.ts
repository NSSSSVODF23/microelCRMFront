import {Component, Input, OnInit} from '@angular/core';
import {Attachment} from "../../../transport-interfaces";
import {MediaViewerService} from "../../../services/media-viewer.service";

@Component({
    selector: 'app-attachment-link',
    templateUrl: './attachment-link.component.html',
    styleUrls: ['./attachment-link.component.scss']
})
export class AttachmentLinkComponent implements OnInit {

    @Input() attachment?: Attachment;
    hovered: boolean = false;
    previewLoading = false;

    constructor(readonly mediaViewer: MediaViewerService) {
    }

    ngOnInit(): void {
    }

    attachmentIconName() {
        switch (this.attachment?.type) {
            case 'PHOTO':
                return 'image'
            case 'VIDEO':
                return 'movie'
            case 'AUDIO':
                return 'music_note'
            case 'DOCUMENT':
                return 'picture_as_pdf'
            case 'FILE':
                return 'description'
            default:
                return 'question_mark'
        }
    }

    url() {
        if (this.attachment?.type == 'FILE') {
            return '/api/private/attachment/'
        }
        return "";
    }

    download() {
        if (this.attachment?.type == 'FILE') {
            return this.attachment.name;
        }
        return "";
    }

    attachmentOpen() {
        switch (this.attachment?.type) {
            case 'PHOTO':
                this.mediaViewer.showMedia(this.attachment);
                break;
            case 'VIDEO':
                this.mediaViewer.showMedia(this.attachment);
                break;
            case 'AUDIO':
                this.mediaViewer.showMedia(this.attachment);
                break;
            case 'DOCUMENT':
                window.open('/api/private/attachment/' + this.attachment.name, '_blank')
                break;
            case 'FILE':
            default:
                break;
        }
        this.hovered = false;
        this.previewLoading = false;
    }
}
