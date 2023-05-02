import {Injectable} from '@angular/core';
import {StompClientService} from "./stomp-client.service";
import {finalize, map, Observable, share} from "rxjs";
import {ChatMessage, Comment, Employee, Task, TaskEvent, TaskTag} from "../transport-interfaces";
import {cyrb53} from "../util";
import {OldTracker, SimpleMessage} from "../parsing-interfaces";


@Injectable({
    providedIn: 'root'
})
export class RealTimeUpdateService {

    // Коллекция действующих observable
    watchCacheMap: { [hash: string]: Observable<any> } = {}

    constructor(readonly stomp: StompClientService) {
    }

    commentCreated(taskId: number) {
        return this.watch<Comment>(`/task/${taskId}/comment/create`)
    }

    commentUpdated(taskId: number) {
        return this.watch<Comment>(`/task/${taskId}/comment/update`)
    }

    commentDeleted(taskId: number) {
        return this.watch<Comment>(`/task/${taskId}/comment/delete`)
    }

    taskEventCreated(taskId: number) {
        return this.watch<TaskEvent>(`/task/${taskId}/event/create`)
    }

    employeeUpdated(login?: string) {
        if (login) return this.watch<Employee>(`/employee/${login}/update`)
        return this.watch<Employee>(`/employee/update`)
    }

    taskTagCreated() {
        return this.watch<TaskTag>(`/task-tag/create`)
    }

    taskTagUpdated() {
        return this.watch<TaskTag>(`/task-tag/update`)
    }

    taskTagDeleted() {
        return this.watch<TaskTag>(`/task-tag/delete`)
    }

    taskUpdated(taskId?: number) {
        if (taskId) return this.watch<Task>(`/task/${taskId}/update`)
        return this.watch<Task>(`/task/update`)
    }

    taskDeleted(taskId?: number) {
        if (taskId) return this.watch<Task>(`/task/${taskId}/delete`)
        return this.watch<Task>(`/task/delete`)
    }

    taskCreated() {
        return this.watch<Task>(`/task/create`)
    }

    notificationCreated(login: string) {
        return this.watch<any>(`/user/${login}/notification/create`)
    }

    notificationUpdated(login: string) {
        return this.watch<any>(`/user/${login}/notification/update`)
    }

    chatMessageCreated(chatId: number) {
        return this.watch<ChatMessage>(`/chat/${chatId}/message/create`)
    }

    updateTrackerParserState() {
        return this.watch<OldTracker>(`/parser/tracker/update`)
    }

    parserMessageReceived() {
        return this.watch<SimpleMessage>(`/parser/message`)
    }

    private watch<T>(destination: string): Observable<T> {
        // Генерируем хэш запроса на основе конечной точки и параметров запроса
        const requestHash = this.generateHash(destination);
        // Объявляем результирующий observable
        let observable: Observable<T> | null = null;
        // Если запрос не в кэше, создаем его
        if (!this.watchCacheMap[requestHash]) {
            observable = this.stomp.watch(destination)
                .pipe(
                    finalize(this.deleteFromCache.bind(this, destination)),
                    share(),
                    map(msg => <T>JSON.parse(msg.body)),
                )
            this.watchCacheMap[requestHash] = observable;
        } else {
            // Если запрос в кэше, возвращаем его
            observable = this.watchCacheMap[requestHash];
        }
        return observable;
    }

    // Генерируем хэш наблюдателя по месту назначения
    private generateHash(destination: string) {
        return cyrb53(destination, 0);
    }

    // Удаляет observable из кэша
    private deleteFromCache(hash: string) {
        delete this.watchCacheMap[hash];
    }
}
