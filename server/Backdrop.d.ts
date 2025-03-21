import { ThreeElements } from '@react-three/fiber';
import * as React from 'react';
export type BackdropProps = ThreeElements['group'] & {
    floor?: number;
    segments?: number;
    receiveShadow?: boolean;
    children?: React.ReactNode;
};
export declare function Backdrop({ children, floor, segments, receiveShadow, ...props }: {
    [x: string]: any;
    children: any;
    floor?: number | undefined;
    segments?: number | undefined;
    receiveShadow: any;
}): React.JSX.Element;
