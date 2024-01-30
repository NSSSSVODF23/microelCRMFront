export class AccessFlag {
    static readonly BILLING = 1;
    static readonly MANAGE_SUBSCRIBERS = 2;
    static readonly MANAGE_CASH = 4;
    static readonly MANAGE_RECALCULATION = 8;
    static readonly MANAGE_EMPLOYEES = 16;
    static readonly EDIT_HOUSE_ADDRESS_BOOK = 32;
    static readonly EDIT_ADDRESS_BOOK = 64;
    static readonly VIEW_SWITCH = 128;
    static readonly EDIT_SWITCH = 256;
    static readonly MANAGE_DEPARTMENTS = 512;
    static readonly MANAGE_POSITIONS = 1024;
    static readonly COUNT_SALARY = 2048;
    static readonly EDIT_PRICE = 4096;
    static readonly READ_WRITE_FILES = 8192;
    static readonly EDIT_TASK_TEMPLATES = 16384;
    static readonly EDIT_TASK_TAGS = 32768;
    static readonly EDIT_DEVICES = 65536;
    static readonly MANAGE_SYSTEM_SETTINGS = 131072;

    static getName(flag: number) {
        if (flag === 1) return 'Доступ к биллингу';
        if (flag === 2) return 'Управление абонентами';
        if (flag === 4) return 'Проведение оплаты через кассу';
        if (flag === 8) return 'Проведение перерасчетов';
        if (flag === 16) return 'Управление сотрудниками';
        if (flag === 32) return 'Редактирование домов в адресной';
        if (flag === 64) return 'Редактирование адресной книги';
        if (flag === 128) return 'Просмотр коммутаторов';
        if (flag === 256) return 'Редактирование коммутаторов';
        if (flag === 512) return 'Управление отделами';
        if (flag === 1024) return 'Управление должностями';
        if (flag === 2048) return 'Подсчет зарплаты';
        if (flag === 4096) return 'Редактирование прайса';
        if (flag === 8192) return 'Чтение/Запись файлов';
        if (flag === 16384) return 'Редактирование шаблонов задач';
        if (flag === 32768) return 'Редактирование тегов задач';
        if (flag === 65536) return 'Редактирование оборудований абонентов';
        if (flag === 131072) return 'Управление системными настройками';
        return flag.toString() + ' (Неизвестно)';
    }

    static flagList() {
        return this.array().map(f => {
            return {name: this.getName(f), value: f}
        })
    }

    static read(flags: number): number[] {
        const extractedFlags = [];
        for (const flag of AccessFlag.array()) if (flags & flag) extractedFlags.push(flag);
        return extractedFlags;
    }

    static array() {
        return Object.values(AccessFlag);
    }

    static isHasFlag(flags: number, ...flag: number[]) {
        return flag.some(f => (flags & f) === f);
    }

    static trackByFlag(index: number, flag: { name: string, value: number }) {
        return flag.value;
    }
}
