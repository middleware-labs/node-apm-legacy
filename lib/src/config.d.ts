import { ResourceAttributes } from "@opentelemetry/resources";
export interface Config {
    pauseTraces: Boolean | number;
    DEBUG: Boolean | number;
    host: string;
    projectName: string;
    serviceName: string;
    port: {
        grpc: number;
        fluent: number;
    };
    target: string;
    accessToken: string;
    tenantID: string;
    mwAuthURL: string;
    consoleLog: boolean;
    consoleError: boolean;
    meterProvider: any;
    isServerless: boolean;
    customResourceAttributes: ResourceAttributes;
}
export declare let configDefault: Config;
export declare const init: (config?: Partial<Config>) => Config;
