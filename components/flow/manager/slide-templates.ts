
import { AlignLeft, Columns2, Grid2X2, MessageSquare, Heading1, ListOrdered, User, Smartphone, Type, GalleryHorizontal } from "lucide-react";

export const SLIDE_TEMPLATES = [
    {
        id: "default",
        label: "Standard Slide",
        icon: AlignLeft,
        slide: {
            title: "New Slide",
            layout: "text" as const,
            content: "## Key Points\n- Point 1\n- Point 2"
        }
    },
    {
        id: "split",
        label: "Image & Text",
        icon: Columns2,
        slide: {
            title: "Visual Slide",
            layout: "split" as const,
            content: "## Description\nAdd details here..."
        }
    },
    {
        id: "swot",
        label: "SWOT Analysis",
        icon: Grid2X2,
        slide: {
            title: "SWOT Analysis",
            layout: "grid" as const,
            content: "## Strengths\n- Strong Brand\n- Loyal Customers\n\n## Weaknesses\n- Limited Budget\n- New Market\n\n## Opportunities\n- Expansion\n- Partnerships\n\n## Threats\n- Competitors\n- Regulations"
        }
    },
    {
        id: "quote",
        label: "Quote Slide",
        icon: MessageSquare,
        slide: {
            title: "Key Insight",
            layout: "quote" as const,
            content: "> \"Marketing is no longer about the stuff that you make, but about the stories you tell.\"\n\n**- Seth Godin**"
        }
    },
    {
        id: "stats",
        label: "Big Stats",
        icon: Heading1,
        slide: {
            title: "Performance",
            layout: "stats" as const,
            content: "## 150%\nGrowth in Q1\n\n## 24k\nNew Users\n\n## $1.2M\nRevenue Generated"
        }
    },
    {
        id: "comparison",
        label: "Comparison",
        icon: Columns2,
        slide: {
            title: "Us vs Them",
            layout: "comparison" as const,
            content: "## Us\n- Innovative\n- Fast\n- Reliable\n\n## Them\n- Traditional\n- Slow\n- Complex"
        }
    },
    {
        id: "timeline",
        label: "Roadmap Timeline",
        icon: ListOrdered,
        slide: {
            title: "Project Roadmap",
            layout: "roadmap" as const,
            content: "## Q1: Foundation\n- Research & Discovery\n- Strategy Definition\n\n## Q2: Implementation\n- Content Production\n- Channel Launch\n\n## Q3: Growth\n- Performance Optimization\n- Scale Up"
        }
    },
    {
        id: "persona",
        label: "Persona Profile",
        icon: User,
        slide: {
            title: "Target Audience",
            layout: "persona" as const,
            content: "## The Trendsetter\n- **Age:** 18-24\n- **Interests:** Fashion, Sustainability\n- **Pain Points:** Fast fashion guilt, High prices"
        }
    },
    {
        id: "mockup",
        label: "Mobile Mockup",
        icon: Smartphone,
        slide: {
            title: "Content Concept",
            layout: "mockup" as const,
            content: "## Viral Hook\nDescribe the visual hook here...\n\n## Caption\nWrite the caption here..."
        }
    },
    {
        id: "statement",
        label: "Visual Statement",
        icon: Type,
        slide: {
            title: "Core Philosophy",
            layout: "statement" as const,
            content: "# Less is more.\nSimplicity is the ultimate sophistication."
        }
    },
    {
        id: "gallery",
        label: "Image Gallery",
        icon: GalleryHorizontal,
        slide: {
            title: "Visual Mood",
            layout: "gallery" as const,
            content: "## Mood\nDescribe the aesthetic here..."
        }
    }
];
