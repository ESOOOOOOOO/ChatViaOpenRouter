/** 文本类扩展名集合（与原逻辑保持一致） */
const TEXTABLE_EXTS = new Set([
'.txt', '.text', '.log', '.err', '.out',
'.md', '.mdx', '.markdown', '.rst', '.adoc', '.asciidoc', '.tex', '.ltx', '.bib', '.org',
'.csv', '.tsv', '.psv', '.ssv', '.tab',
'.json', '.jsonl', '.ndjson', '.json5', '.jsonc', '.hjson', '.map',
'.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.config', '.cnf', '.properties', '.prop', '.env', '.lock', '.tmpl', '.template',
'.xml', '.dtd', '.xsd', '.xsl', '.xslt', '.svg',
'.html', '.htm', '.xhtml', '.shtml',
'.css', '.scss', '.sass', '.less', '.styl',
'.js', '.mjs', '.cjs', '.jsx',
'.ts', '.tsx',
'.vue', '.svelte', '.astro',
'.py', '.pyi', '.pyw',
'.rb', '.gemspec', '.rake', '.erb', '.haml',
'.php', '.phtml', '.php3', '.php4', '.php5',
'.pl', '.pm', '.t',
'.lua',
'.r', '.jl',
'.go',
'.rs', '.ron',
'.java', '.gradle', '.groovy',
'.kt', '.kts',
'.scala', '.sbt',
'.c', '.h', '.i', '.ii', '.cpp', '.cxx', '.cc', '.hpp', '.hh', '.hxx', '.m', '.mm',
'.cs', '.csx', '.vb', '.fs', '.fsi', '.fsx',
'.sql', '.psql',
'.graphql', '.gql',
'.proto', '.thrift', '.avdl', '.avsc',
'.hcl', '.tf', '.tfvars', '.cue', '.rego', '.nix', '.bzl', '.bazel',
'.cmake', '.mk', '.mak', '.make',
'.diff', '.patch',
'.eml', '.ics',
'.xlsx', '.docx', '.pptx',
]);


export const getFileExt = (name?: string) => {
const lower = (name || '').toLowerCase();
const i = lower.lastIndexOf('.');
return i >= 0 ? lower.slice(i) : '';
};


export const isTextableByNameOrMime = (name?: string, mime?: string) => {
const ext = getFileExt(name);
if (TEXTABLE_EXTS.has(ext)) return true;
const m = (mime || '').toLowerCase();
return m.startsWith('text/');
};


export const readAsText = (blob: Blob) => new Promise<string>((resolve, reject) => {
const fr = new FileReader();
fr.onerror = () => reject(fr.error);
fr.onload = () => resolve(String(fr.result));
fr.readAsText(blob);
});


export const readAsDataURL = (blob: Blob) => new Promise<string>((resolve, reject) => {
const fr = new FileReader();
fr.onerror = () => reject(fr.error);
fr.onload = () => resolve(String(fr.result));
fr.readAsDataURL(blob);
});


export const readAsArrayBuffer = (blob: Blob) => new Promise<ArrayBuffer>((resolve, reject) => {
const fr = new FileReader();
fr.onerror = () => reject(fr.error);
fr.onload = () => resolve(fr.result as ArrayBuffer);
fr.readAsArrayBuffer(blob);
});


export const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
let binary = '';
const bytes = new Uint8Array(buffer);
for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
return btoa(binary);
};


export const guessAudioFormat = (filename = '') => {
const lower = filename.toLowerCase();
if (lower.endsWith('.wav')) return 'wav';
if (lower.endsWith('.mp3')) return 'mp3';
if (lower.endsWith('.m4a')) return 'm4a';
};