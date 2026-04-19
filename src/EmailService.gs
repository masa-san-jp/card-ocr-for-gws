/**
 * Service to handle greeting email sending (one row at a time).
 *
 * Column layout of BusinessCards sheet:
 *   1:Timestamp  2:ImageRef  3:Name  4:Company  5:JobTitle
 *   6:Email  7:Phone  8:Address  9:Website  10:メール送信状態
 *
 * メール送信状態 values:
 *   (blank) = 未処理
 *   '送信済み'  = auto-sent
 *   '下書き保存' = saved as draft
 *   'スキップ'  = user-marked skip
 */
var EmailService = (function() {

  var EMAIL_STATUS_COL = 10;
  var EMAIL_ADDR_COL   = 6;
  var NAME_COL         = 3;
  var COMPANY_COL      = 4;
  var TITLE_COL        = 5;

  function buildBody(template, name, company, title) {
    return template
      .replace(/\{\{name\}\}/g,    name    || '')
      .replace(/\{\{company\}\}/g, company || '')
      .replace(/\{\{title\}\}/g,   title   || '');
  }

  function buildSubject(template, name, company, title) {
    return template
      .replace(/\{\{name\}\}/g,    name    || '')
      .replace(/\{\{company\}\}/g, company || '')
      .replace(/\{\{title\}\}/g,   title   || '');
  }

  /**
   * Finds the next unprocessed row and sends or drafts a greeting email.
   * Processes exactly ONE row per call to prevent accidental bulk sends.
   *
   * @returns {string|null} Status set on the processed row, or null if no rows remain.
   */
  function processNextGreetingEmail() {
    var sheet = SheetService.getSheet();
    var lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      Logger.log('No data rows found.');
      return null;
    }

    var range = sheet.getRange(2, 1, lastRow - 1, EMAIL_STATUS_COL);
    var values = range.getValues();

    for (var i = 0; i < values.length; i++) {
      var row        = values[i];
      var email      = row[EMAIL_ADDR_COL - 1];
      var status     = row[EMAIL_STATUS_COL - 1];

      // Skip rows without an email address
      if (!email || String(email).trim() === '') continue;

      // Skip rows already processed or user-marked skip
      if (status !== '' && status !== null && status !== undefined) continue;

      var name    = row[NAME_COL    - 1] || '';
      var company = row[COMPANY_COL - 1] || '';
      var title   = row[TITLE_COL   - 1] || '';

      var subject = buildSubject(CONFIG.GREETING_EMAIL_SUBJECT, name, company, title);
      var body    = buildBody(CONFIG.GREETING_EMAIL_BODY,    name, company, title);

      var newStatus;
      if (CONFIG.GREETING_EMAIL_MODE === 'send') {
        GmailApp.sendEmail(email, subject, body);
        newStatus = '送信済み';
      } else {
        GmailApp.createDraft(email, subject, body);
        newStatus = '下書き保存';
      }

      // Write status to column 10 of the current data row (offset +2: 1-based + header)
      sheet.getRange(i + 2, EMAIL_STATUS_COL).setValue(newStatus);
      Logger.log('Row ' + (i + 2) + ' [' + email + ']: ' + newStatus);
      return newStatus;
    }

    Logger.log('All rows have been processed.');
    return null;
  }

  return {
    processNextGreetingEmail: processNextGreetingEmail
  };

})();
