import {buffer, delay, filter, OperatorFunction, share} from "rxjs";

export function bufferUntil<T>(predicate:(value:T) => boolean):OperatorFunction<T, T[]>
{
    return function(source)
    {
        const share$ = source.pipe(share());
        const until$ = share$.pipe(filter(predicate), delay(0));
        return share$.pipe(buffer(until$));
    };
}
