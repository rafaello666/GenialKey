import { ModuleMetadata, Type } from '@nestjs/common';
export interface IAuthModuleOptions {
    defaultStrategy?: string | string[];
    session?: boolean;
    property?: string;
    [key: string]: any;
}
export interface AuthOptionsFactory {
    createAuthOptions(): Promise<IAuthModuleOptions> | IAuthModuleOptions;
}
export interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<AuthOptionsFactory>;
    useClass?: Type<AuthOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<IAuthModuleOptions> | IAuthModuleOptions;
    inject?: any[];
}
export declare class AuthModuleOptions implements IAuthModuleOptions {
    defaultStrategy?: string | string[];
    session?: boolean;
    property?: string;
}
