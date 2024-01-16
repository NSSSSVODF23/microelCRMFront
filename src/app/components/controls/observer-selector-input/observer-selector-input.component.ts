import {Component, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {DefaultObservers} from "../../../types/transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-observer-selector-input',
  templateUrl: './observer-selector-input.component.html',
  styleUrls: ['./observer-selector-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ObserverSelectorInputComponent,
      multi: true
    }
  ]
})
export class ObserverSelectorInputComponent implements OnInit, OnDestroy, ControlValueAccessor {

  control = new FormControl<DefaultObservers[]>([]);

  suggestions: DefaultObservers[] = [];

  subscription?: Subscription;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.subscription = this.control.valueChanges.subscribe(observers => {
        this.onChange(observers ?? []);
    })
  }

  search(event: any) {
    this.api.getAvailableObserversSuggestions(event.query).subscribe(observers => {
      this.suggestions = observers;
    })
  }

  onChange = (objs: DefaultObservers[]) => {

  }

  onTouched = () => {

  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  setDisabledState(isDisabled: boolean) {
    if(isDisabled){
      this.control.disable({ emitEvent: false });
    }else{
      this.control.enable({ emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn
  }

  writeValue(obj: any): void {
    this.control.setValue(obj);
  }
}
