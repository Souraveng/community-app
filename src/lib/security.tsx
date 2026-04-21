import React from 'react';

/**
 * Safely parses text and converts URLs to clickable secure links.
 */
export function renderSecureContent(text: string) {
  if (!text) return null;

  // Regex to find URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary hover:underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
