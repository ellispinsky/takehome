/**
 * Verify if label-extracted value matches application form value
 * 
 * Performs case-insensitive comparison between data extracted from the label image
 * and data from the application form. Used to catch discrepancies where the applicant's
 * submitted information doesn't match what's actually printed on the label.
 * 
 * @param labelValue - Text extracted from the label image via OCR/AI
 * @param applicationValue - Value from the PDF application form fields
 * @returns true if values match (case-insensitive), false if mismatch or either value is invalid
 * 
 * Invalid values (considered non-matches):
 * - Empty strings, 'unknown', 'not found', 'false', '-', 'n/a', 'none'
 * - These indicate the AI couldn't extract the data or the field was blank
 */
export function verifyMatch(labelValue: string, applicationValue: string) {
    console.log("comparing", labelValue, applicationValue);
    
    const invalidValues = ['', 'unknown', 'not found', 'false', '-', 'n/a', 'none'];
    const normalizedLabel = labelValue.toLowerCase().trim();
    const normalizedApp = applicationValue.toLowerCase().trim();
    
    if (invalidValues.includes(normalizedLabel) || invalidValues.includes(normalizedApp)) {
      return false;
    }
    
    return normalizedLabel === normalizedApp;
  }