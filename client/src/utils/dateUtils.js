/**
 * Utility functions for handling date parsing, especially Firestore timestamps
 */

/**
 * Parse a date from various formats including Firestore timestamps
 * @param {*} dateValue - The date value to parse
 * @param {string} fallback - Fallback string if parsing fails
 * @returns {string} Formatted date string
 */
export const parseDate = (dateValue, fallback = 'Unknown') => {
  if (!dateValue) return fallback;
  
  try {
    let date;
    
    if (typeof dateValue === 'object' && dateValue !== null) {
      if (typeof dateValue.toDate === 'function') {
        // Firestore timestamp with toDate method
        date = dateValue.toDate();
      } else if (dateValue.seconds && typeof dateValue.seconds === 'number') {
        // Firestore timestamp object with seconds property
        date = new Date(dateValue.seconds * 1000);
      } else if (dateValue._seconds && typeof dateValue._seconds === 'number') {
        // Firestore timestamp object with _seconds property
        date = new Date(dateValue._seconds * 1000);
      } else {
        // Try to parse as regular object
        date = new Date(dateValue);
      }
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      // Regular date string or timestamp
      date = new Date(dateValue);
    } else {
      return fallback;
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.error('Invalid date created:', date, 'from:', dateValue);
      return fallback;
    }
    
    return date;
  } catch (e) {
    console.error('Date parsing error:', e, 'for dateValue:', dateValue);
    return fallback;
  }
};

/**
 * Format a date for display in local date format
 * @param {*} dateValue - The date value to parse and format
 * @param {string} fallback - Fallback string if parsing fails
 * @returns {string} Formatted date string
 */
export const formatDate = (dateValue, fallback = 'Unknown') => {
  const date = parseDate(dateValue, null);
  if (!date || date === fallback) return fallback;
  
  try {
    return date.toLocaleDateString();
  } catch (e) {
    console.error('Date formatting error:', e);
    return fallback;
  }
};

/**
 * Format a date for display in local date and time format
 * @param {*} dateValue - The date value to parse and format
 * @param {string} fallback - Fallback string if parsing fails
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateValue, fallback = '') => {
  const date = parseDate(dateValue, null);
  if (!date || date === fallback) return fallback;
  
  try {
    return date.toLocaleString();
  } catch (e) {
    console.error('DateTime formatting error:', e);
    return fallback;
  }
};