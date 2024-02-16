import {Component, Input, OnInit} from '@angular/core';
import {AttachmentType} from "../../../types/transport-interfaces";
import {OnChangeObservable} from "../../../decorators";
import {map, ReplaySubject, tap} from "rxjs";

type Data = { type: AttachmentType, id: number };

@Component({
    selector: 'app-thumbnail-preview',
    templateUrl: './thumbnail-preview.component.html',
    styleUrls: ['./thumbnail-preview.component.scss']
})
export class ThumbnailPreviewComponent implements OnInit {

    AttachmentType = AttachmentType;

    @Input() data?: Data;

    @OnChangeObservable('data')
    dataChange$ = new ReplaySubject<Data>(1);

    fileId$ = this.dataChange$
        .pipe(
            tap(()=>this.thumbnailLoad = false),
            map(data => data.id)
        )

    fileType$ = this.dataChange$
        .pipe(
            map(data => data.type)
        )

    thumbnailLoad = false;

    constructor() {
    }

    ngOnInit(): void {
    }

}
