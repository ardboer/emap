import { Article, PodcastCategory } from "@/types";

export const featuredArticles: Article[] = [
  {
    id: "1",
    title: "Breaking: Major Economic Summit Concludes",
    subtitle: "Global Leaders Reach Historic Agreement",
    leadText:
      "World leaders have reached a groundbreaking consensus on climate policy and economic cooperation during the three-day summit.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    imageUrl: "https://picsum.photos/800/600?random=1",
    timestamp: "2 hours ago",
    category: "Politics",
  },
  {
    id: "2",
    title: "Tech Innovation Transforms Healthcare",
    subtitle: "AI-Powered Diagnostics Show Promise",
    leadText:
      "Revolutionary artificial intelligence technology is helping doctors diagnose diseases faster and more accurately than ever before.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    imageUrl: "https://picsum.photos/800/600?random=2",
    timestamp: "4 hours ago",
    category: "Technology",
  },
  {
    id: "3",
    title: "Climate Action Gains Momentum",
    subtitle: "Cities Lead the Way in Green Initiatives",
    leadText:
      "Urban centers worldwide are implementing innovative solutions to combat climate change and reduce carbon emissions.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    imageUrl: "https://picsum.photos/800/600?random=3",
    timestamp: "6 hours ago",
    category: "Environment",
  },
  {
    id: "4",
    title: "Sports Championship Delivers Thrills",
    subtitle: "Underdog Team Reaches Finals",
    leadText:
      "Against all odds, the hometown team has made it to the championship game, bringing excitement to fans everywhere.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    imageUrl: "https://picsum.photos/800/600?random=4",
    timestamp: "8 hours ago",
    category: "Sports",
  },
  {
    id: "5",
    title: "Cultural Festival Celebrates Diversity",
    subtitle: "Communities Come Together",
    leadText:
      "The annual cultural festival showcases the rich diversity of our community through food, music, and art.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    imageUrl: "https://picsum.photos/800/600?random=5",
    timestamp: "12 hours ago",
    category: "Culture",
  },
];

export const newsArticles: Article[] = [
  {
    id: "6",
    title: "Local Business Wins National Award",
    leadText:
      "A family-owned restaurant has been recognized for its outstanding contribution to sustainable dining practices.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    imageUrl: "https://picsum.photos/400/300?random=6",
    timestamp: "1 hour ago",
    category: "Business",
  },
  {
    id: "7",
    title: "Education Reform Shows Positive Results",
    leadText:
      "New teaching methods implemented last year are showing significant improvements in student performance.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    imageUrl: "https://picsum.photos/400/300?random=7",
    timestamp: "3 hours ago",
    category: "Education",
  },
  {
    id: "8",
    title: "Transportation Infrastructure Upgrade",
    leadText:
      "City announces major improvements to public transportation system, including new electric buses.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    imageUrl: "https://picsum.photos/400/300?random=8",
    timestamp: "5 hours ago",
    category: "Transportation",
  },
  {
    id: "9",
    title: "Health Initiative Promotes Wellness",
    leadText:
      "Community health program launches free fitness classes and nutrition workshops for residents.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    imageUrl: "https://picsum.photos/400/300?random=9",
    timestamp: "7 hours ago",
    category: "Health",
  },
  {
    id: "10",
    title: "Art Gallery Opens New Exhibition",
    leadText:
      "Contemporary artists showcase their latest works in a thought-provoking exhibition about modern society.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    imageUrl: "https://picsum.photos/400/300?random=10",
    timestamp: "9 hours ago",
    category: "Arts",
  },
  {
    id: "11",
    title: "Technology Startup Secures Funding",
    leadText:
      "Local tech company raises $5 million to develop innovative solutions for remote work collaboration.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    imageUrl: "https://picsum.photos/400/300?random=11",
    timestamp: "11 hours ago",
    category: "Technology",
  },
  {
    id: "12",
    title: "Environmental Conservation Effort",
    leadText:
      "Volunteers plant 1,000 trees in local park as part of citywide environmental restoration project.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    imageUrl: "https://picsum.photos/400/300?random=12",
    timestamp: "13 hours ago",
    category: "Environment",
  },
  {
    id: "13",
    title: "Music Festival Announces Lineup",
    leadText:
      "Summer music festival reveals star-studded lineup featuring both established and emerging artists.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    imageUrl: "https://picsum.photos/400/300?random=13",
    timestamp: "15 hours ago",
    category: "Entertainment",
  },
  {
    id: "14",
    title: "Scientific Research Breakthrough",
    leadText:
      "University researchers make significant discovery that could lead to new treatments for chronic diseases.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    imageUrl: "https://picsum.photos/400/300?random=14",
    timestamp: "17 hours ago",
    category: "Science",
  },
  {
    id: "15",
    title: "Community Garden Project Expands",
    leadText:
      "Neighborhood initiative to grow fresh produce locally gains support and expands to three new locations.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    imageUrl: "https://picsum.photos/400/300?random=15",
    timestamp: "19 hours ago",
    category: "Community",
  },
];

