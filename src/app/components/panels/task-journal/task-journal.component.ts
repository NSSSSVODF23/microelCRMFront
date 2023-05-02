import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {Attachment, Comment, Employee, TaskEvent, TaskEventType} from "../../../transport-interfaces";
import {PersonalityService} from "../../../services/personality.service";
import {ConfirmationService} from "primeng/api";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {SubscriptionsHolder} from "../../../util";
import {fade} from "../../../animations";

@Component({
    selector: 'app-task-journal',
    templateUrl: './task-journal.component.html',
    styleUrls: ['./task-journal.component.scss'],
    animations: [
        fade
    ]
})
export class TaskJournalComponent implements OnInit, OnDestroy {

    rtSubscriptions: SubscriptionsHolder = new SubscriptionsHolder();

    @Input() replyComment?: Comment;
    @Output() replyCommentChange: EventEmitter<Comment> = new EventEmitter();

    @Input() editComment?: Comment;
    @Output() editCommentChange: EventEmitter<Comment> = new EventEmitter();

    entries: (Comment | TaskEvent)[] = [];
    skeletons: any[] = Array.from({length: 10})
    totalEntries = 0;
    loading = false;
    firstLoad = true;

    counters = []

    constructor(readonly api: ApiService, readonly personality: PersonalityService, readonly confirmation: ConfirmationService, readonly rt: RealTimeUpdateService) {

    }

    _taskId: number = -1;

    @Input() set taskId(value: number) {
        this._taskId = value;
        this.clearEntries();
        this.loadComments();

        this.rtSubscriptions.addSubscription('crCom', this.rt.commentCreated(value).subscribe(this.onCommentCreate.bind(this)))
        this.rtSubscriptions.addSubscription('crUpt', this.rt.commentUpdated(value).subscribe(this.onCommentUpdate.bind(this)))
        this.rtSubscriptions.addSubscription('crDel', this.rt.commentDeleted(value).subscribe(this.onCommentDelete.bind(this)))
        this.rtSubscriptions.addSubscription('crEv', this.rt.taskEventCreated(value).subscribe(this.onEventCreate.bind(this)));
        this.rtSubscriptions.addSubscription('empUpt', this.rt.employeeUpdated().subscribe(this.onEmployeeUpdate.bind(this)));
    }

    get taskId(): number {
        return this._taskId;
    }

    onCommentCreate(comment: Comment) {
        if (!this.entries.some(entry =>
            "commentId" in entry ? entry.commentId === comment.commentId : false
        )) {
            this.entries.unshift(comment);
            this.totalEntries++;
        }
    }

    onCommentDelete(comment: Comment) {
        // Find comment by id
        const entryIndex = this.entries.findIndex(entry => "commentId" in entry ? entry.commentId === comment.commentId : false);
        if (entryIndex !== -1) {
            this.entries.splice(entryIndex, 1);
            this.totalEntries--;
        }
    }

    onCommentUpdate(comment: Comment) {
        // Find comment by id
        const entryIndex = this.entries.findIndex(entry => "commentId" in entry ? entry.commentId === comment.commentId : false);
        if (entryIndex !== -1) {
            this.entries.splice(entryIndex, 1, comment);
        }
    }

    onEventCreate(event: TaskEvent) {
        if (!this.entries.some(entry =>
            "taskEventId" in entry ? entry.taskEventId === event.taskEventId : false
        )) {
            this.entries.unshift(event);
        }
    }

    ngOnDestroy(): void {
        this.rtSubscriptions.unsubscribeAll()
    }

    ngOnInit(): void {
    }

    loadComments() {
        if (!this._taskId) return
        const commentsCount = this.entries.filter(ent => 'commentId' in ent).length
        if (commentsCount < this.totalEntries)
            this.api.getTaskJournal(this._taskId, commentsCount, 10).subscribe(page => {
                if (this.entries.length === 0) this.totalEntries = page.totalElements;
                this.entries = [...this.entries, ...page.content];
                this.loading = false;
            })
        else if (this.firstLoad)
            this.api.getTaskJournal(this._taskId, 0, 10).subscribe(page => {
                this.totalEntries = page.totalElements;
                this.entries = page.content;
                this.loading = false;
                this.firstLoad = false
            })
        else
            this.loading = false;
    }

    isComment(entry: Comment | TaskEvent) {
        return "commentId" in entry;
    }

    isMyComment(entry: Comment | TaskEvent) {
        return "commentId" in entry && this.personality.me?.login === entry.creator?.login;
    }

    isAnActionOnComments() {
        return !!this.replyComment || !!this.editComment;
    }

