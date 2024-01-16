import {Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {ContentChange} from "ngx-quill";
import {OverlayPanel} from "primeng/overlaypanel";
import {ApiService} from "../../../services/api.service";
import {Employee} from "../../../types/transport-interfaces";
import {Utils} from "../../../util";

@Component({
    selector: 'app-employee-insert-panel',
    templateUrl: './employee-insert-panel.component.html',
    styleUrls: ['./employee-insert-panel.component.scss']
})
export class EmployeeInsertPanelComponent implements OnInit {
    targetPosition = {top: '0px', left: '0px'};
    employees: Employee[] = [];
    selectedEmployeeIndex = 0;
    @ViewChild('panel') panel?: OverlayPanel;
    @ViewChild('target') target?: ElementRef<HTMLDivElement>;
    @ViewChild('list') list?: ElementRef<HTMLDivElement>;
    @Output() onSelect: EventEmitter<Employee> = new EventEmitter<Employee>();
    @Output() onReturnFocus: EventEmitter<void> = new EventEmitter<void>();

    constructor(readonly api: ApiService) {
    }

    setQuillEvent(event: ContentChange) {
        if (!Utils.isCorrectSequenceOfCharacters(event, '@', [' ', "\n"])) return;
        this.panel?.hide();
        this.api.getEmployees(undefined, false, false).subscribe(employees => {
            this.employees = employees;
            const {delta, editor} = event;
            const {ops} = delta;
            const selection = editor.getSelection();
            const {top, left, right, bottom} = editor.getBounds(selection?.index ?? 0)

            const bboxEditor = event.editor.root.getBoundingClientRect();

            this.targetPosition = {
                left: left + bboxEditor.x + window.scrollX + 'px', top: top + bboxEditor.y + window.scrollY + 'px',
            }
            this.panel?.show(new MouseEvent('click'), this.target?.nativeElement);
            setTimeout(() => {
                this.list?.nativeElement?.focus();
            }, 100)
        })
    }

    ngOnInit(): void {
    }

    navigate(event: KeyboardEvent) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                event.stopPropagation();
                this.selectedEmployeeIndex++;
                if (this.selectedEmployeeIndex >= this.employees.length) {
                    this.selectedEmployeeIndex = 0;
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                event.stopPropagation();
                this.selectedEmployeeIndex--;
                if (this.selectedEmployeeIndex < 0) {
                    this.selectedEmployeeIndex = this.employees.length - 1;
                }
                break;
            case 'Enter':
                this.panel?.hide();
                this.onSelect.emit(this.employees[this.selectedEmployeeIndex]);
                break;
            default:
                this.panel?.hide();
                this.onReturnFocus.emit();
        }
    }
}
