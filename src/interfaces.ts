import { VNode } from 'snabbdom';

export type MaybeVNodes = VNode | (VNode | string | undefined)[];
export type Redraw = (ui: VNode) => void;
