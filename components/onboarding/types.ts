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

export const MOCK_TOPICS: TopicOption[] = [
  {
    id: "breaking",
    label: "Breaking News",
    description: "Get notified about urgent breaking news",
  },
  {
    id: "interview",
    label: "Interviews",
    description: "Exclusive interviews with key figures",
  },
  {
    id: "background",
    label: "Background Stories",
    description: "In-depth analysis and background articles",
  },
];
