import * as React from 'react';
import { Texture } from 'three';
export declare function useKTX2<Url extends string[] | string | Record<string, string>>(input: Url, basisPath?: string): Url extends any[] ? Texture[] : Url extends object ? {
    [key in keyof Url]: Texture;
} : Texture;
export declare namespace useKTX2 {
    var preload: (url: string extends any[] ? string[] : string, basisPath?: string) => void;
    var clear: (input: string | string[]) => void;
}
export declare const Ktx2: ({ children, input, basisPath, }: {
    children?: (texture: ReturnType<typeof useKTX2>) => React.ReactNode;
    input: Parameters<typeof useKTX2>[0];
    basisPath?: Parameters<typeof useKTX2>[1];
}) => React.JSX.Element;
