/**
 * Sanitizes log data to prevent XTerm parsing errors
 */
export const sanitizeLogData = (data: string): string => {
  if (typeof data !== 'string') {
    return String(data);
  }

  try {
    return data
      // Remove null bytes and other problematic control characters
      .replace(/\x00/g, '')
      // Remove other control characters (except tab, newline, carriage return)
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Remove incomplete ANSI escape sequences
      .replace(/\x1B\[[0-9;]*[^0-9;]/g, '')
      .replace(/\x1B\[[0-9;]*$/g, '') // Remove incomplete sequences at end
      // Remove standalone escape characters
      .replace(/\x1B(?!\[)/g, '')
      // Remove any remaining non-printable characters
      .replace(/[^\x20-\x7E\r\n\t]/g, '')
      // Trim and ensure proper line endings
      .trim();
  } catch (error) {
    console.warn('Log sanitization failed:', error);
    // Fallback: basic sanitization
    return data.replace(/[\x00-\x1F\x7F]/g, '').trim();
  }
};

/**
 * Checks if data contains problematic characters that might break XTerm
 */
export const hasProblematicCharacters = (data: string): boolean => {
  return /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]|\x1B(?!\[)/.test(data);
};

/**
 * Extracts and returns only the text content, stripping all ANSI codes
 */
export const stripAnsiCodes = (data: string): string => {
  return data.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
};