export const podcastCategories: PodcastCategory[] = [
  {
    id: "news",
    name: "News & Politics",
    episodes: [
      {
        id: "p1",
        title: "Daily News Briefing",
        description: "Your daily dose of current events and political analysis",
        coverUrl: "https://picsum.photos/200/200?random=p1",
        duration: "25 min",
        publishDate: "Today",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "p2",
        title: "Political Roundtable",
        description: "Expert discussion on current political developments",
        coverUrl: "https://picsum.photos/200/200?random=p2",
        duration: "45 min",
        publishDate: "Yesterday",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "p3",
        title: "Global Perspectives",
        description: "International news and analysis from around the world",
        coverUrl: "https://picsum.photos/200/200?random=p3",
        duration: "35 min",
        publishDate: "2 days ago",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "p4",
        title: "Election Watch",
        description: "Comprehensive coverage of upcoming elections",
        coverUrl: "https://picsum.photos/200/200?random=p4",
        duration: "30 min",
        publishDate: "3 days ago",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "p5",
        title: "Policy Deep Dive",
        description:
          "In-depth analysis of government policies and their impact",
        coverUrl: "https://picsum.photos/200/200?random=p5",
        duration: "40 min",
        publishDate: "4 days ago",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
    ],
  },
  {
    id: "business",
    name: "Business & Finance",
    episodes: [
      {
        id: "b1",
        title: "Market Watch",
        description: "Daily market analysis and financial insights",
        coverUrl: "https://picsum.photos/200/200?random=b1",
        duration: "20 min",
        publishDate: "Today",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "b2",
        title: "Startup Stories",
        description: "Inspiring stories from successful entrepreneurs",
        coverUrl: "https://picsum.photos/200/200?random=b2",
        duration: "50 min",
        publishDate: "Yesterday",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "b3",
        title: "Economic Outlook",
        description: "Expert predictions on economic trends and forecasts",
        coverUrl: "https://picsum.photos/200/200?random=b3",
        duration: "35 min",
        publishDate: "2 days ago",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "b4",
        title: "Investment Insights",
        description: "Smart investment strategies and portfolio management",
        coverUrl: "https://picsum.photos/200/200?random=b4",
        duration: "28 min",
        publishDate: "3 days ago",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "b5",
        title: "Tech Disruption",
        description: "How technology is changing the business landscape",
        coverUrl: "https://picsum.photos/200/200?random=b5",
        duration: "42 min",
        publishDate: "4 days ago",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
    ],
  },
  {
    id: "technology",
    name: "Technology",
    episodes: [
      {
        id: "t1",
        title: "AI Revolution",
        description:
          "Exploring the latest developments in artificial intelligence",
        coverUrl: "https://picsum.photos/200/200?random=t1",
        duration: "38 min",
        publishDate: "Today",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "t2",
        title: "Cybersecurity Today",
        description: "Protecting yourself and your business in the digital age",
        coverUrl: "https://picsum.photos/200/200?random=t2",
        duration: "32 min",
        publishDate: "Yesterday",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "t3",
        title: "Future of Work",
        description: "How technology is reshaping the workplace",
        coverUrl: "https://picsum.photos/200/200?random=t3",
        duration: "45 min",
        publishDate: "2 days ago",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "t4",
        title: "Mobile Innovation",
        description: "Latest trends in mobile technology and app development",
        coverUrl: "https://picsum.photos/200/200?random=t4",
        duration: "29 min",
        publishDate: "3 days ago",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "t5",
        title: "Green Tech",
        description:
          "Sustainable technology solutions for environmental challenges",
        coverUrl: "https://picsum.photos/200/200?random=t5",
        duration: "36 min",
        publishDate: "4 days ago",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
    ],
  },
  {
    id: "lifestyle",
    name: "Lifestyle & Culture",
    episodes: [
      {
        id: "l1",
        title: "Wellness Wednesday",
        description: "Tips and insights for a healthier, happier life",
        coverUrl: "https://picsum.photos/200/200?random=l1",
        duration: "25 min",
        publishDate: "Today",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "l2",
        title: "Cultural Conversations",
        description:
          "Exploring diverse cultures and traditions around the world",
        coverUrl: "https://picsum.photos/200/200?random=l2",
        duration: "40 min",
        publishDate: "Yesterday",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "l3",
        title: "Food & Travel",
        description: "Culinary adventures and travel experiences",
        coverUrl: "https://picsum.photos/200/200?random=l3",
        duration: "35 min",
        publishDate: "2 days ago",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "l4",
        title: "Art & Creativity",
        description: "Celebrating artistic expression and creative minds",
        coverUrl: "https://picsum.photos/200/200?random=l4",
        duration: "33 min",
        publishDate: "3 days ago",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
      {
        id: "l5",
        title: "Mindful Living",
        description: "Practices for mindfulness and personal growth",
        coverUrl: "https://picsum.photos/200/200?random=l5",
        duration: "27 min",
        publishDate: "4 days ago",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      },
    ],
  },
];
