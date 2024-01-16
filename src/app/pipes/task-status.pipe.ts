import {Pipe, PipeTransform} from '@angular/core';
import {Task, TaskStatus} from "../types/transport-interfaces";

@Pipe({
    name: 'taskStatus'
})
export class TaskStatusPipe implements PipeTransform {

    transform(value?: Task): string {
        if(!value) return "Неизвестно";

        switch (value.taskStatus) {
            case TaskStatus.ACTIVE:
                return 'Активная';
            case TaskStatus.PROCESSING:
                return 'У монтажников';
            case TaskStatus.CLOSE:
                return 'Закрытая';
            default:
                return 'Неизвестно';
        }
    }

}
