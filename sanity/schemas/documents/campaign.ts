import { defineField, defineType } from "sanity";
import { Flag } from "lucide-react";

export default defineType({
  name: "campaign",
  type: "document",
  title: "Campaign",
  icon: Flag,
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Campaign Title",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "client",
      type: "reference",
      title: "Client",
      to: [{ type: "account" }],
      options: {
        filter: 'type == "client"',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      options: {
        list: [
          { title: "Planned", value: "planned" },
          { title: "Active", value: "active" },
          { title: "Paused", value: "paused" },
          { title: "Completed", value: "completed" },
          { title: "Cancelled", value: "cancelled" },
        ],
        layout: "radio",
      },
      initialValue: "planned",
    }),
    defineField({
      name: "startDate",
      type: "datetime",
      title: "Start Date",
    }),
    defineField({
      name: "endDate",
      type: "datetime",
      title: "End Date",
    }),
    defineField({
      name: "description",
      type: "text",
      title: "Description/Objectives",
    }),
    defineField({
      name: "budget",
      type: "number",
      title: "Budget",
    }),
    defineField({
        name: "manager",
        type: "reference",
        title: "Account Manager",
        to: [{ type: "account" }],
    }),
    defineField({
      name: "strategyDeck",
      type: "object",
      title: "Strategy Deck",
      fields: [
        defineField({
            name: "status",
            type: "string",
            title: "Strategy Status",
            options: {
                list: [
                    { title: "Drafting", value: "drafting" },
                    { title: "Internal Review", value: "internal_review" },
                    { title: "Client Review", value: "client_review" },
                    { title: "Approved", value: "approved" }
                ],
                layout: "radio"
            },
            initialValue: "drafting"
        }),
        defineField({
            name: "slides",
            type: "array",
            title: "Slides",
            of: [
                {
                    type: "object",
                    name: "slide",
                    title: "Slide",
                    fields: [
                        defineField({ name: "title", type: "string", title: "Slide Title" }),
                        defineField({ 
                            name: "layout", 
                            type: "string", 
                            options: { 
                                list: [
                                    { title: "Title Slide", value: "title" },
                                    { title: "Text Only", value: "text" },
                                    { title: "Split (Text + Image)", value: "split" },
                                    { title: "Grid (Data/Pillars)", value: "grid" },
                                    { title: "Full Image", value: "image" },
                                    { title: "Persona Profile", value: "persona" },
                                    { title: "Mobile Mockup", value: "mockup" },
                                    { title: "Visual Statement", value: "statement" },
                                    { title: "Image Gallery", value: "gallery" }
                                ] 
                            },
                            initialValue: "text"
                        }),
                        defineField({ name: "content", type: "text", title: "Content (Markdown)" }),
                        defineField({
                            name: "image",
                            type: "image",
                            title: "Image",
                            options: { hotspot: true }
                        }),
                        defineField({
                            name: "galleryImages",
                            title: "Gallery Images",
                            type: "array",
                            of: [{ type: "image", options: { hotspot: true } }],
                            hidden: ({ parent }) => parent?.layout !== 'gallery'
                        }),
                        defineField({
                            name: "notes",
                            type: "text",
                            title: "Speaker Notes",
                            rows: 3
                        }),
                        defineField({
                            name: "comments",
                            type: "array",
                            title: "Comments",
                            of: [{
                                type: "object",
                                fields: [
                                    defineField({ name: "text", type: "text", title: "Comment" }),
                                    defineField({ name: "author", type: "string", title: "Author" }),
                                    defineField({ name: "date", type: "datetime", title: "Date" }),
                                    defineField({ name: "resolved", type: "boolean", title: "Resolved", initialValue: false })
                                ]
                            }]
                        })
                    ],
                    preview: {
                        select: { title: "title", subtitle: "layout", media: "image" }
                    }
                }
            ]
        }),
        defineField({
            name: "proposedDeliverables",
            type: "array",
            title: "Proposed Deliverables Plan",
            description: "Deliverables to be created upon strategy approval",
            of: [
                {
                    type: "object",
                    name: "proposedDeliverable",
                    title: "Proposed Deliverable",
                    fields: [
                        defineField({ name: "title", type: "string", title: "Title" }),
                        defineField({ 
                            name: "type", 
                            type: "string", 
                            title: "Format",
                            options: {
                                list: [
                                    { title: "Reel", value: "reel" },
                                    { title: "Story", value: "story" },
                                    { title: "Carousel", value: "carousel" },
                                    { title: "Static Post", value: "static_post" },
                                    { title: "Video (Long form)", value: "video_long" },
                                    { title: "Other", value: "other" },
                                ]
                            }
                        }),
                        defineField({
                            name: "platform",
                            type: "string",
                            title: "Platform",
                            options: {
                                list: [
                                    { title: "Instagram", value: "instagram" },
                                    { title: "TikTok", value: "tiktok" },
                                    { title: "LinkedIn", value: "linkedin" },
                                    { title: "YouTube", value: "youtube" },
                                    { title: "Facebook", value: "facebook" },
                                    { title: "Twitter/X", value: "twitter" },
                                    { title: "Other", value: "other" },
                                ]
                            }
                        }),
                        defineField({ name: "description", type: "text", title: "Brief Description" }),
                        defineField({ name: "visualDirection", type: "text", title: "Visual Direction" }),
                        defineField({ name: "assets", type: "array", title: "Assets", of: [{ type: "image" }, { type: "file" }] }),
                        defineField({ name: "references", type: "array", title: "References", of: [{ type: "url" }] }),
                        defineField({
                            name: "prediction",
                            type: "object",
                            title: "Performance Prediction",
                            fields: [
                                defineField({ name: "score", type: "number", title: "Score" }),
                                defineField({ name: "advice", type: "array", of: [{ type: "string" }], title: "Advice" })
                            ]
                        })
                    ]
                }
            ]
        }),
        defineField({
            name: "competitors",
            type: "array",
            title: "Competitor Analysis",
            of: [
                {
                    type: "object",
                    fields: [
                        defineField({ name: "name", type: "string", title: "Name" }),
                        defineField({ name: "url", type: "url", title: "URL" }),
                        defineField({ name: "notes", type: "text", title: "Notes/Analysis" }),
                        defineField({ name: "screenshot", type: "image", title: "Screenshot" }),
                        defineField({
                            name: "feed",
                            type: "array",
                            title: "Live Feed",
                            of: [
                                {
                                    type: "object",
                                    fields: [
                                        defineField({ name: "title", type: "string", title: "Title" }),
                                        defineField({ name: "url", type: "url", title: "URL" }),
                                        defineField({ name: "date", type: "string", title: "Date" }),
                                        defineField({ name: "source", type: "string", title: "Source" })
                                    ]
                                }
                            ]
                        })
                    ],
                    preview: {
                        select: { title: "name", subtitle: "url", media: "screenshot" }
                    }
                }
            ]
        }),
        defineField({
            name: "moodboard",
            type: "array",
            title: "Moodboard",
            of: [
                {
                    type: "object",
                    fields: [
                        defineField({ name: "url", type: "url", title: "Image URL" }),
                        defineField({ name: "note", type: "string", title: "Note" }),
                        defineField({ name: "image", type: "image", title: "Upload" })
                    ],
                    preview: {
                        select: { title: "note", subtitle: "url", media: "image" }
                    }
                }
            ]
        }),
        defineField({
            name: "strategicPillars",
            type: "array",
            title: "Strategic Pillars",
            of: [{ type: "string" }]
        }),
        defineField({
            name: "targetAudience",
            type: "text",
            title: "Target Audience"
        }),
        defineField({
            name: "toneOfVoice",
            type: "text",
            title: "Tone of Voice"
        }),
        defineField({
            name: "status",
            type: "string",
            title: "Strategy Status",
            options: {
                list: [
                    { title: "Draft", value: "draft" },
                    { title: "Internal Review", value: "review" },
                    { title: "Client Review", value: "client_review" },
                    { title: "Approved", value: "approved" },
                    { title: "Changes Requested", value: "changes_requested" }
                ],
                layout: "radio"
            },
            initialValue: "draft"
        }),
        defineField({ name: "approvalToken", type: "string", title: "Approval Token" }),
        defineField({ name: "approvedAt", type: "datetime", title: "Approved At" })
      ]
    })
  ],
  preview: {
    select: {
      title: "title",
      client: "client.name",
      status: "status",
    },
    prepare({ title, client, status }) {
      return {
        title,
        subtitle: `${client || "No Client"} • ${status}`,
      };
    },
  },
});
