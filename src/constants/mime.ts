export const SUPPORTED_IMAGE_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
export const SUPPORTED_PDF_MIME = new Set(['application/pdf']);
export const SUPPORTED_AUDIO_MIME = new Set([
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/m4a',
]);

export const SUPPORTED_TEXTABLE_EXT = new Set<string>([
  '.txt', '.text', '.log', '.err', '.out', '.md', '.mdx', '.markdown', '.rst', '.adoc', '.asciidoc',
  '.tex', '.ltx', '.bib', '.org', '.csv', '.tsv', '.psv', '.ssv', '.tab',
  '.json', '.jsonl', '.ndjson', '.json5', '.jsonc', '.hjson', '.map',
  '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.config', '.cnf', '.properties', '.prop', '.env',
  '.lock', '.tmpl', '.template',
  '.xml', '.dtd', '.xsd', '.xsl', '.xslt', '.svg', '.html', '.htm', '.xhtml', '.shtml',
  '.css', '.scss', '.sass', '.less', '.styl',
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro',
  '.py', '.pyi', '.pyw', '.rb', '.gemspec', '.rake', '.erb', '.haml',
  '.php', '.phtml', '.php3', '.php4', '.php5',
  '.pl', '.pm', '.t', '.lua', '.r', '.jl', '.go', '.rs', '.ron',
  '.java', '.gradle', '.groovy', '.kt', '.kts', '.scala', '.sbt',
  '.c', '.h', '.i', '.ii', '.cpp', '.cxx', '.cc', '.hpp', '.hh', '.hxx', '.m', '.mm',
  '.cs', '.csx', '.vb', '.fs', '.fsi', '.fsx',
  '.sql', '.psql', '.graphql', '.gql', '.proto', '.thrift', '.avdl', '.avsc',
  '.hcl', '.tf', '.tfvars', '.cue', '.rego', '.nix', '.bzl', '.bazel', '.cmake', '.mk', '.mak', '.make',
  '.diff', '.patch', '.eml', '.ics',
]);

// ✅ 按扩展名识别 Office（保持名称与含义一致）
export const SUPPORTED_OFFICE_EXT = new Set<string>(['.docx', '.xlsx', '.pptx']);

export const guessAudioFormat = (filename: string) => {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.wav')) return 'wav';
  if (lower.endsWith('.mp3')) return 'mp3';
  if (lower.endsWith('.m4a')) return 'm4a';
  if (lower.endsWith('.aac')) return 'aac';
  return 'wav';
};
