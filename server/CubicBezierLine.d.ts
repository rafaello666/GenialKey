import { Vector3 } from 'three';
import { Line2 } from 'three-stdlib';
import { LineProps } from './Line';
import { ForwardRefComponent } from '../helpers/ts-utils';
export type CubicBezierLineProps = Omit<LineProps, 'points' | 'ref'> & {
    start: Vector3 | [number, number, number];
    end: Vector3 | [number, number, number];
    midA: Vector3 | [number, number, number];
    midB: Vector3 | [number, number, number];
    segments?: number;
};
export declare const CubicBezierLine: ForwardRefComponent<CubicBezierLineProps, Line2>;
