import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {MenuItem, MessageService} from "primeng/api";
import {FileData} from "../../../transport-interfaces";

const FILE_SIZE_LIMIT = 1048576 * 20;

@Component({
    selector: 'app-file-input',
    templateUrl: './file-input.component.html',
    styleUrls: ['./file-input.component.scss']
})
export class FileInputComponent implements OnInit {

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
            label: 'Отчистить',
            icon: 'mdi-highlight_off',
            command: this.clear.bind(this)
        }
    ];

    get style(){
        if(this.short) return 'p-button-text p-button-secondary p-button-icon'
        return 'p-button-text p-button-secondary'
    }

    get label(){
        if(this.short) return ''
        return 'Прикрепить'
    }

    constructor(readonly toast: MessageService) {
    }

    ngOnInit(): void {
    }

    openFileManager() {
        this.fileManager.nativeElement.click()
    }

    clear() {
        this.filesCatching = 0;
        this.filesLoaded = 0;
        this.files = [];
        this.filesChange.emit([]);
        this.fileManager.nativeElement.value = '';
    }

    catchFiles(event: any) {
        if (event.target.files.length === 0) return; // Не выбран ни один файл

        this.loading = true;
        this.filesCatching = 0;
        this.filesLoaded = 0;

        const filesArray = Object.values(this.fileManager.nativeElement.files ?? {});
        this.filesCatching = filesArray.length + this.files.length;

        for (const file of filesArray) {
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
}
