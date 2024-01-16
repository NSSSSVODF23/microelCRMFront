import {Component, Injector} from '@angular/core';
import {PrimeNGConfig} from "primeng/api";
import {createCustomElement} from "@angular/elements";
import {EmployeeLabelComponent} from "./components/controls/employee-label/employee-label.component";
import {TaskLinkComponent} from "./components/controls/task-link/task-link.component";
import {DepartmentLabelComponent} from "./components/controls/department-label/department-label.component";
import {configurePrimeng, registerCustomElements} from "./util";
import {Router, Scroll} from "@angular/router";
import {ViewportScroller} from "@angular/common";
import {delay, filter} from "rxjs";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'Microel CRM';

    constructor(readonly config: PrimeNGConfig, injector: Injector, router: Router, viewportScroller: ViewportScroller) {
        configurePrimeng(config);
        registerCustomElements(injector);
        router.events
            .pipe(filter((e): e is Scroll => e instanceof Scroll))
            .pipe(delay(1))   // <--------------------------- This line
            .subscribe((e) => {
                if (e.position) {
                    // backward navigation
                    viewportScroller.scrollToPosition(e.position);
                } else if (e.anchor) {
                    // anchor navigation
                    viewportScroller.scrollToAnchor(e.anchor);
                } else {
                    // forward navigation
                    viewportScroller.scrollToPosition([0, 0]);
                }
            });
    }
}
