import { VNode } from 'snabbdom';

export type MaybeVNodes = VNode | (VNode | string | undefined)[];
export type Redraw = (ui: VNode) => void;

declare global {
  interface JQuery {
    bootstrapTable: (arg1: any, arg2?: any) => void;
  }
}
