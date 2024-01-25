import {Injectable} from '@angular/core';
import {Storage} from "../util";

@Injectable({
    providedIn: 'root'
})
export class CommentCachingService {

    private readonly cachingMap: {[key: number]:string}= {};

    constructor() {
        const COMMENTS_FROM_STORAGE = Storage.loadOrDefault('commentCaching', '{}');
        this.cachingMap = JSON.parse(COMMENTS_FROM_STORAGE);
    }

    read(id: number) {
        return this.cachingMap[id] ?? '';
    }

    write(id: number, comment: string) {
        if(comment === ''){
            this.flush(id);
            return;
        }
        this.cachingMap[id] = comment;
        Storage.save('commentCaching', JSON.stringify(this.cachingMap));
    }

    flush(id: number) {
        delete this.cachingMap[id];
        Storage.save('commentCaching', JSON.stringify(this.cachingMap));
    }
}
