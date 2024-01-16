import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {MenuItem, MessageService} from "primeng/api";
import {FileData} from "../../../types/transport-interfaces";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";

const FILE_SIZE_LIMIT = 1048576 * 20;

@Component({
    selector: 'app-file-input',
    templateUrl: './file-input.component.html',
    styleUrls: ['./file-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: FileInputComponent,
            multi: true
        }
    ]
})
export class FileInputComponent implements OnInit, OnDestroy, ControlValueAccessor {

    @ViewChild("fileManager") fileManager!: ElementRef<HTMLInputElement>;
    @Input() files: FileData[] = [];
    @Input() short: boolean = false;
    @Output() filesChange: EventEmitter<FileData[]> = new EventEmitter();
    filesCatching: number = 0;
    filesLoaded: number = 0;
    loading: boolean = false;
    lastFileName?: string;
    @Input() disabled: boolean = false;
    menuItems: MenuItem[] = [
        {
            label: 'Изменить',
            icon: 'mdi-edit',
            command: this.openFileManager.bind(this)
        },
        {
            label: 'Отчистить',
            icon: 'mdi-highlight_off',
            command: this.clear.bind(this)
        }
    ];

    constructor(readonly toast: MessageService) {
    }

    get hasFiles() {
        return this.files.length > 0
    }

    get style() {
        if (this.short)
            return 'p-button-text p-button-icon p-button-rounded' + (this.hasFiles ? ' p-button-info' : ' p-button-secondary')
        return 'p-button-text' + (this.hasFiles ? ' p-button-info' : ' p-button-secondary')
    }

    get label() {
        if (this.short) return ''
        return 'Прикрепить'
    }

    ngOnInit(): void {
    }

    openFileManager() {
        this.clear()
        this.fileManager.nativeElement.click()
    }

    clear() {
        this.filesCatching = 0;
        this.filesLoaded = 0;
        this.files = [];
        this.filesChange.emit([]);
        this.onChange([]);
        this.fileManager.nativeElement.value = '';
    }

    catchFiles(event: any) {
        if (event.target.files.length === 0) return; // Не выбран ни один файл

        this.loading = true;
        this.filesCatching = 0;
        this.filesLoaded = 0;

        const filesArray = Object.values(this.fileManager.nativeElement.files ?? {});
        this.loadFiles(filesArray);
    }

    appendFiles(event: ClipboardEvent){
        if(!event.clipboardData) return;
        this.loading = true;
        this.filesCatching += event.clipboardData.files.length;
        const filesArray = [];
        for (let i = 0; i < event.clipboardData.files.length; i++) {
            filesArray.push(event.clipboardData.files[i]);
        }
        this.loadFiles(filesArray);
    }

    private loadFiles(files: File[]) {
        this.filesCatching = files.length + this.files.length;

        for (const file of files) {
            if (file.size > FILE_SIZE_LIMIT) {
                this.toast.add({
                    severity: 'warn',
                    summary: 'Превышен размер файла',
                    detail: `Файл ${file.name} размером ${(file.size / 1048576).toFixed(2)} Мбайт превысил лимит в ${(FILE_SIZE_LIMIT / 1048576).toFixed(2)} Мбайт`
                })
                this.filesCatching--;
                if (this.filesLoaded === this.filesCatching) this.loading = false;
                continue;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const buffer = e.target?.result;
                if (buffer instanceof ArrayBuffer) {
                    if (!Array.isArray(this.files)) this.files = [];
                    this.files.push({
                        name: file.name,
                        modified: file.lastModified,
                        data: Object.values(new Uint8Array(buffer)),
                        type: file.type
                    });
                    this.lastFileName = file.name;
                    this.filesLoaded = this.files.length;
                    this.filesChange.emit(this.files);
                    this.onChange(this.files);
                    if (this.filesLoaded === this.filesCatching) this.loading = false;
                }
            };
            reader.onerror = (e) => {
                this.toast.add({severity: 'error', summary: "Ошибка чтения файла", detail: e.type})
                this.filesCatching--;
                if (this.filesLoaded === this.filesCatching) this.loading = false;
            };
            reader.readAsArrayBuffer(file);
        }
    }

    onChange = (files: FileData[]) => {
    }

    onTouched = () => {
    }

    ngOnDestroy(): void {

    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    writeValue(obj: any): void {
        this.files = obj;
        this.filesChange.emit(this.files);
    }
}
