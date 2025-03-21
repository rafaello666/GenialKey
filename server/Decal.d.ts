import * as React from 'react';
import * as THREE from 'three';
import * as FIBER from '@react-three/fiber';
import { ForwardRefComponent } from '../helpers/ts-utils';
export type DecalProps = Omit<FIBER.ThreeElements['mesh'], 'ref' | 'children'> & {
    debug?: boolean;
    mesh?: React.RefObject<THREE.Mesh>;
    position?: FIBER.Vector3;
    rotation?: FIBER.Euler | number;
    scale?: FIBER.Vector3;
    map?: THREE.Texture;
    children?: React.ReactNode;
    polygonOffsetFactor?: number;
    depthTest?: boolean;
};
export declare const Decal: ForwardRefComponent<DecalProps, THREE.Mesh>;
