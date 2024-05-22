//@Data
//     public static class LogsForm {
//         private Date hdate;
//         private Date edate;
//         private Integer page;
//         private Integer plen;
//         private String login;
//
//         public Map<String, String> toRequestBody(){
//             Map<String, String> body = new HashMap<>();
//
//             SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
//
//             body.put("period.hdate", sdf.format(hdate));
//             body.put("period.edate", sdf.format(edate));
//             body.put("filtr.__page", page.toString());
//             body.put("filtr.__plen", plen.toString());
//             body.put("filtr.__filtr_name", "stat");
//             body.put("filtr.login", login);
//             body.put("filtr._sel_login", "0");
//             body.put("filtr._sel_hdate", "0");
//             body.put("filtr._sel_htime", "0");
//             body.put("filtr._sel_edate", "0");
//             body.put("filtr._sel_etime", "0");
//             body.put("filtr.service", "");
//             body.put("filtr.cause", "0");
//             body.put("filtr._sel_cid", "0");
//             body.put("filtr.ip", "");
//             body.put("__act", "oldstat-stat");
//
//             return body;
//         }
//     }
//
//     @Data
//     public static class LogItem {
//         private Timestamp timestamp;
//         private String action;
//         private String description;
//         private Float amount;
//         private Float balance;
//
//         public static LogItem of(String date, String time, String action, String description, String amount, String balance) {
//             LogItem logItem = new LogItem();
//             logItem.setTimestamp(Timestamp.valueOf(date + " " + time));
//             logItem.setAction(action);
//             logItem.setDescription(description);
//             logItem.setAmount(Float.parseFloat(amount));
//             logItem.setBalance(Float.parseFloat(balance));
//             return logItem;
//         }
//     }

import {DateRange} from "./transport-interfaces";

export interface LogsForm {
    dateRange: DateRange;
    page: number;
    plen: number;
    login: string;
}

export interface LogItem {
    timestamp: string;
    action: string;
    description: string;
    amount: number;
    balance: number;
}
