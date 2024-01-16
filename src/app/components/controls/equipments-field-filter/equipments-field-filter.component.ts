import {Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {debounceTime, map, mergeMap, Subject, Subscription} from "rxjs";
import {ApiService} from "../../../services/api.service";
import {ClientEquipment} from "../../../types/transport-interfaces";

@Component({
  selector: 'app-equipments-field-filter',
  templateUrl: './equipments-field-filter.component.html',
  styleUrls: ['./equipments-field-filter.component.scss'],
  providers:[
    {provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(()=>EquipmentsFieldFilterComponent)}
  ]
})
export class EquipmentsFieldFilterComponent implements OnInit, ControlValueAccessor, OnDestroy {

  control = new FormControl<{ label: string, value: string }[]>([]);
  changeValueSubscription?: Subscription;

  clientEquipmentSuggestion = new Subject<string>();

  clientEquipments$ = this.clientEquipmentSuggestion.pipe(
      debounceTime(500),
      mergeMap(query => query ? this.api.getClientEquipmentsSuggestions(query) : this.api.getClientEquipmentsSuggestions())
  );
  @Input() isDisabled = false;
  @Output() changeIsDisabled = new EventEmitter<boolean>();

  @Output() onBlur = new EventEmitter();

  constructor(private api: ApiService) { }

  onChange = (val: any) => {

  }

  onTouched = () => {

  }

  ngOnInit(): void {
    this.changeValueSubscription = this.control.valueChanges
        .pipe(
            map(arr =>
                arr ? arr.map(equip => ({equipmentRealization: parseInt(equip.value)})) : []
            )
        )
        .subscribe(val => this.onChange(val));
  }

  ngOnDestroy(): void {
    this.changeValueSubscription?.unsubscribe();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  writeValue(obj: any): void {
    this.api.getClientEquipmentsSuggestions()
        .pipe(
            map(arr => {
              return obj ? obj.map((v: any) => {
                return arr.find(av => parseInt(av.value) === v.equipmentRealization)
              }).filter((v:any)=>v !== undefined) : [];
            })
        )
        .subscribe((val: any) => {
          this.control.setValue(val);
        })
  }

}
