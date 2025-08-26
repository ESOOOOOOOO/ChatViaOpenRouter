export const SHORTCUTS_FIELD = 'shortcuts';
export const SHORTCUTS_MAX = 5;


export type Shortcut = { name: string; prompt: string };


export const DEFAULT_SHORTCUTS: Shortcut[] = [
{ name: 'Translate to Chinese', prompt: 'Translate the following sentence into Chinese:' },
{ name: 'Summarize in Chinese', prompt: 'Summarize the following sentence into Chinese:' },
];


/** 将任意输入规范化为 Shortcut[]，并裁剪到上限 */
export const normalizeShortcuts = (raw: unknown): Shortcut[] => {
let list: Shortcut[] = [];
if (Array.isArray(raw)) {
list = raw
.filter(x => x && typeof x === 'object' && typeof (x as any).name === 'string' && typeof (x as any).prompt === 'string')
.map(x => ({ name: (x as any).name, prompt: (x as any).prompt }));
} else if (raw && typeof raw === 'object') {
const obj = raw as any;
if (typeof obj.name === 'string' && typeof obj.prompt === 'string') {
list = [{ name: obj.name, prompt: obj.prompt }];
}
}
return list.slice(0, SHORTCUTS_MAX);
};