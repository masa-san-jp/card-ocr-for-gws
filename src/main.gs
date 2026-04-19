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
 * Safe to re-run: adds the メール送信状態 column if it does not yet exist.
 */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(SheetService.HEADERS);
    sheet.getRange(1, 1, 1, SheetService.HEADERS.length).setFontWeight('bold');
    Logger.log('Sheet "' + CONFIG.SHEET_NAME + '" created with headers.');
  } else {
    // Add メール送信状態 column if the sheet predates this feature
    var lastCol = sheet.getLastColumn();
    if (lastCol < SheetService.HEADERS.length) {
      for (var c = lastCol + 1; c <= SheetService.HEADERS.length; c++) {
        sheet.getRange(1, c).setValue(SheetService.HEADERS[c - 1]).setFontWeight('bold');
      }
      Logger.log('Added missing column(s) to "' + CONFIG.SHEET_NAME + '".');
    } else {
      Logger.log('Sheet "' + CONFIG.SHEET_NAME + '" already up to date.');
    }
  }
}

/**
 * Sends or drafts a greeting email for the next unprocessed contact.
 *
 * Run this function once per contact via manual trigger or Apps Script scheduler.
 * Processes exactly ONE row per execution to prevent accidental bulk sends.
 *
 * Before running, ensure CONFIG.GREETING_EMAIL_MODE,
 * CONFIG.GREETING_EMAIL_SUBJECT, and CONFIG.GREETING_EMAIL_BODY are set.
 *
 * To skip a contact without sending, type 'スキップ' in the
 * 「メール送信状態」column (column J) of that row in the sheet.
 */
function processNextGreetingEmail() {
  EmailService.processNextGreetingEmail();
}
