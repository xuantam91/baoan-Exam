'use client';

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

interface LatexRendererProps {
  text: string;
  className?: string;
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split by block equations $$...$$
  const blockParts = text.split(/(\$\$[\s\S]*?\$\$)/g);

  return (
    <span className={`whitespace-pre-wrap ${className}`}>
      {blockParts.map((blockPart, bIdx) => {
        if (blockPart.startsWith('$$') && blockPart.endsWith('$$')) {
          const math = blockPart.slice(2, -2).trim();
          return (
            <span key={bIdx} className="block my-2 overflow-x-auto">
              <BlockMath 
                math={math} 
                renderError={() => <span>$${math}$$</span>}
              />
            </span>
          );
        }

        // Split by inline equations $...$ (using [\s\S]*? to support multiline inline math)
        const inlineParts = blockPart.split(/(\$[\s\S]*?\$)/g);
        return (
          <span key={bIdx}>
            {inlineParts.map((inlinePart, iIdx) => {
              if (inlinePart.startsWith('$') && inlinePart.endsWith('$')) {
                const math = inlinePart.slice(1, -1).trim();
                return (
                  <span key={iIdx} className="inline-block mx-0.5">
                    <InlineMath 
                      math={math} 
                      renderError={() => <span>${math}$</span>}
                    />
                  </span>
                );
              }
              return <span key={iIdx}>{inlinePart}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
};
