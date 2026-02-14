/**
 * Main function to process new business cards.
 * This function should be set up with a Time-driven trigger (e.g., every 5 or 10 minutes).
 */
function processNewCards() {
  var inputFolderId = CONFIG.INPUT_FOLDER_ID;
  var processedFolderId = CONFIG.PROCESSED_FOLDER_ID;
  
  if (!inputFolderId || inputFolderId === 'YOUR_INPUT_FOLDER_ID_HERE') {
    Logger.log('Please set the INPUT_FOLDER_ID in Config.gs');
    return;
  }

  var inputFolder = DriveApp.getFolderById(inputFolderId);
  var processedFolder = DriveApp.getFolderById(processedFolderId);
  
  // Get all files in the input folder
  var files = inputFolder.getFiles();
  
  while (files.hasNext()) {
    var file = files.next();
    var mimeType = file.getMimeType();
    
    // Process only images
    if (mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/webp') {
      Logger.log('Processing file: ' + file.getName());
      
      try {
        // 1. Get image blob and convert to base64
        var blob = file.getBlob();
        var base64 = Utilities.base64Encode(blob.getBytes());
        
        // 2. Call Gemini API
        var extractedData = GeminiService.extractData(base64, mimeType);
        
        if (extractedData) {
          // 3. Save to Sheet
          SheetService.appendData(file.getName(), file.getUrl(), extractedData);
          
          // 4. Move file to processed folder
          file.moveTo(processedFolder);
          Logger.log('Successfully processed and moved: ' + file.getName());
        } else {
          Logger.log('Failed to extract data for: ' + file.getName());
        }
        
      } catch (e) {
        Logger.log('Error processing file ' + file.getName() + ': ' + e.toString());
      }
    }
  }
}

/**
 * Setup function to initialize the sheet headers (optional helper).
 */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    var headers = ['Timestamp', 'Image Data (Ref)', 'Name', 'Company', 'Job Title', 'Email', 'Phone', 'Address', 'Website'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    Logger.log('Sheet ' + CONFIG.SHEET_NAME + ' created with headers.');
  } else {
    Logger.log('Sheet ' + CONFIG.SHEET_NAME + ' already exists.');
  }
}
