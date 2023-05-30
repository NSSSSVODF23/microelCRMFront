import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {EplNamePipe} from "../../pipes/epl-name.pipe";
import {ElapsedTimePipe} from "../../pipes/elapsed-time.pipe";
import {TaskStatusPipe} from "../../pipes/task-status.pipe";
import {TaskEventTranslatePipe} from "../../pipes/task-event-translate.pipe";
import {ModelItemValuePipe} from "../../pipes/model-item-value.pipe";
import {FloorPipe} from "../../pipes/floor.pipe";


@NgModule({
    declarations: [
        EplNamePipe,
        ElapsedTimePipe,
        TaskStatusPipe,
        TaskEventTranslatePipe,
        ModelItemValuePipe,
        FloorPipe
    ],
    imports: [
        CommonModule
    ],
    exports: [
        EplNamePipe,
        ElapsedTimePipe,
        TaskStatusPipe,
        TaskEventTranslatePipe,
        ModelItemValuePipe,
        FloorPipe
    ]
})
export class CommonPipesModule {
}
