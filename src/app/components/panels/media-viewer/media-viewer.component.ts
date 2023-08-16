import {Component, OnInit} from '@angular/core';
import {MediaViewerService} from "../../../services/media-viewer.service";
import {Attachment} from "../../../transport-interfaces";
import {fade, fadeAlt, fadeFullAlt} from "../../../animations";

@Component({
    selector: 'app-media-viewer',
    templateUrl: './media-viewer.component.html',
    styleUrls: ['./media-viewer.component.scss'],
    animations: [fadeAlt, fadeFullAlt]
})
export class MediaViewerComponent implements OnInit {

    showFullscreen = false;
    media?: Attachment;
    albumIndex: number = 0;
    mediaAlbum?: Attachment[];
    showNavigation = 'fade';

    imageLoadingIndicator = true;

    constructor(readonly service: MediaViewerService) {
    }

    ngOnInit(): void {
        this.service.media().subscribe({
            next: value => {
                this.imageLoadingIndicator = true;
                this.showFullscreen = true;
                this.media = value;
                this.albumIndex = 0;
                this.mediaAlbum = undefined;
            }
        })
        this.service.mediaAlbum().subscribe({
            next: value => {
                this.imageLoadingIndicator = true;
                this.showFullscreen = true;
                this.albumIndex = value.index;
                this.mediaAlbum = value.album;
                this.media = this.mediaAlbum[this.albumIndex];
            }
        })
    }

    hide(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            this.showFullscreen = false;
        }
    }

    imageLoad(event: Event) {
        this.imageLoadingIndicator = false;
    }

    imageLoadError(event: ErrorEvent) {
    }

    goPrev() {
        if (this.mediaAlbum && this.mediaAlbum.length > 0) {
            if (this.albumIndex > 0) {
                this.media = this.mediaAlbum[--this.albumIndex]
            } else {
                this.albumIndex = this.mediaAlbum.length - 1;
                this.media = this.mediaAlbum[this.albumIndex];
            }
        }
    }

    goNext() {
        if (this.mediaAlbum && this.mediaAlbum.length > 0) {
            if (this.albumIndex < (this.mediaAlbum.length - 1)) {
                this.media = this.mediaAlbum[++this.albumIndex]
            } else {
                this.albumIndex = 0;
                this.media = this.mediaAlbum[this.albumIndex];
            }
        }
    }
}
