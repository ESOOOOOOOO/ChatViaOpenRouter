import React, { useMemo, useState } from 'react'; // 'React' 需要被导入才能使用 JSX
import hljs from "highlight.js";
import markdownit from 'markdown-it';
import { Button, message } from 'antd'; // 导入 message 以修复 handleCopy 中的错误
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import './CodeBlockRenderer.css';
import 'highlight.js/styles/stackoverflow-light.css'
import DotsLoading from './loadingAnimate';

// 修正 1: 直接创建 markdown-it 实例，不要使用 useMemo
const md = markdownit({ html: true, breaks: true });

// 修正 2: 先定义 CodeBlock 组件，因为它被 RenderMessageContent 使用

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
    const [copied, setCopied] = useState(false);

    const displayLanguage = useMemo(() => {
        if (!language) return 'Code';
        return language.charAt(0).toUpperCase() + language.slice(1);
    }, [language]);

    const highlightedCode = useMemo(() => {
        if (language && hljs.getLanguage(language)) {
            try {
                return hljs.highlight(code, { language, ignoreIllegals: true }).value;
            } catch (__) { }
        }
        return hljs.highlightAuto(code).value;
    }, [code, language]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            message.success('Copied!'); // 可以给用户一个成功提示
        } catch (err) {
            console.error('Failed to copy code:', err);
            message.error('Failed to copy!');
        }
    };

    return (
        <div className="code-block-container">
            <div className="code-header">
                <div className="code-header-left">
                    <div className="traffic-lights">
                        <span className="dot green" />
                    </div>
                    <span className="language-name">{displayLanguage}</span>
                </div>
                <Button
                    icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={handleCopy}
                    type="text"
                    size="small"
                    className="code-copy-btn"
                >
                    {copied ? 'Copied' : 'Copy'}
                </Button>
            </div>
            <div className="code-content">
                <pre className="hljs">
                    <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                </pre>
            </div>
        </div>
    );
};


// 然后定义 RenderMessageContent 组件

interface MessageContentProps {
  content: string;
  isTitle: boolean;
}

const RenderMessageContent: React.FC<MessageContentProps> = ({ content, isTitle }) => {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    if (content == ""){ return (<DotsLoading />)}

    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            const textPart = content.substring(lastIndex, match.index);
            parts.push(
                <div
                    key={`text-${lastIndex}`}
                    className={isTitle?"title-content":"markdown-content"}
                    dangerouslySetInnerHTML={{ __html: md.render(textPart) }}
                />
            );
        }
        const language = match[1] || '';
        const code = match[2].trim();
        parts.push(<CodeBlock key={`code-${match.index}`} language={language} code={code} />);
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        const remainingText = content.substring(lastIndex);
        parts.push(
            <div
                key={`text-${lastIndex}`}
                className={isTitle?"title-content":"markdown-content"}
                dangerouslySetInnerHTML={{ __html: md.render(remainingText) }}
            />
        );
    }

    if (parts.length === 0 && content) {
        return (
            <div
                className={isTitle?"title-content":"markdown-content"}
                dangerouslySetInnerHTML={{ __html: md.render(content) }}
            />
        );
    }

    return <>{parts}</>;
};

export default RenderMessageContent;