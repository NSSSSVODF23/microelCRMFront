import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR} from "@angular/forms";
import {BindingsCollection} from "../../../types/parsing-interfaces";
import {ApiService} from "../../../services/api.service";
import {FieldItem, Wireframe} from "../../../types/transport-interfaces";
import {map, Subscription, tap} from "rxjs";

@Component({
    selector: 'app-tracker-bindings-input',
    templateUrl: './tracker-bindings-input.component.html',
    styleUrls: ['./tracker-bindings-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TrackerBindingsInputComponent),
            multi: true
        }
    ]
})
export class TrackerBindingsInputComponent implements OnInit, ControlValueAccessor, OnDestroy {

    controls: { name: string, fields: string[] }[] = [
        {
            name: 'accident',
            fields: [
                'description',
                'address',
                'login',
                'phone',
                'workReport'
            ]
        },
        {
            name: 'connection',
            fields: [
                'address',
                'login',
                'phone',
                'advertisingSource',
                'fullName',
                'password',
                'takenFrom',
                'techInfo',
                'type'
            ]
        },
        {
            name: 'privateSectorRM',
            fields: [
                'address',
                'advertisingSource',
                'name',
                'phone',
                'gardening'
            ]
        },
        {
            name: 'privateSectorVD',
            fields: [
                'name',
                'address',
                'advertisingSource',
                'phone',
                'district'
            ]
        }
    ];

    selectionBindsMap: { [key: string]: { binds: string[], wireframe: Wireframe } } = {};

    templatesBindingsMap: { [key: string]: Wireframe } = {};
    templates$ = this.api.getWireframes();

    templateLinkToBindsForm = new FormGroup({
        accident: new FormControl<Wireframe | null>(null),
        connection: new FormControl<Wireframe | null>(null),
        privateSectorRM: new FormControl<Wireframe | null>(null),
        privateSectorVD: new FormControl<Wireframe | null>(null)
    });

    bindingsForm = new FormGroup({
        accident: new FormGroup({
            description: new FormControl(''),
            address: new FormControl(''),
            login: new FormControl(''),
            phone: new FormControl(''),
            workReport: new FormControl(''),
            wireframe: new FormControl<Wireframe|null>(null)
        }),
        connection: new FormGroup({
            address: new FormControl(''),
            login: new FormControl(''),
            phone: new FormControl(''),
            advertisingSource: new FormControl(''),
            fullName: new FormControl(''),
            password: new FormControl(''),
            takenFrom: new FormControl(''),
            techInfo: new FormControl(''),
            type: new FormControl(''),
            wireframe: new FormControl<Wireframe|null>(null)
        }),
        privateSectorRM: new FormGroup({
            address: new FormControl(''),
            advertisingSource: new FormControl(''),
            name: new FormControl(''),
            phone: new FormControl(''),
            gardening: new FormControl(''),
            wireframe: new FormControl<Wireframe|null>(null)
        }),
        privateSectorVD: new FormGroup({
            name: new FormControl(''),
            address: new FormControl(''),
            advertisingSource: new FormControl(''),
            phone: new FormControl(''),
            district: new FormControl(''),
            wireframe: new FormControl<Wireframe|null>(null)
        })
    });
    formSubscribtion?: Subscription;

    templateBinds$ = this.templateLinkToBindsForm.valueChanges.pipe(tap(value => {
        const bindings:any = {};
        Object.entries(value).forEach(entry=>{
            bindings[entry[0]] = {};
            bindings[entry[0]].wireframe = entry[1];
        })
        this.bindingsForm.patchValue(bindings);
    }), map(value => <any>({...value})))

    constructor(readonly api: ApiService) {

    }

    get setOfFieldsForSelectingTemplates() {
        return Object.keys(this.controls);
    }

    bindEntries(name: string) {
        const binds: any = this.controls;
        const keys = Object.keys(binds[name]);
        return keys;
    }

    fieldOfWireframe(wireframe: Wireframe) {
        if (!wireframe) return [];
        return wireframe.steps.reduce<FieldItem[]>((acc, cur) => {
            return acc.concat(cur.fields);
        }, [])
    }

    onChange = (value: any) => {
    };

    onTouched = () => {
    };

    bindMapTrack(index: number, entry: { key: string, value: { binds: string[], wireframe: Wireframe } }) {
        return entry.key;
    };

    ngOnInit(): void {
        this.bindingsForm.valueChanges.subscribe(value => {
            this.onChange(value);
        })
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    writeValue(obj: BindingsCollection): void {
        if (obj) this.bindingsForm.patchValue(obj);
    }

    changeTemplateSelection(bindName: string, event: any) {
        this.selectionBindsMap[bindName] = {
            binds: this.bindEntries(bindName),
            wireframe: event.value
        }
    }

    ngOnDestroy(): void {
        this.formSubscribtion?.unsubscribe();
    }
}
