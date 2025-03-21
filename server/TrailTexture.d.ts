import * as React from 'react';
import { Texture } from 'three';
type TrailConfig = {
    size?: number;
    maxAge?: number;
    radius?: number;
    intensity?: number;
    interpolate?: number;
    smoothing?: number;
    minForce?: number;
    blend?: CanvasRenderingContext2D['globalCompositeOperation'];
    ease?: (t: number) => number;
};
export declare function useTrailTexture(config?: Partial<TrailConfig>): [Texture, (ThreeEvent: any) => void];
export type TrailTextureProps = {
    children?: (texture: ReturnType<typeof useTrailTexture>) => React.ReactNode;
} & TrailConfig;
export declare const TrailTexture: ({ children, ...config }: TrailTextureProps) => React.JSX.Element;
export {};
