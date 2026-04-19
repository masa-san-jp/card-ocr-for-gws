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
  MODEL_NAME: 'gemini-1.5-pro',

  // ---------------------------------------------------------------
  // 挨拶メール設定
  // ---------------------------------------------------------------

  // 挨拶メールの送信モード
  // 'send'  : 自動送信する
  // 'draft' : Gmailの下書きとして保存する（送信前に確認したい場合）
  GREETING_EMAIL_MODE: 'draft',

  // 挨拶メールの件名
  // {{name}}, {{company}}, {{title}} が使用可能
  GREETING_EMAIL_SUBJECT: '先日はお名刺をいただきありがとうございました',

  // 挨拶メールの本文
  // {{name}}, {{company}}, {{title}} が使用可能
  // 改行は \n を使用
  GREETING_EMAIL_BODY: '{{name}} 様\n\nはじめまして、〇〇会社の△△と申します。\n先日はお名刺をいただきありがとうございました。\n\nぜひ今後ともよろしくお願いいたします。\n\n---\n〇〇会社\n△△\nmail: your-email@example.com\nTel: 000-0000-0000'
};
