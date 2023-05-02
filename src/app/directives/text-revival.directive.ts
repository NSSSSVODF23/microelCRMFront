import {
    AfterViewInit,
    ComponentFactoryResolver,
    Directive,
    ElementRef,
    Input,
    OnInit,
    ViewContainerRef
} from '@angular/core';
import {TaskLinkComponent} from "../components/controls/task-link/task-link.component";
import {EmployeeLabelComponent} from "../components/controls/employee-label/employee-label.component";
import {DepartmentLabelComponent} from "../components/controls/department-label/department-label.component";
import {AppointedInstallersComponent} from "../components/controls/appointed-installers/appointed-installers.component";

type Substitution = {
    data: any,
    type: 'task' | 'employee' | 'department' | 'appointedInstallers'
}

@Directive({
    selector: '[appTextRevival]'
})
export class TextRevivalDirective implements OnInit, AfterViewInit {

    private arrayOfSubstitutions: Substitution[] = [];
    private loaded = false;

    constructor(private element: ElementRef,
                private viewContainerRef: ViewContainerRef,
                private componentFactoryResolver: ComponentFactoryResolver) {

    }

    @Input() set value(value: string) {
        if (!this.loaded) return;
        this.findTagsAndReplaceToPlaceholders();
        this.replacePlaceholdersToComponents();
    }

    ngAfterViewInit(): void {
        this.findTagsAndReplaceToPlaceholders();
        this.replacePlaceholdersToComponents();
        this.loaded = true;
    }

    ngOnInit(): void {

    }

    private findTagsAndReplaceToPlaceholders() {
        const host = this.element.nativeElement;

        const taskRegexp = /\B#(\d+)/g;
        const employeeRegexp = /\B@([A-z\d.\-_]+)/g;
        const departmentRegexp = /\B\$(\d+)/g;
        const appointedInstallersRegexp = /\B\^\((\d+)\)/g;

        // Находим вхождения и заменяем их элементами placeholder-ами

        // Заменяем найденные теги задач
        host.innerHTML = host.innerHTML.replaceAll(taskRegexp, (found: string, args: string) => {
            this.arrayOfSubstitutions.push({data: parseInt(args), type: 'task'});
            return ` <i id="replace${this.arrayOfSubstitutions.length - 1}"></i> `
        });

        // Заменяем теги сотрудников
        host.innerHTML = host.innerHTML.replaceAll(employeeRegexp, (found: string, args: string) => {
            this.arrayOfSubstitutions.push({data: args, type: 'employee'});
            return ` <i id="replace${this.arrayOfSubstitutions.length - 1}"></i> `
        })

        // Заменяем теги отделов
        host.innerHTML = host.innerHTML.replaceAll(departmentRegexp, (found: string, args: string) => {
            this.arrayOfSubstitutions.push({data: parseInt(args), type: 'department'});
            return ` <i id="replace${this.arrayOfSubstitutions.length - 1}"></i> `
        });

        // Заменяем теги назначенных монтажников
        host.innerHTML = host.innerHTML.replaceAll(appointedInstallersRegexp, (found: string, args: string) => {
            this.arrayOfSubstitutions.push({data: parseInt(args), type: 'appointedInstallers'});
            return ` <i id="replace${this.arrayOfSubstitutions.length - 1}"></i>`
        })
    }

    private replacePlaceholdersToComponents() {
        this.arrayOfSubstitutions.forEach((substitution, i) => {
            const host = this.element.nativeElement;
            // Находим элемент placeholder-а и заменяем компонентом
            const placeholder = host.querySelector(`#replace${i}`);
            switch (substitution.type) {
                case 'task':
                    placeholder.replaceWith(TaskLinkComponent.createElement(parseInt(substitution.data)));
                    break;
                case 'employee':
                    placeholder.replaceWith(EmployeeLabelComponent.createElement(substitution.data, true));
                    break;
                case 'department':
                    placeholder.replaceWith(DepartmentLabelComponent.createElement(substitution.data, true));
                    break;
                case 'appointedInstallers':
                    placeholder.replaceWith(AppointedInstallersComponent.createElement(substitution.data))
            }
        })
    }
}
