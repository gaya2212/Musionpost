/**
 * TypeScript shapes matching Credits.fm's expected export contract
 * (MVP_ARCHITECTURE.md Section 11). The actual API push is stubbed in
 * MVP — see lib/credits/export.ts — this only defines the payload shape.
 */

export type CreditsExportContributor = {
  profileId: string;
  displayName: string;
  role: string;
  /** Interested Parties Information number — not collected anywhere in the MVP data model, always null until it is. */
  ipi: string | null;
};

export type CreditsExportPayload = {
  projectId: string;
  title: string;
  /** International Standard Recording Code — not assigned until distribution, always null in MVP. */
  isrc: string | null;
  /** International Standard Musical Work Code — same as isrc, null in MVP. */
  iswc: string | null;
  contributors: CreditsExportContributor[];
  completedAt: string | null;
};
