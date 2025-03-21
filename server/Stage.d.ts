import * as React from 'react';
import { EnvironmentProps } from './Environment';
import { ContactShadowsProps } from './ContactShadows';
import { CenterProps } from './Center';
import { AccumulativeShadowsProps, RandomizedLightProps } from './AccumulativeShadows';
import { PresetsType } from '../helpers/environment-assets';
import { ThreeElements } from '@react-three/fiber';
type StageShadows = Partial<AccumulativeShadowsProps> & Partial<RandomizedLightProps> & Partial<ContactShadowsProps> & {
    type: 'contact' | 'accumulative';
    offset?: number;
    bias?: number;
    normalBias?: number;
    size?: number;
};
export type StageProps = Omit<ThreeElements['group'], 'ref'> & {
    preset?: 'rembrandt' | 'portrait' | 'upfront' | 'soft' | {
        main: [x: number, y: number, z: number];
        fill: [x: number, y: number, z: number];
    };
    shadows?: boolean | 'contact' | 'accumulative' | StageShadows;
    adjustCamera?: boolean | number;
    environment?: PresetsType | Partial<EnvironmentProps> | null;
    intensity?: number;
    center?: Partial<CenterProps>;
};
export declare function Stage({ children, center, adjustCamera, intensity, shadows, environment, preset, ...props }: StageProps): React.JSX.Element;
export {};
