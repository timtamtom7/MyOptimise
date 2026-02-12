
import { AlignLeft, Columns2, Grid2X2, MessageSquare, Heading1, ListOrdered, User, Smartphone, Type, GalleryHorizontal, Table, Calendar, PlayCircle } from "lucide-react";
import { StrategySlide } from "@/components/dashboard/strategy/strategy-deck-viewer";

export interface SlideTemplate {
    id: string;
    label: string;
    icon: any;
    tips: string[];
    slide: Partial<StrategySlide>;
}

export const SLIDE_TEMPLATES: SlideTemplate[] = [
    {
        id: "title",
        label: "Title Slide",
        icon: Heading1,
        tips: [
            "Keep the title concise and impactful.",
            "Use the subtitle to set the context or specify the client name.",
            "This slide sets the tone for the entire presentation."
        ],
        slide: {
            title: "Campaign Strategy",
            layout: "title",
            content: "Subtitle or brief description goes here."
        }
    },
    {
        id: "default",
        label: "Standard Text",
        icon: AlignLeft,
        tips: [
            "Use bullet points for readability.",
            "Limit text to 5-7 lines per slide to avoid clutter.",
            "Use headers (##) to structure your arguments."
        ],
        slide: {
            title: "Key Points",
            layout: "text",
            content: "## Overview\n- Point 1\n- Point 2\n- Point 3"
        }
    },
    {
        id: "split",
        label: "Image & Text",
        icon: Columns2,
        tips: [
            "Ensure the image directly supports the text.",
            "Use high-resolution images for a professional look.",
            "Balance the text length to match the image height."
        ],
        slide: {
            title: "Visual Context",
            layout: "split",
            content: "## Description\nAdd details here about the visual..."
        }
    },
    {
        id: "image",
        label: "Full Image",
        icon: GalleryHorizontal,
        tips: [
            "Use a caption to explain the image's significance.",
            "Great for mood setting or high-impact visuals.",
            "Avoid text overlays on busy parts of the image."
        ],
        slide: {
            title: "Visual Focus",
            layout: "image",
            content: "Caption for the image"
        }
    },
    {
        id: "video",
        label: "Video Embed",
        icon: PlayCircle,
        tips: [
            "Paste a YouTube or Loom URL.",
            "Video is perfect for explaining complex concepts or walkthroughs.",
            "Keep videos under 2 minutes for better engagement."
        ],
        slide: {
            title: "Video Walkthrough",
            layout: "video",
            content: "## Video Context\nExplain what the viewer is about to see..."
        }
    },
    {
        id: "statement",
        label: "Quote / Statement",
        icon: MessageSquare,
        tips: [
            "Use this for powerful quotes or key takeaways.",
            "Keep it short—one sentence is ideal.",
            "Attribute quotes to their source if applicable."
        ],
        slide: {
            title: "Key Insight",
            layout: "statement",
            content: "Marketing is no longer about the stuff that you make, but about the stories you tell."
        }
    },
    {
        id: "data-grid",
        label: "Data Grid",
        icon: Table,
        tips: [
            "Format: '- Label: Value' (e.g., '- Growth: 150%').",
            "Focus on 3-6 key metrics.",
            "Use this to show quick stats or KPIs."
        ],
        slide: {
            title: "Performance Metrics",
            layout: "data-grid",
            content: "- 150% Growth\n- 24k New Users\n- $1.2M Revenue\n- 85% Retention"
        }
    },
    {
        id: "timeline",
        label: "Timeline",
        icon: Calendar,
        tips: [
            "Format: '- Date/Phase: Description'.",
            "Limit to 4-6 major milestones.",
            "Ideal for roadmaps and phased rollouts."
        ],
        slide: {
            title: "Execution Roadmap",
            layout: "timeline",
            content: "- Q1: Research & Discovery\n- Q2: Content Production\n- Q3: Channel Launch\n- Q4: Scale & Optimize"
        }
    },
    {
        id: "grid",
        label: "4-Quadrant Grid",
        icon: Grid2X2,
        tips: [
            "Use '## Heading' for each quadrant title.",
            "Perfect for SWOT analysis or 2x2 matrices.",
            "Keep bullet points concise within each quadrant."
        ],
        slide: {
            title: "SWOT Analysis",
            layout: "grid",
            content: "## Strengths\n- Strong Brand\n- Loyal Customers\n\n## Weaknesses\n- Limited Budget"
        }
    },
    {
        id: "persona",
        label: "Persona Profile",
        icon: User,
        tips: [
            "Define Age, Interests, and Pain Points.",
            "Give the persona a catchy name (e.g., 'The Trendsetter').",
            "Use the image slot for a representative photo."
        ],
        slide: {
            title: "Target Audience",
            layout: "persona",
            content: "## The Trendsetter\n- **Age:** 18-24\n- **Interests:** Fashion, Sustainability"
        }
    },
    {
        id: "mockup",
        label: "Mobile Mockup",
        icon: Smartphone,
        tips: [
            "Upload a vertical image (9:16 aspect ratio).",
            "Use the caption to explain the content strategy.",
            "Great for showing Instagram Stories or TikToks."
        ],
        slide: {
            title: "Content Preview",
            layout: "mockup",
            content: "## Caption\nWrite the caption here..."
        }
    },
    {
        id: "gallery",
        label: "Image Gallery",
        icon: GalleryHorizontal,
        tips: [
            "Upload 3-6 images for a balanced grid.",
            "Use for moodboards or visual style guides.",
            "You can remove individual images after uploading."
        ],
        slide: {
            title: "Visual Mood",
            layout: "gallery",
            content: "## Mood\nDescribe the aesthetic here..."
        }
    }
];
