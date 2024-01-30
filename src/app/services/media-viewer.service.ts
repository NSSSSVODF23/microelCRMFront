import {EventEmitter, Injectable, Output} from '@angular/core';
import {Attachment, TFile, WorkLogTargetFile} from "../types/transport-interfaces";
import {Subject} from "rxjs";

export interface AttachmentAlbum{
  index: number;
  album: Attachment[];
}

@Injectable({
  providedIn: 'root'
})
export class MediaViewerService {

  private mediaEmitter$: Subject<Attachment|TFile|WorkLogTargetFile> = new Subject();
  private mediaAlbumEmitter$: Subject<AttachmentAlbum> = new Subject();

  constructor() { }

  showMedia(media: Attachment|TFile|WorkLogTargetFile){
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
