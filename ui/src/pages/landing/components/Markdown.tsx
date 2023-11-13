// Attribution: https://amirardalan.com/blog/syntax-highlight-code-in-markdown

import { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from "rehype-raw";
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import rangeParser from 'parse-numeric-range';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

SyntaxHighlighter.registerLanguage('bash', bash);

type MarkdownProps = {
  markdown: string;
};

const Markdown: FC<MarkdownProps> = ({ markdown }) => {
    const syntaxTheme = oneDark;

    const MarkdownComponents: object = {
        // @ts-ignore
        code({ node, inline, className, ...props }: any) {
          const hasLang = /language-(\w+)/.exec(className || '');
          const hasMeta = node?.data?.meta;
    
          const applyHighlights: object = (applyHighlights: number) => {
            if (hasMeta) {
              const RE = /{([\d,-]+)}/;
              const metadata = node.data.meta?.replace(/\s/g, '');
              const strlineNumbers = RE?.test(metadata)
                ? RE?.exec(metadata)?.[1] ?? '0'
                : '0';
              const highlightLines = rangeParser(strlineNumbers);
              const highlight = highlightLines;
              const data: string = highlight.includes(applyHighlights)
                ? 'highlight'
                : '';
              return { data };
            } else {
              return {};
            }
          };
    
          return hasLang ? (
            <SyntaxHighlighter
              style={syntaxTheme}
              language={hasLang[1]}
              PreTag="div"
              className="codeStyle"
              showLineNumbers={true}
              wrapLines={hasMeta}
              useInlineStyles={true}
              lineProps={applyHighlights}
            >
              {props.children}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props} />
          )
        },
    }


  return (
    <ReactMarkdown
        className='action-text' 
        components={MarkdownComponents} 
        children={markdown ?? ""}
        remarkPlugins={[remarkGfm /*, rehypeRaw*/]}    
    />
  )
}

export default Markdown;
