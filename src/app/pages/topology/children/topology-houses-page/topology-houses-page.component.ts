import {Component, OnInit} from '@angular/core';
import {ApiService} from "../../../../services/api.service";
import {map, mergeMap, Observable, ReplaySubject, shareReplay, startWith, tap} from "rxjs";
import {FromEvent} from "../../../../decorators";
import {TopologyStreet} from "../../../../types/transport-interfaces";
import {CharacterTranslator} from "../../../../character-translator";
import {topologyLoadingTemplate, Utils} from "../../../../util";

@Component({
    templateUrl: './topology-houses-page.component.html',
    styleUrls: ['./topology-houses-page.component.scss']
})
export class TopologyHousesPage implements OnInit {

    @FromEvent('searchInput', 'input')
    search$ = new ReplaySubject<Event>(1);
    searchQuery$ = this.search$.pipe(
        map(e => (e.target as HTMLInputElement).value),
        startWith("")
    );

    topology$: Observable<TopologyStreet[]> = this.api.getTopology()
        .pipe(
            shareReplay(1),
            mergeMap(topology => this.searchQuery$
                .pipe(
                    tap(()=>window.scrollTo(0, 0)),
                    map((query) => {
                        if (!query || (query = query.trim().toLowerCase()).length == 0)
                            return topology.map(street => {
                                street.highlighted = true;
                                street.houses.forEach(h => h.highlighted = true);
                                return street;
                            })

                        query = CharacterTranslator.translate(query);

                        const SPLIT_QUERY = query.split(' ');

                        const streets = topology.map(street => {
                            const HL_HOUSES = street.houses.filter(h => SPLIT_QUERY.some(q => h.houseNum.toLowerCase().includes(q)));
                            street.highlighted = (HL_HOUSES.length > 0 && SPLIT_QUERY.length === 1) || SPLIT_QUERY.some(q => street.streetName.toLowerCase().includes(q));
                            street.houses.forEach(h => h.highlighted = HL_HOUSES.some(hlh => hlh.buildingId === h.buildingId));
                            return street;
                        }).sort((a, b) => a.highlighted ? -1 : b.highlighted ? 1 : 0);

                        streets.filter(street=>street.highlighted && street.houses.every(h=>!h.highlighted)).forEach(street=>street.houses.forEach(h=>h.highlighted=true));

                        return streets;
                    })
                )
            )
        );

    topologyLoadingSkeleton = topologyLoadingTemplate

    constructor(private api: ApiService) {
    }

    ngOnInit(): void {
        // for (let i = 0; i < 20; i++) {
        //     this.topologyLoadingSkeleton.push({
        //         stWidth: Utils.getRandom(65,125),
        //         houses: new Array(Utils.getRandom(1,80)).fill(null)
        //     })
        // }
        // console.log(this.topologyLoadingSkeleton)
    }

}
