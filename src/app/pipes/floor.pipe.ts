import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'floor'
})
export class FloorPipe implements PipeTransform {

    transform(value: string | number | null | undefined): unknown {
        if (value != null || value != undefined) {
            if (typeof value === 'string') return Math.floor(parseFloat(value));
            return Math.floor(value);
        }
        return null;
    }

}
