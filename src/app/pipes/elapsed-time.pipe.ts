import {Pipe, PipeTransform} from '@angular/core';
import {Utils} from "../util";

@Pipe({
    name: 'elapsedTime'
})
export class ElapsedTimePipe implements PipeTransform {

    transform(value: any, prefix?: string, suffix?: string, prepared?: boolean, days?: boolean): string {
        let date: Date | undefined = undefined;
        let diff: number;
        if (!prepared) {
            date = new Date(value);
            if (date.toString() === "Invalid Date") return 'Не верная дата';
            diff = Math.abs(Date.now() - date.getTime());
        } else {
            diff = value;
        }

        const hours = Math.floor((diff / (1000 * 60 * 60)));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        /*
          If the number of hours is greater than zero and less than 12, then we return only hours,
           otherwise we check the number of minutes;
            if it is greater than zero, then we return them, otherwise we return seconds
         */
        if(days && hours > 0){
            if(hours<24){
                return `${prefix}${hours} ${Utils.declineOfNumber(hours, ["час", "часа", "часов"])}${suffix}`;
            }else{
                const daysNum = Math.floor(hours/24);
                const restOfHours = Math.floor(hours % 24);
                return `${prefix}${daysNum} ${Utils.declineOfNumber(daysNum, ["день", "дня", "дней"])} ${restOfHours} ${Utils.declineOfNumber(restOfHours, ["час", "часа", "часов"])}${suffix}`;
            }
        }
        if (hours > 0 && hours < 13) return `${prefix}${hours} ${Utils.declineOfNumber(hours, ["час", "часа", "часов"])}${suffix}`;
        else if (hours === 0 && minutes > 0) return `${prefix}${minutes} ${Utils.declineOfNumber(minutes, ["минуту", "минуты", "минут"])}${suffix}`;
        else if (hours === 0 && minutes === 0 && seconds > 0) return `${prefix}${seconds} ${Utils.declineOfNumber(seconds, ["секунду", "секунды", "секунд"])}${suffix}`;
        else if (hours === 0 && minutes === 0 && seconds === 0) return `${prefix}${diff.toFixed(2)} ${Utils.declineOfNumber(diff, ["мс", "мс", "мс"])}${suffix}`;
        else if (!prepared && date) return date.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
        else return '';
    }
}
