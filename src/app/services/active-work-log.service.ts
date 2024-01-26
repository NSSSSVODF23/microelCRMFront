import { Injectable } from '@angular/core';
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {EmployeeWorkLogs} from "../types/transport-interfaces";

@Injectable({
  providedIn: 'root'
})
export class ActiveWorkLogService {

  employeeWorkLogs: EmployeeWorkLogs[] = [];

  constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    this.api.getEmployeeWorkLogs().subscribe(data => {
      this.employeeWorkLogs = data;
    })
  }
}
