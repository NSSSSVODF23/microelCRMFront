import {AfterViewInit, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Employee} from "../../../types/transport-interfaces";
import {SubscriptionsHolder} from "../../../util";
import {BehaviorSubject, debounceTime} from "rxjs";

@Component({
    selector: 'app-avatar-list',
    templateUrl: './avatar-list.component.html',
    styleUrls: ['./avatar-list.component.scss']
})
export class AvatarListComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() employees: Employee[] = [];
    @Input() size = 2;
    @Input() vertical = false;
    visibleSubject = new BehaviorSubject<boolean>(false);
    visible$ = this.visibleSubject.pipe(debounceTime(300))
    private subscriptions = new SubscriptionsHolder();

    constructor() {
    }

    avatarStyle(index: number){
        const STYLE = {
            mask: (index<this.sliced.length-1?this.mask:''),
            webkitMask: (index<this.sliced.length-1?this.mask:'')
        } as CSSStyleDeclaration;
        if (this.vertical){
            STYLE.marginBottom = (index>0?this.margin+'rem':'');
        }else{
            STYLE.marginRight = (this.margin+'rem');
        }
        return STYLE;
    }

    get margin() {
        return (-2 * (0.2 + this.shift()));
    }

    get mask() {
        if(this.vertical)
            return `radial-gradient(circle at 50% ${this.size-((this.size + this.size / 2) + this.margin)}rem, transparent ${this.size / 2 + 0.1}rem, white ${this.size / 2 + 0.2}rem)`;
        return `radial-gradient(circle at ${(this.size + this.size / 2) + this.margin}rem, transparent ${this.size / 2 + 0.1}rem, white ${this.size / 2 + 0.2}rem)`;
    }

    get sliced() {
        return this.employees.slice(0, 6);
    }

    get numberOfOverflowed() {
        let num = this.employees.length - 6;
        if (num < 0) num = 0;
        return num;
    }

    trackByEmployee(index: number, employee: Employee) {
        return employee.login;
    };

    ngOnInit(): void {
    }

    ngAfterViewInit() {
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribeAll()
    }

    private shift() {
        let shift = this.sliced.length * 0.05;
        if (shift > 0.3) shift = 0.3;
        return shift;
    }
}
