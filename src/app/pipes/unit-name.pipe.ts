import { Pipe, PipeTransform } from '@angular/core';
import {PaidActionUnit} from "../transport-interfaces";

@Pipe({
  name: 'unitName'
})
export class UnitNamePipe implements PipeTransform {

  transform(value: any): string {
    switch (value) {
      case PaidActionUnit.AMOUNT:
        return 'шт.';
      case PaidActionUnit.METRES:
        return 'м.';
      case PaidActionUnit.KILOGRAMS:
        return 'кг.';
    }
    return '';
  }

}
