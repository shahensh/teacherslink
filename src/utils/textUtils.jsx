import React from 'react';

// Function to detect URLs in text
export const detectUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex);
};

// Function to check if a string is a URL
export const isUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

// Component to render text with clickable URLs
export const renderTextWithLinks = (text, className = '') => {
  if (!text) return null;

  const parts = detectUrls(text);
  
  return parts.map((part, index) => {
    if (isUrl(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-blue-400 hover:text-blue-300 underline break-all ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

// Function to format message text with links
export const formatMessageText = (text, isOwnMessage = false) => {
  if (!text) return null;

  const parts = detectUrls(text);
  
  return parts.map((part, index) => {
    if (isUrl(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`${
            isOwnMessage 
              ? 'text-blue-200 hover:text-blue-100' 
              : 'text-blue-600 hover:text-blue-500'
          } underline break-all`}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};


