import { AuditReport, SourceFile } from './types';

// Normalize whitespace for fuzzy matching
const normalizeString = (str: string): string => {
  return str.replace(/\s+/g, ' ').trim().toLowerCase();
};

export const verifyCitations = (report: AuditReport, sourceFiles: SourceFile[]): AuditReport => {
  // We make a deep copy to avoid mutating the original parsed response directly
  const verifiedReport: AuditReport = JSON.parse(JSON.stringify(report));

  // Map source contents by filename for quick lookup
  const sourceContents = new Map<string, string>();
  for (const file of sourceFiles) {
    if (file.content) {
      sourceContents.set(file.fileName, normalizeString(file.content));
    }
  }

  // Verify and filter citations
  verifiedReport.findings = verifiedReport.findings.filter((finding) => {
    // Keep only citations that strictly exist in the normalized source text
    finding.citations = finding.citations.filter((citation) => {
      // If excerpt is missing, we drop it since we can't verify it
      if (!citation.excerpt) return false;

      const sourceContent = sourceContents.get(citation.fileName);
      if (!sourceContent) return false;

      const normalizedExcerpt = normalizeString(citation.excerpt);
      
      // If AI hallucinates a very short excerpt like "the", it might pass,
      // but usually AI citations are full sentences. We just do simple substring match.
      if (!normalizedExcerpt || !sourceContent.includes(normalizedExcerpt)) {
        return false;
      }

      return true;
    });

    // If a finding was relying on citations but now has 0 valid ones, we drop the finding completely
    // to strictly prevent AI hallucination.
    if (finding.citations.length === 0) {
      return false;
    }

    return true;
  });

  return verifiedReport;
};
