import { Pipe, PipeTransform } from '@angular/core';
import {Utils} from "../util";

@Pipe({
  name: 'decline'
})
export class DeclinePipe implements PipeTransform {

  transform(value: number, oneSuffix: string, twoSuffix: string, tenSuffix: string): unknown {
    return Utils.declineOfNumber(value, [oneSuffix, twoSuffix, tenSuffix]);
  }

}
