import {DateRange, Page, SchedulingType} from "./transport-interfaces";

export interface TaskFilterOptions {
    status?: 'ACTIVE' | 'PROCESSING' | 'CLOSE',
    cls?: number | null,
    type?: string | null,
    directory?: number | null,
    tag?: number | null,
    schedulingType?: SchedulingType | null,
    dateOfClose?: DateRange | null,
    actualFrom?: DateRange | null,
    actualTo?: DateRange | null
}

export class EmptyPage implements Page<any>{
    content = [];
    empty = true;
    first = true;
    last = true;
    number = 0;
    numberOfElements = 0;
    pageable = { offset: 0, sort: { empty: true, sorted: false, unsorted: true }, pageSize: 0, pageNumber: 0, paged: true, unpaged: false }
    size = 0;
    sort = { empty: true, sorted: false, unsorted: true }
    totalElements = 0;
    totalPages = 0;
}

export interface TableFilter {
    first: number,
    rows: number,
    sortField?: string,
    sortOrder?: number,
    multiSortMeta?: { field: string, order: number }[],
    filters?: { [key: string]: any }
    globalFilter?: string
}

export interface DhcpBindingFilter {
    size?: number,
    status?: 'online' | 'offline',
    sort?: {filter: string, order: number}[],
}
