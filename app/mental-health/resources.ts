export type MentalHealthLink = {
  name: string;
  url: string;
};

export type MentalHealthTile = {
  id: string;
  slug: string;
  icon: string;
  title: string;
  description: string;
  links: MentalHealthLink[];
};

export const mentalHealthTiles: MentalHealthTile[] = [
  {
    id: "understand",
    slug: "understand",
    icon: "🌿",
    title: "Understand Your Climate Emotions",
    description:
      "Learn about eco-anxiety, grief, and climate stress — and why your feelings make complete sense.",
    links: [
      {
        name: "Climate Mental Health Network",
        url: "https://www.climatementalhealth.net/",
      },
      {
        name: "Climate–Mental Health Guides, Toolkits & Courses",
        url: "",
      },
    ],
  },
  {
    id: "process",
    slug: "process",
    icon: "✍️",
    title: "Process & Heal",
    description:
      "Gentle programs and guided spaces to help you reflect, express, and move through climate grief with care.",
    links: [
      {
        name: "Good Grief Network – Writing Through It Program",
        url: "https://goodgriefnetwork.org/journal/",
      },
      {
        name: "Active Hope – Free Training",
        url: "https://www.activehope.info/free-training",
      },
    ],
  },
  {
    id: "connect",
    slug: "connect",
    icon: "🤝",
    title: "Connect & Take Action (Local)",
    description:
      "Find community, support, and meaningful climate action right here in Edmonton and at U of A.",
    links: [
      {
        name: "Climate Action UAlberta Coalition",
        url: "https://www.uaclimateaction.ca/",
      },
      {
        name: "Climate Change & Health Hub (U of A)",
        url: "https://www.ualberta.ca/en/health-sciences/research/climate-change-health-hub.html",
      },
      {
        name: "Climate Justice Edmonton",
        url: "https://climatejusticeedmonton.com/",
      },
      {
        name: "Common Horizon Edmonton",
        url: "",
      },
      {
        name: "Edmonton Youth for Climate",
        url: "https://www.instagram.com/edmontonyouthforclimate/?hl=en",
      },
      {
        name: "Seniors for Climate Action Now (SCAN)",
        url: "https://seniorsforclimateactionnow.org/",
      },
      {
        name: "Waste Free Edmonton",
        url: "https://wastefree.ca/",
      },
    ],
  },
  {
    id: "stories",
    slug: "stories",
    icon: "🎧📚",
    title: "Stories, Voices & Hope",
    description:
      "Books and podcasts that explore climate grief, courage, and how to keep going — together.",
    links: [
      {
        name: "Second Nature: Living with Ecological Grief (Podcast)",
        url: "https://open.spotify.com/show/7EOsmZ7wQzKiYfreX0lnny",
      },
      {
        name: "Generation Dread – Britt Wray",
        url: "https://www.penguinrandomhouse.com/books/704089/generation-dread-by-britt-wray/",
      },
      {
        name: "A Field Guide to Climate Anxiety – Sarah Jaquette Ray",
        url: "https://www.ucpress.edu/book/9780520381170/a-field-guide-to-climate-anxiety",
      },
      {
        name: "Saving Us – Katharine Hayhoe",
        url: "https://www.simonandschuster.com/books/Saving-Us/Katharine-Hayhoe/9781982143831",
      },
      {
        name: "It’s Not Just You – Tori Tsui",
        url: "https://www.simonandschuster.ca/books/Its-Not-Just-You/Tori-Tsui/9781398508743",
      },
    ],
  },
];
