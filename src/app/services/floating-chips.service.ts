import {ElementRef, Injectable} from '@angular/core';
import {fromEvent, map} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class FloatingChipsService {

    private chips: ElementRef<HTMLElement>[] = [];

    get topPosition(): number {
        return (this.chips[0].nativeElement.getBoundingClientRect().y??0) + window.scrollY;
    }

    constructor() {
        fromEvent(window, 'scroll')
            .pipe(
                map(() => {
                        return this.chips.map((chipEl => chipEl.nativeElement.getBoundingClientRect().y))
                    }
                ),
                map(positions => {
                    const startPosition = positions[0]+window.scrollY;
                    const greatDistanceIndex = positions.findIndex(value=> value > startPosition);
                    if (greatDistanceIndex === -1){
                        return {
                            index: positions.length - 1,
                            distance: positions[positions.length - 1],
                            start: startPosition
                        };
                    }else{
                        return {
                            index: greatDistanceIndex,
                            distance: positions[greatDistanceIndex],
                            start: startPosition
                        }
                    }
                })
            )
            .subscribe(positions => {
                if(positions === null) return;
                const {index, distance, start} = positions;
                if(index === 0) {
                    this.chips.forEach(({nativeElement})=>nativeElement.style.opacity = '1');
                    return;
                }
                // Берем предыдущий чипс
                const previousChip = this.chips[index - 1];
                if(!previousChip) return;
                // Получаем высоту предыдущего чипса
                const previousChipHeight = previousChip.nativeElement.offsetHeight;
                // Получаем процентное соотношение позиции текущего чипса минус start к двойной высоте предыдущего чипса
                let relativePosition = (distance - start) / (previousChipHeight*3);
                // Если соотношение больше 1 то устанавливаем 1
                if (relativePosition > 1) relativePosition = 1;
                this.chips.forEach(({nativeElement},i)=> {
                    if(i < index-1){
                        nativeElement.style.opacity = '0';
                    }else if(i === index-1){
                        // Устанавливаем соотношение как opacity на предыдущем чипсе
                        nativeElement.style.opacity = relativePosition.toString();
                    }else{
                        nativeElement.style.opacity = '1'
                    }
                });
            });
    }

    add(chip: ElementRef<HTMLElement>) {
        this.chips.push(chip);
        setTimeout(()=>{
            window.dispatchEvent(new Event('scroll'));
        })
    }

    remove(removedChip: ElementRef<HTMLElement>) {
        // Ищем индекс удаляемого чипса
        const removedIndex = this.chips.findIndex(chip => chip === removedChip);
        if(removedIndex === -1) return;
        this.chips.splice(removedIndex, 1);
    }
}
