import * as React from 'react';
type Data = {
    errors: string[];
    active: boolean;
    progress: number;
    item: string;
    loaded: number;
    total: number;
};
declare const useProgress: import("zustand").UseBoundStore<import("zustand").StoreApi<Data>>;
export { useProgress };
export declare function Progress({ children }: {
    children?: (result: Data) => React.ReactNode;
}): React.JSX.Element;
