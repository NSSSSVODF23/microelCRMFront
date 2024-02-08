import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ConfirmationService} from 'primeng/api';
import {Department, Employee, PhyPhoneInfo, PhyPhoneModel, Position} from "../../types/transport-interfaces";
import {SubscriptionsHolder} from "../../util";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {debounceTime, distinctUntilChanged} from "rxjs";
import {AccessFlag} from "../../types/access-flag";
import {PersonalityService} from "../../services/personality.service";

@Component({
    templateUrl: './employees-page.component.html',
    styleUrls: ['./employees-page.component.scss']
})
export class EmployeesPageComponent implements OnInit, OnDestroy {

    AccessFlag = AccessFlag;

    employees: Employee[] = [];
    departments: Department[] = [];
    positions: Position[] = [];
    showCreateDepartmentDialog = false;
    showEditDepartmentDialog = false;
    isBeginCreatingDepartment = false;
    isBeginEditingDepartment = false;
    isBeginDeleteDepartment: { [id: number]: boolean } = {};
    departmentForm = new FormGroup({
        id: new FormControl<number | null>(null),
        name: new FormControl<string>('', Validators.required),
        description: new FormControl<string>('')
    })
    positionForm = new FormGroup({
        id: new FormControl<number | null>(null),
        name: new FormControl<string>('', Validators.required),
        description: new FormControl<string>(''),
        access: new FormControl<number[]>([])
    })
    showCreatePositionDialog = false;
    showEditPositionDialog = false;
    isBeginCreatingPosition = false;
    isBeginEditingPosition = false;
    isBeginDeletePosition: { [id: number]: boolean } = {};
    showCreateEmployeeDialog = false;
    showEditEmployeeDialog = false;

    employeeFiltrationForm = new FormGroup({
        query: new FormControl(''),
        showDeleted: new FormControl(false)
    })

    employeeForm = new FormGroup({
        lastName: new FormControl(''),
        firstName: new FormControl('', Validators.required),
        secondName: new FormControl(''),
        internalPhoneNumber: new FormControl<string | null>(null),
        access: new FormControl<number[]>([]),
        login: new FormControl('', [Validators.required, Validators.minLength(4)]),
        password: new FormControl('', Validators.required),
        telegramUserId: new FormControl(''),
        telegramGroupChatId: new FormControl<string|null>(null),
        department: new FormControl<number | null>(null, Validators.required),
        position: new FormControl<number | null>(null, Validators.required),
        offsite: new FormControl(false),
        oldTrackerCredentials: new FormGroup({
            username: new FormControl(''),
            password: new FormControl(''),
            installerId: new FormControl('')
        }),
        base1785Credentials: new FormGroup({
            username: new FormControl(''),
            password: new FormControl(''),
        }),
        base781Credentials: new FormGroup({
            username: new FormControl(''),
            password: new FormControl(''),
        }),
        base1783Credentials: new FormGroup({
            username: new FormControl(''),
            password: new FormControl(''),
        })
    });
    isAccessOverride = false;
    accessOfSelectedPosition: number[] = [];
    isBeingDeleteEmployee: { [id: string]: boolean } = {};
    isBeingCreatingEmployee = false;
    isBeingEditingEmployee = false;

    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();

    constructor(readonly api: ApiService, readonly confirm: ConfirmationService,
                readonly personality: PersonalityService, readonly rt: RealTimeUpdateService) {
    }

    trackByEmployee(index: number, employee: Employee) {
        return employee.login + employee.fullName + JSON.stringify(employee.position)
            + JSON.stringify(employee.department) + employee.deleted + employee.avatar + employee.deleted;
    };

    trackByPosition(index: number, position: Position) {
        return position.positionId + position.name + position.description + position.deleted;
    };

    trackByDepartment(index: number, department: Department) {
        return department.departmentId + department.name + department.description + department.deleted;
    };

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

