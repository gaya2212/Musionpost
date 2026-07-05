import { proTypeValues } from '@/lib/validation/pro';

export const STAGES = [
  'ideation',
  'recording',
  'mixing_mastering',
  'promotion_design',
  'distribution',
  'community',
] as const;

export type Stage = (typeof STAGES)[number];
export type ProType = (typeof proTypeValues)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  ideation: 'Ideation',
  recording: 'Recording',
  mixing_mastering: 'Mixing & Mastering',
  promotion_design: 'Launch & Promote',
  distribution: 'Distribution',
  community: 'Community',
};

export const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  ideation: 'Shape the concept with producers and co-writers.',
  recording: 'Track your project with the right studio and engineer.',
  mixing_mastering: 'Mix and master with verified engineers.',
  promotion_design: 'Plan the release with PR, marketing, and design pros.',
  distribution: 'Route your finished work through licensed distribution.',
  community: 'Build the fanbase around what you released.',
};

export const STAGE_PROS: Record<Stage, ProType[]> = {
  ideation: ['producer', 'session_musician'],
  recording: ['studio', 'producer', 'engineer_mix', 'session_musician'],
  mixing_mastering: ['engineer_mix', 'engineer_master'],
  promotion_design: ['marketing', 'pr', 'designer'],
  distribution: ['distribution'],
  community: ['marketing'],
};
