import * as React from 'react';
import { ThreeElements, Vector3 } from '@react-three/fiber';
import * as THREE from 'three';
import { Instances, Instance } from './Instances';
import { SpriteData } from './useSpriteLoader';
type AnimationEventData = {
    currentFrameName: string;
    currentFrame: number;
};
type CommonProps<T, U, V> = Pick<T & U & V, keyof T & keyof U & keyof V>;
type CommonMeshProps = CommonProps<React.ComponentProps<'mesh'>, React.ComponentProps<typeof Instance>, React.ComponentProps<typeof Instances>>;
export type SpriteAnimatorProps = {
    startFrame?: number;
    endFrame?: number;
    fps?: number;
    frameName?: string;
    textureDataURL?: string;
    textureImageURL?: string;
    loop?: boolean;
    numberOfFrames?: number;
    autoPlay?: boolean;
    animationNames?: Array<string>;
    onStart?: (data: AnimationEventData) => void;
    onEnd?: (data: AnimationEventData) => void;
    onLoopEnd?: (data: AnimationEventData) => void;
    onFrame?: (data: AnimationEventData) => void;
    play?: boolean;
    pause?: boolean;
    flipX?: boolean;
    alphaTest?: number;
    asSprite?: boolean;
    offset?: number;
    playBackwards?: boolean;
    resetOnEnd?: boolean;
    instanceItems?: Vector3[];
    maxItems?: number;
    spriteDataset?: {
        spriteTexture: THREE.Texture;
        spriteData: SpriteData | null;
        aspect: Vector3;
    } | null;
    canvasRenderingContext2DSettings?: CanvasRenderingContext2DSettings;
    roundFramePosition?: boolean;
    meshProps?: CommonMeshProps;
} & Omit<ThreeElements['group'], 'ref'>;
type SpriteAnimatorState = {
    current?: number;
    offset?: number;
    imageUrl?: string;
    hasEnded: boolean;
    ref: React.Ref<THREE.Group>;
};
export declare function useSpriteAnimator(): SpriteAnimatorState | null;
export declare const SpriteAnimator: React.ForwardRefExoticComponent<{
    startFrame?: number;
    endFrame?: number;
    fps?: number;
    frameName?: string;
    textureDataURL?: string;
    textureImageURL?: string;
    loop?: boolean;
    numberOfFrames?: number;
    autoPlay?: boolean;
    animationNames?: Array<string>;
    onStart?: (data: AnimationEventData) => void;
    onEnd?: (data: AnimationEventData) => void;
    onLoopEnd?: (data: AnimationEventData) => void;
    onFrame?: (data: AnimationEventData) => void;
    play?: boolean;
    pause?: boolean;
    flipX?: boolean;
    alphaTest?: number;
    asSprite?: boolean;
    offset?: number;
    playBackwards?: boolean;
    resetOnEnd?: boolean;
    instanceItems?: Vector3[];
    maxItems?: number;
    spriteDataset?: {
        spriteTexture: THREE.Texture;
        spriteData: SpriteData | null;
        aspect: Vector3;
    } | null;
    canvasRenderingContext2DSettings?: CanvasRenderingContext2DSettings;
    roundFramePosition?: boolean;
    meshProps?: CommonMeshProps;
} & Omit<import("@react-three/fiber/dist/declarations/src/core/utils").Mutable<import("@react-three/fiber/dist/declarations/src/core/utils").Overwrite<Partial<import("@react-three/fiber/dist/declarations/src/core/utils").Overwrite<THREE.Group<THREE.Object3DEventMap>, import("@react-three/fiber").MathProps<THREE.Group<THREE.Object3DEventMap>> & import("@react-three/fiber").ReactProps<THREE.Group<THREE.Object3DEventMap>> & Partial<import("@react-three/fiber").EventHandlers>>>, Omit<import("@react-three/fiber").InstanceProps<THREE.Group<THREE.Object3DEventMap>, typeof THREE.Group>, "object">>>, "ref"> & React.RefAttributes<THREE.Group<THREE.Object3DEventMap>>>;
export {};
