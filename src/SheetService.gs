/**
 * Service to manage Google Sheet operations.
 */
var SheetService = (function() {

  var HEADERS = [
    'Timestamp', 'Image Data (Ref)', 'Name', 'Company', 'Job Title',
    'Email', 'Phone', 'Address', 'Website', 'メール送信状態'
  ];

  function getSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
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
      '=HYPERLINK("' + fileUrl + '", "' + fileName + '")',
      data.Name || '',
      data.Company || '',
      data.JobTitle || '',
      data.Email || '',
      data.Phone || '',
      data.Address || '',
      data.Website || '',
      '' // メール送信状態: blank = 未処理
    ];

    sheet.appendRow(row);
  }

  return {
    getSheet:   getSheet,
    appendData: appendData,
    HEADERS:    HEADERS
  };

})();