    ngOnInit(): void {
        this.api.getEmployees(undefined, false).subscribe(employees => this.employees = employees);
        this.api.getDepartments().subscribe(dep => this.departments = dep);
        this.api.getPositions().subscribe(pos => this.positions = pos);
        this.subscriptions.addSubscription('empUpd', this.rt.employeeUpdated().subscribe(value => {
            const foundIndex = this.employees.findIndex(emp => emp.login === value.login);
            if (foundIndex >= 0) {
                this.employees[foundIndex] = value;
            }
        }))
        this.subscriptions.addSubscription('empCr', this.rt.employeeCreated().subscribe(value => {
            this.employees.push(value);
        }));
        this.subscriptions.addSubscription('empDel', this.rt.employeeDeleted().subscribe(value => {
            const foundIndex = this.employees.findIndex(emp => emp.login === value.login);
            if (foundIndex >= 0) {
                this.employees.splice(foundIndex, 1);
            }
        }));
        this.subscriptions.addSubscription('depUpd', this.rt.departmentUpdated().subscribe(value => {
            const foundIndex = this.departments.findIndex(dep => dep.departmentId === value.departmentId);
            if (foundIndex >= 0) {
                this.departments[foundIndex] = value;
            }
            this.employees.filter(emp => emp.department?.departmentId === value.departmentId).forEach(emp => {
                emp.department = value
            })
        }));
        this.subscriptions.addSubscription('depCr', this.rt.departmentCreated().subscribe(value => {
            this.departments.push(value);
        }));
        this.subscriptions.addSubscription('depDel', this.rt.departmentDeleted().subscribe(value => {
            const foundIndex = this.departments.findIndex(dep => dep.departmentId === value.departmentId);
            if (foundIndex >= 0) {
                this.departments.splice(foundIndex, 1);
            }
        }));
        this.subscriptions.addSubscription('posUpd', this.rt.positionUpdated().subscribe(value => {
            const foundIndex = this.positions.findIndex(pos => pos.positionId === value.positionId);
            if (foundIndex >= 0) {
                this.positions[foundIndex] = value;
            }
            this.employees.filter(emp => emp.position?.positionId === value.positionId).forEach(emp => {
                emp.position = value
            })
        }));
        this.subscriptions.addSubscription('posCr', this.rt.positionCreated().subscribe(value => {
            this.positions.push(value);
        }));
        this.subscriptions.addSubscription('posDel', this.rt.positionDeleted().subscribe(value => {
            const foundIndex = this.positions.findIndex(pos => pos.positionId === value.positionId);
            if (foundIndex >= 0) {
                this.positions.splice(foundIndex, 1);
            }
        }));
        this.subscriptions.addSubscription('empSearch', this.employeeFiltrationForm.valueChanges
            .pipe(
                debounceTime(1000),
                distinctUntilChanged(),
            )
            .subscribe(value => {
                this.employeeFiltrationForm.disable({emitEvent: false});
                this.api.getEmployees(value.query ?? undefined, value.showDeleted ?? undefined).subscribe({
                    next: value => {
                        this.employees = value;
                        this.employeeFiltrationForm.enable({emitEvent: false});
                    },
                    error: () => this.employeeFiltrationForm.enable({emitEvent: false})
                });
            }))
    }

    departmentCreate() {
        this.isBeginCreatingDepartment = true;
        this.api.createDepartment(this.departmentForm.getRawValue()).subscribe({
            complete: () => {
                this.isBeginCreatingDepartment = false;
                this.showCreateDepartmentDialog = false;
            },
            error: () => {
                this.isBeginCreatingDepartment = false;
            }
        })
    }

    departmentDelete(departmentId?: number) {
        if (typeof departmentId !== 'number') return;
        this.isBeginDeleteDepartment[departmentId] = true;
        this.api.deleteDepartment(departmentId).subscribe({
            complete: () => {
                delete this.isBeginDeleteDepartment[departmentId];
            },
            error: () => {
                delete this.isBeginDeleteDepartment[departmentId];
            }
        });
    }

