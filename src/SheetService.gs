/**
 * Service to manage Google Sheet operations.
 */
var SheetService = (function() {

  function getSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      // Initialize headers
      var headers = ['Timestamp', 'Image Data (Ref)', 'Name', 'Company', 'Job Title', 'Email', 'Phone', 'Address', 'Website'];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    return sheet;
  }

  /**
   * Appends the extracted business card data to the sheet.
   * @param {string} fileName - The name of the processed file.
   * @param {string} fileUrl - The URL of the processed file.
   * @param {Object} data - The JSON object returned by Gemini.
   */
  function appendData(fileName, fileUrl, data) {
    var sheet = getSheet();
    var timestamp = new Date();
    
    var row = [
      timestamp,
      '=HYPERLINK("' + fileUrl + '", "' + fileName + '")', // Clickable link to image
      data.Name || '',
      data.Company || '',
      data.JobTitle || '',
      data.Email || '',
      data.Phone || '',
      data.Address || '',
      data.Website || ''
    ];

    sheet.appendRow(row);
  }

  return {
    appendData: appendData
  };

})();
