import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Attachment, AttachmentType} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {MediaViewerService} from "../../../services/media-viewer.service";

@Component({
    selector: 'app-attachments-history-dialog',
    templateUrl: './attachments-history-dialog.component.html',
    styleUrls: ['./attachments-history-dialog.component.scss']
})
export class AttachmentsHistoryDialogComponent implements OnInit {

    @Input() taskId?: number;
    @Input() show = false;
    @Output() showChange = new EventEmitter<boolean>();

    baseUrl = '/api/private/attachment/'
    images: Attachment[] = [];
    videos: Attachment[] = [];
    audios: Attachment[] = [];
    documents: Attachment[] = [];
    files: Attachment[] = [];

    constructor(readonly api: ApiService, readonly viewerService: MediaViewerService) {
    }

    ngOnInit(): void {
        this.clearAllAttachments();
        if (this.taskId)
            this.api.getAllTaskAttachments(this.taskId).subscribe(attachments => {
                for (const attachment of attachments) {
                    switch (attachment.type) {
                        case AttachmentType.PHOTO:
                            this.images.push(attachment);
                            break;
                        case AttachmentType.VIDEO:
                            this.videos.push(attachment)
                            break;
                        case AttachmentType.AUDIO:
                            this.audios.push(attachment)
                            break;
                        case AttachmentType.DOCUMENT:
                            this.documents.push(attachment)
                            break;
                        case AttachmentType.FILE:
                            this.files.push(attachment)
                            break;
                    }
                }
            })
    }

    private clearAllAttachments() {
        this.images = [];
        this.videos = [];
        this.audios = [];
        this.documents = [];
        this.files = [];
    }

}
