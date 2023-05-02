import {Component, Injector} from '@angular/core';
import {PrimeNGConfig} from "primeng/api";
import {createCustomElement} from "@angular/elements";
import {EmployeeLabelComponent} from "./components/controls/employee-label/employee-label.component";
import {TaskLinkComponent} from "./components/controls/task-link/task-link.component";
import {DepartmentLabelComponent} from "./components/controls/department-label/department-label.component";
import {configurePrimeng, registerCustomElements} from "./util";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'Microel CRM';

    constructor(readonly config: PrimeNGConfig, injector: Injector) {
        configurePrimeng(config);
        registerCustomElements(injector);
    }
}
