/**
 * Service to interact with the Gemini API (Google AI Studio).
 */
var GeminiService = (function() {

  /**
   * Extracts business card information from an image using Gemini.
   * @param {string} base64Image - The base64 encoded image string.
   * @param {string} mimeType - The mime type of the image (e.g., 'image/jpeg').
   * @returns {Object} Not null if success, structured JSON data.
   */
  function extractData(base64Image, mimeType) {
    var apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + CONFIG.MODEL_NAME + ':generateContent?key=' + CONFIG.GEMINI_API_KEY;

    var promptText = 
      "Extract the following information from this business card image and return ONLY a valid JSON object. " +
      "Do not include Markdown formatting (like ```json ... ```). " +
      "Fields: Name, Company, JobTitle, Email, Phone, Address, Website. " +
      "If a field is missing, use an empty string. " +
      "For Phone, format it as a standard international number if possible. " +
      "Verify the email address looks valid.";

    var payload = {
      "contents": [{
        "parts": [
          { "text": promptText },
          {
            "inline_data": {
              "mime_type": mimeType,
              "data": base64Image
            }
          }
        ]
      }],
      "generationConfig": {
        "response_mime_type": "application/json"
      }
    };

    var options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };

    try {
      var response = UrlFetchApp.fetch(apiUrl, options);
      var responseCode = response.getResponseCode();
      var responseBody = response.getContentText();

      if (responseCode !== 200) {
        Logger.log('Error calling Gemini API: ' + responseCode + ' - ' + responseBody);
        return null;
      }

      var jsonResponse = JSON.parse(responseBody);
      
      // Navigate the Gemini response structure
      if (jsonResponse.candidates && 
          jsonResponse.candidates.length > 0 && 
          jsonResponse.candidates[0].content &&
          jsonResponse.candidates[0].content.parts &&
          jsonResponse.candidates[0].content.parts.length > 0) {
            
        var textResult = jsonResponse.candidates[0].content.parts[0].text;
        
        // Clean up any potential markdown code blocks if the model ignores the instruction
        textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(textResult);
      } else {
         Logger.log('Unexpected response structure from Gemini: ' + responseBody);
         return null;
      }

    } catch (e) {
      Logger.log('Exception in GeminiService: ' + e.toString());
      return null;
    }
  }

  return {
    extractData: extractData
  };

})();
