import {Pipe, PipeTransform} from '@angular/core';
import {Comment, TaskEvent, TaskEventType} from "../types/transport-interfaces";

@Pipe({
    name: 'taskEventTranslate'
})
export class TaskEventTranslatePipe implements PipeTransform {

    transform(value: Comment | TaskEvent): string {
        if (!('type' in value)) return "";
        switch (value.type) {
            case TaskEventType.CHANGE_STAGE:
                return "Изменен тип задачи: ";
            case TaskEventType.CREATE_WORK_LOG:
                return "Назначены монтажники по задаче";
            case TaskEventType.FORCE_CLOSE_WORK_LOG:
                return "Принудительно завершены работы монтажников по задаче";
            case TaskEventType.CLOSE_WORK_LOG:
                return "Завершены работы монтажников по задаче";
            case TaskEventType.CHANGE_RESPONSIBILITY:
                return "Изменен ответственный: ";
            case TaskEventType.LINKED_TO_PARENT_TASK:
                return "Привязана к родительской задаче";
            case TaskEventType.UNLINKED_FROM_PARENT_TASK:
                return "Отвязана от родительской задачи";
            case TaskEventType.UNLINK_CHILD_TASK:
                return "Отвязана от дочерних задач";
            case TaskEventType.LINKED_TO_CHILD_TASKS:
                return "Привязаны дочерние задачи";
            case TaskEventType.CHANGE_TAGS:
                return "Установленны теги: ";
            case TaskEventType.CLEAN_TAGS:
                return "Задача отчищена от тегов";
            case TaskEventType.CHANGE_OBSERVERS:
                return "Изменены наблюдатели: ";
            case TaskEventType.UNBIND_RESPONSIBLE:
                return "Ответственный убран";
            case TaskEventType.CHANGE_ACTUAL_FROM:
                return "Задача запланирована: ";
            case TaskEventType.CHANGE_ACTUAL_TO:
                return "Установлен срок выполнения: ";
            case TaskEventType.CLEAR_ACTUAL_FROM_TASK:
                return "Удалена запланированная дата";
            case TaskEventType.CLEAR_ACTUAL_TO_TASK:
                return "Удален срок выполнения";
            case TaskEventType.CLOSE_TASK:
                return "Задача закрыта";
            case TaskEventType.REOPEN_TASK:
                return "Задача вновь открыта";
            case TaskEventType.EDIT_FIELDS:
                return "Информация в задаче отредактирована"
            case TaskEventType.REPORT_CREATED:
                return "Завершил работы по задаче: "
            case TaskEventType.MOVED_TO_DIRECTORY:
                return "Перемещена в категорию: "
        }
    }

}
