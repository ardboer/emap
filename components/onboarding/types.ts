export type OnboardingStep =
  | "welcome"
  | "notification-alert"
  | "notification-permission"
  | "topic-selection"
  | "tracking-alert"
  | "tracking-permission"
  | "login";

export interface OnboardingStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export interface TopicOption {
  id: string;
  label: string;
  description: string;
}

// Note: Topic IDs should be prefixed with brand shortcode at runtime
// This is a template - actual IDs will be like "nt-breaking", "cn-interview", etc.
export const TOPIC_TEMPLATES: Omit<TopicOption, "id">[] = [
  {
    label: "Breaking News",
    description: "Get notified about urgent breaking news",
  },
  {
    label: "Interviews",
    description: "Exclusive interviews with key figures",
  },
  {
    label: "Background Stories",
    description: "In-depth analysis and background articles",
  },
];

// Helper to get brand-prefixed topics
export function getBrandTopics(brandShortcode: string): TopicOption[] {
  return [
    {
      id: `${brandShortcode}-breaking`,
      ...TOPIC_TEMPLATES[0],
    },
    {
      id: `${brandShortcode}-interview`,
      ...TOPIC_TEMPLATES[1],
    },
    {
      id: `${brandShortcode}-background`,
      ...TOPIC_TEMPLATES[2],
    },
  ];
}

// Keep MOCK_TOPICS for backward compatibility (will use "nt" as default)
export const MOCK_TOPICS: TopicOption[] = getBrandTopics("nt");
