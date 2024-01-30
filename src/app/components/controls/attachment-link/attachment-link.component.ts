import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Attachment, WorkLogTargetFile} from "../../../types/transport-interfaces";
import {MediaViewerService} from "../../../services/media-viewer.service";
import {BehaviorSubject, debounceTime} from "rxjs";
import {SubscriptionsHolder} from "../../../util";
import {OverlayPanel} from "primeng/overlaypanel";

@Component({
    selector: 'app-attachment-link',
    templateUrl: './attachment-link.component.html',
    styleUrls: ['./attachment-link.component.scss']
})
export class AttachmentLinkComponent implements OnInit, OnDestroy {
    @Input() attachment?: Attachment | WorkLogTargetFile;
    // hovered: boolean = false;
    previewVisibleSubject = new BehaviorSubject<MouseEvent | null>(null);
    previewVisible$ = this.previewVisibleSubject.pipe(debounceTime(300));
    previewLoading = false;
    @ViewChild('overlayPanelEl') overlayPanelEl?: OverlayPanel;
    private subscriptions = new SubscriptionsHolder();
    get previewSrcUrl(){
        if(!this.attachment) return '';
        if('workLogTargetFileId' in this.attachment){
            return '/api/private/work-log/thumbnail/' + this.attachment.workLogTargetFileId;
        }else{
            return  '/api/private/thumbnail/'+ this.attachment.name
        }
    };

    constructor(readonly mediaViewer: MediaViewerService) {
    }

    ngOnInit(): void {
        this.subscriptions.addSubscription('previewVisible', this.previewVisible$.subscribe(event => {
            if(!event) {
                this.previewLoading = false;
                this.overlayPanelEl?.hide();
            }else{
                this.overlayPanelEl?.show(event);
            }
        }));
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribeAll();
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
            case 'VIDEO':
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
        // this.hovered = false;
        this.previewLoading = false;
    }

    showPreview(event: MouseEvent) {
        if(this.attachment?.type === 'PHOTO' || this.attachment?.type === 'VIDEO'){
            this.previewVisibleSubject.next(event);
        }
    }

    hidePreview() {
        this.previewVisibleSubject.next(null);
    }

    align(panel: OverlayPanel) {
        setTimeout(() => {
            if(panel.overlayVisible)
                panel.align();
        },100)
    }
}
