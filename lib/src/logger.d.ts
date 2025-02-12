import { Config } from './config';
declare const log: (level: string, message: string, attributes?: Record<string, any>) => void;
export declare const loggerInitializer: (config: Config) => void;
export { log };
