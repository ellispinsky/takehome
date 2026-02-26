export const PDF_EXTRACTION_PROMPT = `Extract all label information from this document.
The brand name has a few words,
The class type has a few words
For alcohol content: If you see "45% ALC/VOL", extract only "45%". If you see "12.5% ABV", extract only "12.5%".
The net content typically looks like "750 ML"
Extract two alcohol content values, applicationInfo.applicationABV comes from the PDF, the other alcoholContent.raw_text value comes from the label.

GOVERNMENT WARNING: Evaluate ONLY the title heading (e.g. "GOVERNMENT WARNING" or "GOVERNMENT WARNING:").
- capitalLetters: true if the title heading is in ALL CAPS (e.g. "GOVERNMENT WARNING"), false only if the title has lowercase letters.
- bold: true if the title heading is bold, false otherwise.
- Do NOT consider the body text (points 1, 2, 3) when evaluating capitalLetters or bold.
- The title is typically the first line before the numbered points.

If you are not able to read the PDF, say so.`;