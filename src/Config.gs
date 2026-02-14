/**
 * Configuration for the Business Card Scanner.
 * Make sure to replace the placeholder values with your actual IDs and Keys.
 */
var CONFIG = {
  // Folder ID where new business card images are uploaded
  // Open the folder in Drive and copy the ID from the URL
  INPUT_FOLDER_ID: 'YOUR_INPUT_FOLDER_ID_HERE',

  // Folder ID where processed images will be moved (to avoid duplicates)
  PROCESSED_FOLDER_ID: 'YOUR_PROCESSED_FOLDER_ID_HERE',

  // Google AI Studio API Key
  // Get it from: https://aistudio.google.com/
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',

  // Name of the sheet tab to store data
  SHEET_NAME: 'BusinessCards',

  // Gemini Model Name
  // Using 1.5 Pro as requested for better accuracy
  MODEL_NAME: 'gemini-1.5-pro'
};
