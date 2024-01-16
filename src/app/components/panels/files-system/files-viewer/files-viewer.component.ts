import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
    AttachmentType,
    Directory,
    FilesLoadFileEvent,
    FileSystemItem,
    LoadingDirectoryWrapper,
    TFile
} from "../../../../types/transport-interfaces";
import {ApiService} from "../../../../services/api.service";
import {Storage, SubscriptionsHolder} from "../../../../util";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {RealTimeUpdateService} from "../../../../services/real-time-update.service";
import {fromEvent} from "rxjs";
import {ConfirmationService, MenuItem} from "primeng/api";
import {MediaViewerService} from "../../../../services/media-viewer.service";

@Component({
    selector: 'app-files-viewer',
    templateUrl: './files-viewer.component.html',
    styleUrls: ['./files-viewer.component.scss']
})
export class FilesViewerComponent implements OnInit, OnDestroy {

    @ViewChild('fileManager') fileManager?: ElementRef<HTMLInputElement>;

    fileItems: FileSystemItem[] = [];
    isLoading: boolean = false;
    selectedItems: FileSystemItem[] = [];
    itemsForCopy: FileSystemItem[] = [];
    itemsForMove: FileSystemItem[] = [];
    currentPath: Directory[] = [];
    currentDirectory: Directory | null = null;
    filesSortingTypeItems$ = this.api.getFilesSortingTypes();
    filesSortingControl = new FormControl(Storage.loadOrDefault('filesSortingType', 'NAME_ASC'));

    subscriptions = new SubscriptionsHolder();

    createDirectoryDialogVisible = false;
    createDirectoryNameControl = new FormControl("", [Validators.required, Validators.minLength(3)]);

    renameItemDialogVisible = false;
    renameItemForm = new FormGroup({
        id: new FormControl<number | null>(null, [Validators.required]),
        name: new FormControl<string>("", [Validators.required, Validators.minLength(3)])
    })
    itemBeingRename = false;

