import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MenuItem} from "primeng/api";
import {PersonalityService} from "../../../services/personality.service";
import {ApiService} from "../../../services/api.service";
import {NotificationsService} from "../../../services/notifications.service";
import {Router} from "@angular/router";
import {ImageCroppedEvent, LoadedImage} from "ngx-image-cropper";
import {Menu} from "primeng/menu";
import {map} from "rxjs";
import {FormControl} from "@angular/forms";

@Component({
    selector: 'app-account-panel',
    templateUrl: './account-panel.component.html',
    styleUrls: ['./account-panel.component.scss']
})
export class AccountPanelComponent implements OnInit,OnDestroy {
    avatarChangeDialogVisible = false;
    phyPhoneSelectionDialogVisible = false;
    phyPhoneControl = new FormControl<number | null>(null);
    isPhyPhoneIsBinding = false
    controls: MenuItem[] = [
        {label: "Изменить аватар", command: () => this.avatarChangeDialogVisible = true},
        {label: "Выбрать телефон", command: () => this.openPhyPhoneSelectionDialog()},
        {label: "Выйти из аккаунта", command: this.exitFromAccount.bind(this)}
    ];
    @ViewChild("menu") accountPanelMenu?: Menu;

    constructor(readonly personality: PersonalityService, readonly router: Router,
                readonly api: ApiService, readonly notifyService: NotificationsService) {
    }

    ngOnInit(): void {
    }

    exitFromAccount() {
        this.api.signOut().subscribe(() => {
            this.router.navigate(['/login']).then()
        })
    }

    imageChangedEvent: any = '';
    croppedImage: any = '';
    avatarUpload = false;
    phones$ = this.api.getPhyPhoneList().pipe(map(list=>[{label:"Без телефона", value: null}, ...list]));

    openPhyPhoneSelectionDialog() {
        if(this.personality.me)
            this.phyPhoneControl.setValue(this.personality.me.phyPhoneInfo?.phyPhoneInfoId ?? null);
        this.phyPhoneSelectionDialogVisible = true;
    }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event.base64;
    }
    imageLoaded(image: LoadedImage) {
        // show cropper
    }
    cropperReady() {
        // cropper ready
    }
    loadImageFailed() {
        // show message
    }

    saveAvatar() {
        if(!this.croppedImage) return;
        this.avatarUpload = true;
        this.api.setAvatar(this.croppedImage).subscribe({
            next: () => {
                this.avatarUpload = false;
                this.avatarChangeDialogVisible = false;
                this.imageChangedEvent = undefined;
            },
            error: () => {
                this.avatarUpload = false;
            }
        })
    }

    selectFile(fileInput: HTMLInputElement) {
        fileInput.click();
    }

    bindPhone(){
        this.isPhyPhoneIsBinding = true;
        this.api.setPhyPhoneBind(this.phyPhoneControl.value).subscribe({
            next: () => {
                this.isPhyPhoneIsBinding = false;
                this.phyPhoneSelectionDialogVisible = false;
            },
            error: () => {
                this.isPhyPhoneIsBinding = false;
            }
        })
    }

    ngOnDestroy(): void {
    }
}
