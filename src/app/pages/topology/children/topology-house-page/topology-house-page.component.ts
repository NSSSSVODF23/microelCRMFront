import {Component, OnInit} from '@angular/core';
import {AutoUnsubscribe, RouteParam} from "../../../../decorators";
import {map, ReplaySubject, shareReplay, switchMap, tap} from "rxjs";
import {ApiService} from "../../../../services/api.service";
import {ActivatedRoute} from "@angular/router";
import {LoadingState} from "../../../../types/transport-interfaces";
import {MediaViewerService} from "../../../../services/media-viewer.service";


@Component({
    templateUrl: './topology-house-page.component.html',
    styleUrls: ['./topology-house-page.component.scss']
})
@AutoUnsubscribe()
export class TopologyHousePage implements OnInit {

    LoadingState = LoadingState;

    houseLoadingState = LoadingState.LOADING;

    streetNameSchemesTranslation = new Map<string, string>([
        ["Академика Королева", "Королева"],
        ["Великой Победы", "БВП"],
        ["К.Маркса", "КМ"],
        ["Октябрьское", "Октябрьское шоссе"],
    ]);

    @RouteParam('id')
    buildIdParam$ = new ReplaySubject<string>(1);

    buildId$ = this.buildIdParam$.pipe(map(id => Number.parseInt(id)));

    building$ = this.buildId$
        .pipe(
            tap(() => this.houseLoadingState = LoadingState.LOADING),
            switchMap(id => this.api.getBuilding(id)),
            tap({
                next: () => this.houseLoadingState = LoadingState.READY,
                error: () => this.houseLoadingState = LoadingState.ERROR
            }),
            shareReplay(1)
        )

    files$ = this.building$
        .pipe(
            map(building => {
                let regExpStreetMatch = building.streetName.match(/([А-я\d \.]+), /);
                let regExpHouseMatch = building.houseNum.match(/(\d+)/);

                if (!regExpStreetMatch || !regExpStreetMatch[1])
                    return null;
                if (!regExpHouseMatch || !regExpHouseMatch[1])
                    return null;

                let streetName = regExpStreetMatch[1];
                let houseNum = regExpHouseMatch[1];

                if(this.streetNameSchemesTranslation.has(streetName))
                    streetName = this.streetNameSchemesTranslation.get(streetName) ?? '';

                console.log(streetName + ' ' + houseNum)

                return streetName + ' ' + houseNum;
            }),
            switchMap(name => this.api.getFilesSuggestions(name))
        )


    constructor(private api: ApiService, private route: ActivatedRoute, private fileViewer: MediaViewerService) {
    }

    ngOnInit(): void {
    }

    openFile(file: any) {
        switch (file.type) {
            case 'PHOTO':
            case 'VIDEO':
            case 'AUDIO':
                this.fileViewer.showMedia({fileSystemItemId: file.id, name: file.name, type: file.type})
                break;
            case 'DOCUMENT':
            case 'FILE':
                window.open('/api/private/file/' + file.id, '_blank')
                break;
            default:
                break;
        }
    }
}
