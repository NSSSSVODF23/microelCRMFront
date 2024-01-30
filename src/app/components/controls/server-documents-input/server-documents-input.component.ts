import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {BehaviorSubject, debounceTime, filter, map, shareReplay, Subject, Subscription, switchMap, tap} from "rxjs";
import {FileData, FileSuggestion} from "../../../types/transport-interfaces";
import {OverlayPanel} from "primeng/overlaypanel";
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
    selector: 'app-server-documents-input',
    templateUrl: './server-documents-input.component.html',
    styleUrls: ['./server-documents-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: ServerDocumentsInputComponent,
            multi: true
        }
    ]
})
export class ServerDocumentsInputComponent implements OnInit, OnDestroy, ControlValueAccessor {

    control = new FormControl<FileSuggestion[]>([]);
    controlChange$ = this.control.valueChanges;
    controlChangeSubscription?: Subscription;

    onChange = (files: FileSuggestion[]) => {
    }

    onTouched = () => {
    }

    isDisabled = false;

    querySubject = new Subject<string>();
    queryChange$ = this.querySubject.pipe(debounceTime(1000));
    suggestions$ = this.queryChange$
        .pipe(switchMap((query) => this.api.getFilesSuggestions(query)), shareReplay(1));

    previewVisibleSubject = new BehaviorSubject<Event | null>(null);
    previewVisible$ = this.previewVisibleSubject.pipe(debounceTime(300));

    previewUrl = '';

    previewSubscription?:Subscription;

    @ViewChild('photoPreviewPanel') photoPreviewPanel!: OverlayPanel;
    imageLoaded = false;

    constructor(private api: ApiService) {
    }

    writeValue(obj?: FileSuggestion[] | null): void {
        if(obj)
            this.control.setValue(obj);
        else
            this.control.setValue([]);
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    ngOnInit(): void {
        this.previewSubscription = this.previewVisible$.subscribe(event => {
            if(event)
                if(this.photoPreviewPanel.overlayVisible){
                    this.photoPreviewPanel.target = event.target;
                    this.photoPreviewPanel.align();
                }else{
                    this.photoPreviewPanel.show(event);
                }
            else
                this.photoPreviewPanel.hide();
        })

        this.controlChangeSubscription = this.controlChange$.subscribe(event=>{
            this.onChange(event ?? []);
        })
    }

    ngOnDestroy() {
        this.previewSubscription?.unsubscribe();
        this.controlChangeSubscription?.unsubscribe();
    }

    preview(file: FileSuggestion, event: any) {
        if(file.type === 'PHOTO') {
            this.previewUrl = '/api/private/file-thumbnail/' + file.id;
            this.imageLoaded = false;
            this.previewVisibleSubject.next(event);
        } else {
            this.previewUrl = '';
            this.imageLoaded = false;
            this.previewVisibleSubject.next(null);
        }
    }

    hidePreview() {
        this.previewUrl = '';
        this.imageLoaded = false;
        this.previewVisibleSubject.next(null);
    }
}
