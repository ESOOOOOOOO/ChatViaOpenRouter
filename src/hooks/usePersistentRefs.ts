import { useEffect, useRef } from 'react';


/**
* CN: 保持某个 state 的“最新值”在 ref 中，避免闭包陈旧值。
* EN: Mirror latest state value into a ref to avoid stale closures.
*/
export function usePersistentRef<T>(value: T) {
const ref = useRef<T>(value);
useEffect(() => { ref.current = value; }, [value]);
return ref;
}