    departmentDeleteConfirm(department: Department) {
        this.confirm.confirm({
            header: 'Подтверждение',
            message: 'Удалить отдел: ' + department.name + '?',
            accept: () => {
                this.departmentDelete(department.departmentId)
            }
        })
    }

    departmentEdit() {
        const id = this.departmentForm.value['id'];
        if (typeof id !== 'number') return;
        this.isBeginEditingDepartment = true;
        this.api.editDepartment(this.departmentForm.getRawValue(), id).subscribe({
            complete: () => {
                this.isBeginEditingDepartment = false;
                this.showEditDepartmentDialog = false;
            },
            error: () => {
                this.isBeginEditingDepartment = false;
            }
        })
    }

    openDepartmentEditor(name: string, description: string, id?: number) {
        if (typeof id !== 'number') return;
        this.showEditDepartmentDialog = true;
        this.departmentForm.setValue({id, name, description});
    }

    openDepartmentCreator() {
        this.showCreateDepartmentDialog = true;
        this.departmentForm.reset();
    }

    openPositionCreator() {
        this.showCreatePositionDialog = true;
        this.positionForm.reset();
    }

    openPositionEditor(name: string, description: string, access: number, id?: number) {
        if (typeof id !== 'number') return;
        this.showEditPositionDialog = true;
        this.positionForm.setValue({id, name, description, access: AccessFlag.read(access)});
    }

    accessFlags() {
        return AccessFlag.flagList();
    }

    positionCreate() {
        this.isBeginCreatingPosition = true;
        const SENDING_FORM = {
            name: this.positionForm.value.name,
            description: this.positionForm.value.description,
            access: this.positionForm.value.access?.reduce((p: number, c: number) => p + c, 0) ?? 0,
        }
        this.api.createPosition(SENDING_FORM).subscribe({
            complete: () => {
                this.isBeginCreatingPosition = false;
                this.showCreatePositionDialog = false;
            },
            error: () => {
                this.isBeginCreatingPosition = false;
            }
        })
    }

    positionEdit() {
        if (typeof this.positionForm.value.id !== 'number') return;
        this.isBeginEditingPosition = true;
        const SENDING_FORM = {
            name: this.positionForm.value.name,
            description: this.positionForm.value.description,
            access: this.positionForm.value.access?.reduce((p: number, c: number) => p + c, 0) ?? 0,
        }
        this.api.editPosition(SENDING_FORM, this.positionForm.value.id).subscribe({
            complete: () => {
                this.isBeginEditingPosition = false;
                this.showEditPositionDialog = false;
            },
            error: () => {
                this.isBeginEditingPosition = false;
            }
        })
    }

    positionDelete(positionId?: number) {
        if (typeof positionId !== 'number') return;
        this.isBeginDeletePosition[positionId] = true;
        this.api.deletePosition(positionId).subscribe({
            complete: () => {
                delete this.isBeginDeletePosition[positionId];
            },
            error: () => {
                delete this.isBeginDeletePosition[positionId];
            }
        });
    }

    positionDeleteConfirm(position: Position) {
        this.confirm.confirm({
            header: 'Подтверждение',
            message: 'Удалить должность: ' + position.name + '?',
            accept: () => {
                this.positionDelete(position.positionId)
            }
        })
    }

    openEmployeeCreator() {
        this.showCreateEmployeeDialog = true;
        this.employeeForm.reset({
            login: "",
            password: "",
            access: [],
            department: null,
            position: null,
            secondName: "",
            firstName: "",
            lastName: "",
            internalPhoneNumber: "",
            telegramUserId: "",
            offsite: false
        })
    }

    accessOverrideChange(value: boolean) {
        if (!value) {
            this.employeeForm.patchValue({access: []})
        }
    }

