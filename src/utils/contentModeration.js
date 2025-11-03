// Content Moderation Utilities
// Detects inappropriate content in text and images

// List of inappropriate words and phrases
const INAPPROPRIATE_WORDS = [
  // Profanity and vulgar language
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'crap', 'piss',
  'dick', 'pussy', 'cock', 'tits', 'boobs', 'ass', 'bastard', 'whore',
  'slut', 'fag', 'nigger', 'retard', 'stupid', 'idiot', 'moron',
  
  // Sexual content
  'sex', 'porn', 'pornography', 'nude', 'naked', 'nudity', 'masturbat',
  'orgasm', 'penis', 'vagina', 'breast', 'nipple', 'genital',
  
  // Violence and hate speech
  'kill', 'murder', 'suicide', 'bomb', 'terrorist', 'hate', 'racist',
  'violence', 'weapon', 'gun', 'knife', 'blood', 'death',
  
  // Drug and alcohol references
  'drug', 'cocaine', 'heroin', 'marijuana', 'weed', 'alcohol', 'drunk',
  'high', 'stoned', 'addiction', 'overdose',
  
  // Spam and scam
  'spam', 'scam', 'fraud', 'fake', 'scam', 'phishing', 'hack'
];

// Enhanced inappropriate patterns (regex)
const INAPPROPRIATE_PATTERNS = [
  // Phone numbers and personal info
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // URLs (potential spam)
  /https?:\/\/[^\s]+/g,
  
  // Repeated characters (spam-like)
  /(.)\1{4,}/g,
  
  // All caps (shouting)
  /\b[A-Z]{5,}\b/g
];

// Content moderation functions
export const moderateText = (text) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { isAppropriate: true, violations: [] };
  }

  const violations = [];
  const lowerText = text.toLowerCase();
  
  // Check for inappropriate words
  for (const word of INAPPROPRIATE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      violations.push({
        type: 'inappropriate_word',
        word: word,
        severity: 'high',
        message: `Inappropriate language detected: "${word}"`
      });
    }
  }
  
  // Check for inappropriate patterns
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      violations.push({
        type: 'suspicious_pattern',
        pattern: pattern.toString(),
        matches: matches,
        severity: 'medium',
        message: `Suspicious content pattern detected`
      });
    }
  }
  
  // Check for excessive repetition
  const words = text.split(/\s+/);
  const wordCount = {};
  words.forEach(word => {
    wordCount[word.toLowerCase()] = (wordCount[word.toLowerCase()] || 0) + 1;
  });
  
  for (const [word, count] of Object.entries(wordCount)) {
    if (count > 5 && word.length > 2) {
      violations.push({
        type: 'excessive_repetition',
        word: word,
        count: count,
        severity: 'medium',
        message: `Excessive repetition of word: "${word}" (${count} times)`
      });
    }
  }
  
  return {
    isAppropriate: violations.length === 0,
    violations: violations,
    severity: violations.length > 0 ? Math.max(...violations.map(v => v.severity === 'high' ? 3 : v.severity === 'medium' ? 2 : 1)) : 0
  };
};

// Image content moderation (basic implementation)
export const moderateImage = async (imageFile) => {
  if (!imageFile || !(imageFile instanceof File)) {
    return { isAppropriate: true, violations: [] };
  }

  const violations = [];
  
  // Check file size (potential spam)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (imageFile.size > maxSize) {
    violations.push({
      type: 'file_too_large',
      size: imageFile.size,
      maxSize: maxSize,
      severity: 'medium',
      message: 'File size too large'
    });
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(imageFile.type)) {
    violations.push({
      type: 'invalid_file_type',
      type: imageFile.type,
      allowedTypes: allowedTypes,
      severity: 'high',
      message: 'Invalid file type'
    });
  }
  
  // Basic image analysis (you can enhance this with AI services)
  try {
    const imageData = await analyzeImageContent(imageFile);
    if (imageData.hasNudity) {
      violations.push({
        type: 'nudity_detected',
        severity: 'high',
        message: 'Inappropriate content detected in image'
      });
    }
  } catch (error) {
    console.warn('Image analysis failed:', error);
  }
  
  return {
    isAppropriate: violations.length === 0,
    violations: violations,
    severity: violations.length > 0 ? Math.max(...violations.map(v => v.severity === 'high' ? 3 : v.severity === 'medium' ? 2 : 1)) : 0
  };
};

// Basic image content analysis
const analyzeImageContent = async (imageFile) => {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Basic color analysis for potential inappropriate content
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let skinTonePixels = 0;
      let totalPixels = data.length / 4;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Basic skin tone detection
        if (isSkinTone(r, g, b)) {
          skinTonePixels++;
        }
      }
      
      const skinToneRatio = skinTonePixels / totalPixels;
      
      resolve({
        hasNudity: skinToneRatio > 0.3, // Threshold for potential nudity
        skinToneRatio: skinToneRatio,
        dimensions: { width: img.width, height: img.height }
      });
    };
    
    img.onerror = () => {
      resolve({ hasNudity: false, error: 'Failed to load image' });
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
};

// Basic skin tone detection
const isSkinTone = (r, g, b) => {
  // Enhanced skin tone detection algorithm
  const y = 0.299 * r + 0.587 * g + 0.114 * b; // Luminance
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  
  return (
    y > 80 && y < 255 &&
    cb > 77 && cb < 127 &&
    cr > 133 && cr < 173 &&
    r > 95 && g > 40 && b > 20 &&
    Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
    Math.abs(r - g) > 15 &&
    r > g && r > b
  );
};

// Generate user-friendly violation messages
export const generateViolationMessage = (violations) => {
  if (violations.length === 0) return null;
  
  const highSeverity = violations.filter(v => v.severity === 'high');
  const mediumSeverity = violations.filter(v => v.severity === 'medium');
  
  if (highSeverity.length > 0) {
    return {
      type: 'error',
      title: 'Content Not Allowed',
      message: 'Your post contains inappropriate content and cannot be published. Please review our community guidelines.',
      violations: highSeverity.map(v => v.message)
    };
  }
  
  if (mediumSeverity.length > 0) {
    return {
      type: 'warning',
      title: 'Content Review Required',
      message: 'Your post may contain questionable content. Please review before publishing.',
      violations: mediumSeverity.map(v => v.message)
    };
  }
  
  return {
    type: 'info',
    title: 'Content Notice',
    message: 'Your post has been reviewed and approved.',
    violations: []
  };
};

// Content moderation API integration
export const moderateContent = async (text, imageFiles = []) => {
  const results = {
    text: moderateText(text),
    images: [],
    overall: { isAppropriate: true, violations: [] }
  };
  
  // Moderate images (only if there are images)
  for (const imageFile of imageFiles) {
    if (imageFile) {
      const imageResult = await moderateImage(imageFile);
      results.images.push(imageResult);
    }
  }
  
  // Combine all violations
  const allViolations = [
    ...results.text.violations,
    ...results.images.flatMap(img => img.violations)
  ];
  
  results.overall = {
    isAppropriate: allViolations.length === 0,
    violations: allViolations,
    severity: allViolations.length > 0 ? Math.max(...allViolations.map(v => v.severity === 'high' ? 3 : v.severity === 'medium' ? 2 : 1)) : 0
  };
  
  return results;
};
