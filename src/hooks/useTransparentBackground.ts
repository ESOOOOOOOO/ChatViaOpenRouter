import { useEffect } from 'react';


/**
* 注入透明背景 CSS，组件卸载时清理
*/
export const useTransparentBackground = () => {
useEffect(() => {
const styleEl = document.createElement('style');
styleEl.setAttribute('data-injected', 'tauri-bg-fix');
styleEl.innerHTML = `
html, body, #root { height: 100%; width: 100%; background: transparent !important; }
body { margin: 0; padding: 0; }
.supports-backdrop { backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
`;
document.head.appendChild(styleEl);
document.documentElement.style.backgroundColor = 'transparent';
document.body.style.backgroundColor = 'transparent';


return () => {
styleEl.remove();
};
}, []);
};