    positionSelecting(event: any) {
        const position = this.positions.find(p => p.positionId === event.value);
        if (position && position.access) {
            this.accessOfSelectedPosition = AccessFlag.read(position.access);
        }
    }

    checkAllAccessEmployee(event: any) {
        const {checked} = event;
        if (checked)
            this.employeeForm.patchValue({access: AccessFlag.array()});
        else
            this.employeeForm.patchValue({access: []});
    }

    checkAllAccessPosition(event: any) {
        const {checked} = event;
        if (checked)
            this.positionForm.patchValue({access: AccessFlag.array()});
        else
            this.positionForm.patchValue({access: []});
    }

    employeeCreate() {
        const rawValue = this.employeeForm.getRawValue();
        this.isBeingCreatingEmployee = true;
        let access = 0;
        if (Array.isArray(rawValue['access'])) access = rawValue['access'].reduce((p: number, c: number) => p + c, 0)
        this.api.createEmployee({...rawValue, access}).subscribe({
            complete: () => {
                this.isBeingCreatingEmployee = false;
                this.showCreateEmployeeDialog = false;
            },
            error: () => {
                this.isBeingCreatingEmployee = false;
            }
        })
    }

    employeeDeleteConfirm(employee: Employee) {
        this.confirm.confirm({
            header: 'Подтверждение',
            message: 'Удалить сотрудника: ' + employee.login + '?',
            accept: () => {
                this.employeeDelete(employee.login)
            }
        })
    }

    employeeDelete(login?: string) {
        if (typeof login !== 'string') return;
        this.isBeingDeleteEmployee[login] = true;
        this.api.deleteEmployee(login).subscribe({
            complete: () => {
                delete this.isBeingDeleteEmployee[login];
            },
            error: () => {
                delete this.isBeingDeleteEmployee[login];
            }
        });
    }

    employeeEdit() {
        const rawValue = this.employeeForm.getRawValue();
        if (typeof rawValue['login'] !== 'string') return;
        this.isBeingEditingEmployee = true;
        let access = 0;
        if (Array.isArray(rawValue['access'])) access = rawValue['access'].reduce((p: number, c: number) => p + c, 0)
        this.api.editEmployee({...rawValue, access}, rawValue['login']).subscribe({
            complete: () => {
                this.isBeingEditingEmployee = false;
                this.showEditEmployeeDialog = false;
            },
            error: () => {
                this.isBeingEditingEmployee = false;
            }
        })
    }

    openEmployeeEditor(login?: string) {
        if (typeof login !== 'string') return;
        this.api.getEmployee(login).subscribe({
            next: (employee) => {
                this.employeeForm.patchValue({
                    login: employee.login,
                    password: "password",
                    access: AccessFlag.read(employee.access ?? 0),
                    department: employee.department?.departmentId,
                    position: employee.position?.positionId,
                    secondName: employee.secondName,
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    internalPhoneNumber: employee.internalPhoneNumber,
                    telegramUserId: employee.telegramUserId,
                    telegramGroupChatId: employee.telegramGroupChatId,
                    offsite: employee.offsite,
                    oldTrackerCredentials: {
                        username: employee.oldTrackerCredentials?.username ?? "",
                        password: employee.oldTrackerCredentials?.password ?? "",
                        installerId: employee.oldTrackerCredentials?.installerId ?? "",
                    },
                    base1785Credentials: {
                        username: employee.base1785Credentials?.username ?? "",
                        password: employee.base1785Credentials?.password ?? "",
                    },
                    base781Credentials: {
                        username: employee.base781Credentials?.username ?? "",
                        password: employee.base781Credentials?.password ?? "",
                    },
                    base1783Credentials: {
                        username: employee.base1783Credentials?.username ?? "",
                        password: employee.base1783Credentials?.password ?? "",
                    }
                })
                this.positionSelecting({value: employee.position?.positionId})
                this.showEditEmployeeDialog = true;
            },
            error: () => {
            }
        })
    }
}
