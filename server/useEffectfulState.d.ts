import * as React from 'react';
type RefType<T> = React.RefObject<T> | ((state: T) => void);
export declare function useEffectfulState<T>(fn: () => T, deps?: React.DependencyList, cb?: RefType<T>): T | undefined;
export {};