    getEventIcon(entry: Comment | TaskEvent) {
        if ("type" in entry) {
            switch (entry.type) {
                case TaskEventType.CHANGE_STAGE:
                    return "swipe_right_alt";
                case TaskEventType.CREATE_WORK_LOG:
                    return "assignment";
                case TaskEventType.FORCE_CLOSE_WORK_LOG:
                    return "assignment_return";
                case TaskEventType.CLOSE_WORK_LOG:
                    return "assignment_return";
                case TaskEventType.CHANGE_RESPONSIBILITY:
                    return "person";
                case TaskEventType.LINKED_TO_PARENT_TASK:
                    return "link";
                case TaskEventType.UNLINKED_FROM_PARENT_TASK:
                    return "link_off";
                case TaskEventType.UNLINK_CHILD_TASK:
                    return "link_off";
                case TaskEventType.LINKED_TO_CHILD_TASKS:
                    return "link";
                case TaskEventType.CHANGE_TAGS:
                    return "label";
                case TaskEventType.CLEAN_TAGS:
                    return "label_off";
                case TaskEventType.CHANGE_OBSERVERS:
                    return "groups";
                case TaskEventType.UNBIND_RESPONSIBLE:
                    return "person_off";
                case TaskEventType.CHANGE_ACTUAL_FROM:
                    return "pending_actions";
                case TaskEventType.CHANGE_ACTUAL_TO:
                    return "today";
                case TaskEventType.CLEAR_ACTUAL_FROM_TASK:
                    return "alarm_off";
                case TaskEventType.CLEAR_ACTUAL_TO_TASK:
                    return "hourglass_disabled";
                case TaskEventType.CLOSE_TASK:
                    return "swipe_down_alt";
                case TaskEventType.REOPEN_TASK:
                    return "swipe_up_alt";
                case TaskEventType.EDIT_FIELDS:
                    return "edit";
                default:
                    return "adjust";
            }
        } else {
            return "comment";
        }
    }

    getEventColor(entry: Comment | TaskEvent) {
        if ("type" in entry) {
            switch (entry.type) {
                case TaskEventType.CHANGE_STAGE:
                    return "#289de7";
                case TaskEventType.CREATE_WORK_LOG:
                    return "#49DF30";
                case TaskEventType.FORCE_CLOSE_WORK_LOG:
                    return "#e81a30";
                case TaskEventType.CLOSE_WORK_LOG:
                    return "#e81a30";
                case TaskEventType.CHANGE_RESPONSIBILITY:
                    return "#ff9f3b";
                case TaskEventType.LINKED_TO_PARENT_TASK:
                    return "#9933ec";
                case TaskEventType.UNLINKED_FROM_PARENT_TASK:
                    return "#ef369d";
                case TaskEventType.UNLINK_CHILD_TASK:
                    return "#ef369d";
                case TaskEventType.LINKED_TO_CHILD_TASKS:
                    return "#9933ec";
                case TaskEventType.CHANGE_TAGS:
                    return "#13c587";
                case TaskEventType.CLEAN_TAGS:
                    return "#c73953";
                case TaskEventType.CHANGE_OBSERVERS:
                    return "#ff763b";
                case TaskEventType.UNBIND_RESPONSIBLE:
                    return "#3bdbff";
                case TaskEventType.CHANGE_ACTUAL_FROM:
                    return "#3bff3e";
                case TaskEventType.CHANGE_ACTUAL_TO:
                    return "#a7e52e";
                case TaskEventType.CLEAR_ACTUAL_FROM_TASK:
                    return "#c79436";
                case TaskEventType.CLEAR_ACTUAL_TO_TASK:
                    return "#a65c48";
                case TaskEventType.CLOSE_TASK:
                    return "#866e6e";
                case TaskEventType.REOPEN_TASK:
                    return "#1a7ae8";
                case TaskEventType.EDIT_FIELDS:
                    return "#61d78d";
                default:
                    return "#ff0000";
            }
        } else {
            return "#7a7f8d";
        }
    }

    hasAttachments(entry?: Comment | TaskEvent) {
        if (!entry) return false;
        return 'attachments' in entry && (entry.attachments?.length ?? 0) > 0
    }

    getAttachments(entry?: Comment | TaskEvent, firstThree: boolean = true) {
        if (!entry) return [];
        const attachments = 'attachments' in entry && entry.attachments ? entry.attachments : [];
        if (firstThree) {
            return attachments.slice(0, 3);
        } else {
            return attachments.slice(3);
        }
    }

    getAttachmentsCount(entry?: Comment | TaskEvent) {
        if (!entry) return 0;
        return 'attachments' in entry && entry.attachments ? entry.attachments.length : 0;
    }

    trackByAttachment(index: number, attachment: Attachment) {
        return attachment ? attachment.name : index;
    }

    selectCommentToReply(entry: Comment) {
        this.replyComment = entry;
        console.log(this.replyComment)
        this.replyCommentChange.emit(this.replyComment);
    }

    selectCommentToEdit(entry: Comment) {
        this.editComment = entry;
        this.editCommentChange.emit(this.editComment);
    }

    isHasReply(entry: Comment | TaskEvent) {
        return "replyComment" in entry && entry.replyComment;
    }

    getReplyComment(entry: Comment | TaskEvent) {
        return "replyComment" in entry ? entry.replyComment : undefined;
    }

    confirmToDeleteComment(entry: Comment) {
        this.confirmation.confirm({
            header: 'Удаление',
            message: 'Удалить комментарий?',
            accept: () => this.api.deleteComment(entry.commentId).subscribe()
        })
    }

    private onEmployeeUpdate(employee: Employee) {
        for (const entry of this.entries) {
            if(entry.creator?.login === employee.login) {
                entry.creator = employee;
            }
        }
    }

    private clearEntries() {
        this.entries = [];
        this.totalEntries = 0;
        this.firstLoad = true;
        this.counters = []
    }
}
