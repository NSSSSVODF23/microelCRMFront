import {StompClientService} from "./services/stomp-client.service";

export const rxStompConfig = () => {
    console.log(localStorage.getItem('token'));
    return {
        // Which server?
        brokerURL: 'ws://localhost:8080/socket',

        // Headers
        // Typical keys: login, passcode, host
        connectHeaders: {
            passcode: 'guest',
            login: localStorage.getItem('token') ?? ''
        },

        // How often to heartbeat?
        // Interval in milliseconds, set to 0 to disable
        heartbeatIncoming: 0, // Typical value 0 - disabled
        heartbeatOutgoing: 20000, // Typical value 20000 - every 20 seconds

        // Wait in milliseconds before attempting auto reconnect
        // Set to 0 to disable
        // Typical value 500 (500 milli seconds)
        reconnectDelay: 200,

        // Will log diagnostics on console
        // It can be quite verbose, not recommended in production
        // Skip this key to stop logging to console
        debug: (msg: string): void => {
            // console.log(new Date(), msg);
        },
    }
};

export function stompFactory() {
    const stompClient = new StompClientService()
    stompClient.configure(rxStompConfig());
    stompClient.activate()
    return stompClient;
}
