import 'server-only';

/**
 * Musion Verified is data-model-ready but integration-stubbed in MVP
 * (MVP_ARCHITECTURE.md Section 10). This never signs or verifies a C2PA
 * manifest — it returns credential metadata with no cryptographic proof.
 * `issuer_signature` and `c2pa_manifest_url` stay null until the real
 * pipeline lands post-MVP. UI copy referencing this must say
 * "Verified by Musion", never "C2PA-signed".
 */

export type CredentialTier = 'witnessed' | 'documented';

export type StubCredential = {
  tier: CredentialTier;
  status: 'draft';
  contributors: { profileId: string; role: string }[];
  issuedAt: null;
  issuerSignature: null;
  c2paManifestUrl: null;
};

export function buildStubCredential(tier: CredentialTier, contributors: { profileId: string; role: string }[]): StubCredential {
  return {
    tier,
    status: 'draft',
    contributors,
    issuedAt: null,
    issuerSignature: null,
    c2paManifestUrl: null,
  };
}
