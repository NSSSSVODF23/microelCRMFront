import { Pipe, PipeTransform } from '@angular/core';
import {ModelItem} from "../types/transport-interfaces";
import {Utils} from "../util";

@Pipe({
  name: 'modelItemValue'
})
export class ModelItemValuePipe implements PipeTransform {

  transform(value: ModelItem, ...args: unknown[]): unknown {
    return Utils.getValueFromModelItem(value);
  }

}