    directoryCreating = false;
    insideDragDrop = false;
    dropMessageVisible = 0;
    menuItems: MenuItem[] = [];
    dropFilesUploadingVisible = false;

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private confirmService: ConfirmationService, private mediaViewerService: MediaViewerService) {
    }

    get breadcrumbRoot() {
        return {
            icon: 'mdi-home',
            command: () => {
                this.isLoading = true;
                this.currentPath = [];
                this.api.getFilesRoot(this.filesSortingControl.value).subscribe(this.rootDirectoryLoadHandler())
            }
        }
    }

    breadcrumbItems: MenuItem[] = [];
    searchFilesQueryControl = new FormControl("");
    searchMode = false;

    updateMenuItems() {
        this.menuItems = [
            {
                label: 'Файлы',
                items: [
                    {
                        label: 'Загрузить с диска',
                        command: () => this.fileManager?.nativeElement.click(),
                    },
                    {
                        label: 'Создать папку',
                        command: () => this.openCreateFolderDialog(),
                    }
                ]
            },
            {
                label: 'Редактировать',
                items: [
                    {
                        label: 'Вырезать',
                        disabled: this.selectedItems.length === 0,
                        command: ()=>this.setMoveItems()
                    },
                    {
                        label: 'Копировать',
                        disabled: this.selectedItems.length === 0,
                        command: ()=>this.setCopyItems()
                    },
                    {
                        label: 'Вставить',
                        disabled: this.itemsForCopy.length === 0 && this.itemsForMove.length === 0,
                        command: ()=>this.pasteItems()
                    },
                    {
                        label: 'Переименовать',
                        disabled: this.selectedItems.length !== 1,
                        command: ()=>this.openRenameItemDialog()
                    },
                    {
                        label: 'Удалить',
                        disabled: this.selectedItems.length === 0,
                        command: ()=>this.deleteItems()
                    }
                ]
            },
        ];
    }

    updateBreadcrumbs(){
        this.breadcrumbItems = [...this.currentPath.filter(x => (x !== null)).map((x, i) => {
            return {
                label: x?.name,
                command: () => {
                    if(x){
                        this.currentPath = this.currentPath.slice(0, i+1);
                        this.currentDirectory = x;
                        this.isLoading = true;
                        this.updateBreadcrumbs()
                        this.api.getFilesDirectory(x.fileSystemItemId, this.filesSortingControl.value).subscribe(this.directoryLoadHandler(this.currentDirectory))
                    }
                }
            }
        }), {label: this.currentDirectory?.name, disabled:true}]
    }

    get isBack() {
        return this.currentPath.length > 0;
    }

    rootDirectoryLoadHandler() {
        return {
            next: (res: FileSystemItem[]) => {
                this.fileItems = res;
                this.selectedItems = [];
                this.currentPath = [];
                this.currentDirectory = null;
                this.isLoading = false;
                this.searchMode = false;
                this.searchFilesQueryControl.setValue("");
                this.updateBreadcrumbs()
                this.updateMenuItems()
            },
            error: () => this.isLoading = false,
        }
    }

    directoryLoadHandler(directory: Directory) {
        return {
            next: (res: LoadingDirectoryWrapper) => {
                this.fileItems = [{fileSystemItemId: 0, name: "Назад", discriminator: "back", parent: null}, ...res.files];
                this.selectedItems = [];
                this.currentPath = res.path;
                this.currentDirectory = directory;
                this.updateBreadcrumbs()
                this.updateMenuItems()
                this.isLoading = false;
                this.searchMode = false;
                this.searchFilesQueryControl.setValue("");
            },
            error: () => this.isLoading = false,
        }
    }

    ngOnInit(): void {
        this.isLoading = true;
        this.api.getFilesRoot(this.filesSortingControl.value).subscribe(this.rootDirectoryLoadHandler());
        this.updateMenuItems();

        this.subscriptions.addSubscription('stUpd',
            this.filesSortingControl.valueChanges.subscribe(sortingType => {
                Storage.save('filesSortingType', sortingType);
                this.isLoading = true;
                if (this.currentDirectory) {
                    this.api.getFilesDirectory(this.currentDirectory.fileSystemItemId, sortingType).subscribe(this.directoryLoadHandler(this.currentDirectory))
                } else {
                    this.api.getFilesRoot(sortingType).subscribe(this.rootDirectoryLoadHandler())
                }
            })
        )

        this.subscriptions.addSubscription('dirUpd',
            this.rt.updateFilesDirectory().subscribe((id) => {
                console.log(id, this.currentDirectory?.fileSystemItemId ?? null)
                if (id === 0 && this.currentDirectory === null) {
                    this.isLoading = true;
                    this.api.getFilesRoot(this.filesSortingControl.value).subscribe(this.rootDirectoryLoadHandler())
                } else if (id === this.currentDirectory?.fileSystemItemId) {
                    this.isLoading = true;
                    this.api.getFilesDirectory(this.currentDirectory.fileSystemItemId, this.filesSortingControl.value).subscribe(this.directoryLoadHandler(this.currentDirectory))
                }
            })
        )

        this.subscriptions.addSubscription('drgEntDetect',
            fromEvent(document, "dragenter").subscribe((event) => {
                this.dropMessageVisible++;
            })
        );

        this.subscriptions.addSubscription('drgLvDetect',
            fromEvent(document, "dragleave").subscribe((event) => {
                this.dropMessageVisible--;
            })
        );

        this.subscriptions.addSubscription('drpDetect',
            fromEvent(document, "drop").subscribe(() => {
                this.dropMessageVisible = 0;
            })
        );

        this.subscriptions.addSubscription('drgDropover',
            fromEvent(document, "dragover").subscribe((event) => {
                if (!this.insideDragDrop) event.preventDefault();
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

    dropFilesHandler(event: DragEvent) {
        if (this.insideDragDrop) return
        console.log(event);

        // Prevent default behavior (Prevent file from being opened)
        event.preventDefault();

        const uploadFiles = [] as File[];

        if (event.dataTransfer?.items) {
            // Use DataTransferItemList interface to access the file(s)
            for (let i = 0; i < event.dataTransfer.items.length; i++) {
                // If dropped items aren't files, reject them
                if (event.dataTransfer.items[i].kind === "file") {
                    const file = event.dataTransfer.items[i].getAsFile();
                    if (file) uploadFiles.push(file);
                }
            }
        } else if (event.dataTransfer?.files) {
            // Use DataTransfer interface to access the file(s)
            for (let i = 0; i < event.dataTransfer.files.length; i++) {
                console.log(`… file[${i}].name = ${event.dataTransfer.files[i].name}`);
                uploadFiles.push(event.dataTransfer.files[i]);
            }
        }

        this.uploadFiles(uploadFiles);
    }

    filesManagerChange(event: any) {
        if (event.target.files.length === 0) return;
        const files = event.target.files;
        const uploadFiles = [] as File[];
        for (let i = 0; i < files.length; i++) {
            console.log(`… file[${i}].name = ${files[i].name}`);
            uploadFiles.push(files[i]);
        }
        this.uploadFiles(uploadFiles);
        event.target.value = null;
    }

    uploadFiles(files: File[]) {
        this.dropFilesUploadingVisible = true;
        Promise.all(files.map(file => this.fileReader(file))).then(uploadFiles => {
            this.api.filesUpload(uploadFiles).subscribe({
                next: () => this.dropFilesUploadingVisible = false,
                error: () => this.dropFilesUploadingVisible = false,
            });
        })
    }

    fileReader(file: File) {
        return new Promise<FilesLoadFileEvent>((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = (e) => {
                const buffer = e.target?.result;
                if (buffer instanceof ArrayBuffer) {
                    resolve({
                        name: file.name,
                        data: Object.values(new Uint8Array(buffer)),
                        targetDirectoryId: this.currentDirectory?.fileSystemItemId,
                    })
                }
            };
            fr.onerror = reject;
            fr.readAsArrayBuffer(file);
        });
    }

    loadDirectory(directory: Directory) {
        this.isLoading = true;
        this.api.getFilesDirectory(directory.fileSystemItemId, this.filesSortingControl.value).subscribe(this.directoryLoadHandler(directory))

    }

    back() {
        if (this.currentPath.length > 0) {
            const directory = this.currentPath.pop();
            if (directory === undefined) return;
            this.currentDirectory = directory;
            this.isLoading = true;
            this.updateBreadcrumbs()
            this.api.getFilesDirectory(directory.fileSystemItemId, this.filesSortingControl.value).subscribe(this.directoryLoadHandler(directory))
        }else{
            this.currentDirectory = null;
            this.isLoading = true;
            this.updateBreadcrumbs()
            this.api.getFilesRoot(this.filesSortingControl.value).subscribe(this.rootDirectoryLoadHandler());
        }
    }

    doubleClick(fileItem: FileSystemItem) {
        switch (fileItem.discriminator) {
            case 'directory':
                this.loadDirectory(fileItem as Directory);
                break;
            case 'file':
                const tfile = fileItem as TFile;
                switch (tfile.type) {
                    case 'PHOTO':
                    case 'VIDEO':
                    case 'AUDIO':
                        this.mediaViewerService.showMedia(tfile);
                        break;
                    case 'DOCUMENT':
                    case 'FILE':
                        window.open('/api/private/file/' + tfile.fileSystemItemId, '_blank')
                        break;
                    default:
                        break;
                }
                break;
            case 'back':
                break;
        }
    }

    isBackButton(fileItem: FileSystemItem) {
        return fileItem.discriminator === 'back';
    }

    isNotADirectory(fileItem: FileSystemItem) {
        return fileItem.discriminator !== 'directory';
    }

    isSelected(fileItem: FileSystemItem) {
        return this.selectedItems.map(fi => fi.fileSystemItemId).includes(fileItem.fileSystemItemId);
    }

    filesDropped(directory: FileSystemItem) {
        console.log("Files dropped");
        if (this.isSelected(directory)) return;
        const directoryWhereFilesAreMoved = directory.fileSystemItemId;
        const filesToMove = this.selectedItems.map(x => x.fileSystemItemId);
        this.api.filesMoveTo(directoryWhereFilesAreMoved, filesToMove).subscribe()
    }

    setCopyItems() {
        console.log("Copy items")
        this.itemsForMove = []
        this.itemsForCopy = this.selectedItems
        this.selectedItems = []
        this.updateMenuItems()
    }

    setMoveItems() {
        console.log("Move items")
        this.itemsForCopy = []
        this.itemsForMove = this.selectedItems
        this.selectedItems = []
        this.updateMenuItems()
    }

    isFilesCopied(item: FileSystemItem) {
        return this.itemsForCopy.map(item => item.fileSystemItemId).includes(item.fileSystemItemId);
    }

    isFilesMoved(item: FileSystemItem) {
        return this.itemsForMove.map(item => item.fileSystemItemId).includes(item.fileSystemItemId);
    }

    itemSelectionStyleClasses(item: FileSystemItem) {
        if (!this.isSelected(item) && this.isFilesMoved(item)) {
            return "opacity-50"
        } else if (!this.isSelected(item) && this.isFilesCopied(item)) {
            return "text-orange-400"
        }
        return null;
    }

    pasteItems() {
        console.log("Paste items", this.itemsForMove, this.itemsForCopy)
        if (this.itemsForMove.length > 0) {
            this.api.filesMoveTo(this.currentDirectory?.fileSystemItemId ?? null, this.itemsForMove.map(x => x.fileSystemItemId)).subscribe()
        } else if (this.itemsForCopy.length > 0) {
            this.api.filesCopyTo(this.currentDirectory?.fileSystemItemId ?? null, this.itemsForCopy.map(x => x.fileSystemItemId)).subscribe()
        }
        this.itemsForCopy = [];
        this.itemsForMove = [];
        this.updateMenuItems()
    }

    deleteItems() {
        this.confirmService.confirm({
            header: "Удаление файлов",
            message: "Вы уверены, что хотите удалить выбранные файлы?",
            accept: () => {
                this.itemsForMove = [];
                this.itemsForCopy = [];
                this.isLoading = true;
                if (this.selectedItems.length > 0) {
                    this.selectedItems.forEach(item => {
                        this.api.filesDelete(item.fileSystemItemId).subscribe();
                    })
                    this.selectedItems = [];
                }
                this.updateMenuItems();
            }
        })
    }

    createDirectory() {
        const name = this.createDirectoryNameControl.value;
        if (name) this.api.filesCreateDirectory(name, this.currentDirectory?.fileSystemItemId).subscribe({
            next: () => {
                this.createDirectoryDialogVisible = false;
                this.directoryCreating = false;
            },
            error: () => {
                this.directoryCreating = false;
            }
        })
    }

    openCreateFolderDialog() {
        this.createDirectoryNameControl.setValue("");
        this.directoryCreating = false;
        this.createDirectoryDialogVisible = true;
    }

    renameItem() {
        if(this.renameItemForm.valid){
            const {id, name} = this.renameItemForm.value;
            if(!id || !name) return;
            this.itemBeingRename = true;
            this.selectedItems = [];
            this.api.filesRename(id, name).subscribe({
                next: () => {
                    this.renameItemDialogVisible = false;
                    this.itemBeingRename = false;
                },
                error: () => {
                    this.itemBeingRename = false;
                }
            })
            this.updateMenuItems();
        }
    }

    openRenameItemDialog() {
        if(this.selectedItems.length === 1){
            this.renameItemForm.setValue({
                id: this.selectedItems[0].fileSystemItemId,
                name: this.selectedItems[0].name,
            })
            this.renameItemDialogVisible = true;
            this.itemBeingRename = false;
        }
    }

    searchFiles() {
        if(this.searchFilesQueryControl.value){
            this.searchMode = true;
            this.currentPath = [];
            this.currentDirectory = null;
            this.isLoading = true;
            this.api.searchFiles(this.searchFilesQueryControl.value, this.filesSortingControl.value).subscribe({
                next: (files) => {
                    this.isLoading = false;
                    this.fileItems = files;
                },
                error: () => {
                    this.isLoading = false;
                }
            })
        }
    }

    cancelSearch() {
        this.isLoading = true;
        this.currentPath = [];
        this.searchFilesQueryControl.setValue("");
        this.api.getFilesRoot(this.filesSortingControl.value).subscribe(this.rootDirectoryLoadHandler())
    }
}
