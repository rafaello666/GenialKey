import type { StaticGenerationAsyncStorage } from '../../client/components/static-generation-async-storage.external';
import type * as ServerHooks from '../../client/components/hooks-server-context';
export declare function validateTags(tags: any[], description: string): string[];
export declare function addImplicitTags(staticGenerationStore: ReturnType<StaticGenerationAsyncStorage['getStore']>): string[];
interface PatchableModule {
    serverHooks: typeof ServerHooks;
    staticGenerationAsyncStorage: StaticGenerationAsyncStorage;
}
export declare function patchFetch({ serverHooks, staticGenerationAsyncStorage, }: PatchableModule): void;
export {};
