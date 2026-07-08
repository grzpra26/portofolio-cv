/**
 * Google Sheets Mini CMS for Live Portfolio CV
 *
 * 1. Create a Google Sheet.
 * 2. Make tabs with these exact names:
 *    profile, metrics, roleFit, capabilities, projects, experience, skills, certifications, links
 * 3. Row 1 must contain column headers.
 * 4. Extensions → Apps Script → paste this code.
 * 5. Deploy → New deployment → Web app.
 * 6. Execute as: Me.
 * 7. Who has access: Anyone.
 * 8. Copy the Web App URL into config.js:
 *    window.CMS_URL = "YOUR_WEB_APP_URL";
 */

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const output = {
    profile: sheetToObject(ss.getSheetByName("profile")),
    metrics: sheetToArray(ss.getSheetByName("metrics")),
    roleFit: sheetToArray(ss.getSheetByName("roleFit")),
    capabilities: sheetToArray(ss.getSheetByName("capabilities")).map(row => ({
      label: row.label,
      value: Number(row.value)
    })),
    projects: sheetToArray(ss.getSheetByName("projects")),
    experience: sheetToArray(ss.getSheetByName("experience")),
    skills: sheetToArray(ss.getSheetByName("skills")),
    certifications: sheetToArray(ss.getSheetByName("certifications")),
    links: sheetToArray(ss.getSheetByName("links"))
  };

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheetToArray(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim());

  return values.slice(1)
    .filter(row => row.some(cell => cell !== ""))
    .map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      return item;
    });
}

function sheetToObject(sheet) {
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return {};
  const headers = values[0].map(h => String(h).trim());
  const row = values[1];
  const item = {};
  headers.forEach((header, index) => {
    item[header] = row[index];
  });
  return item;
}
