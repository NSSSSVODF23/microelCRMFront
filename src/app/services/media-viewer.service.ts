import {EventEmitter, Injectable, Output} from '@angular/core';
import {Attachment} from "../transport-interfaces";
import {Subject} from "rxjs";

export interface AttachmentAlbum{
  index: number;
  album: Attachment[];
}

@Injectable({
  providedIn: 'root'
})
export class MediaViewerService {

  private mediaEmitter$: Subject<Attachment> = new Subject();
  private mediaAlbumEmitter$: Subject<AttachmentAlbum> = new Subject();

  constructor() { }

  showMedia(media: Attachment){
    this.mediaEmitter$.next(media);
  }

  showMediaAlbum(index: number, album: Attachment[]){
    this.mediaAlbumEmitter$.next({index,album});
  }

  media(){
    return this.mediaEmitter$.pipe();
  }

  mediaAlbum(){
    return this.mediaAlbumEmitter$.pipe();
  }
}
