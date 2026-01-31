# Award-Winning Perfection Checklist: /flow Route

This checklist visualizes the "Silent Luxury" standard: seamless, robust, beautiful, and intelligent.
Items are prioritized by Impact (Functionality > Visual Polish > Edge Cases).

**Phase 1: Critical Functionality (The Core Pillars) - **HIGH PRIORITY**
- [x] 1.  **Assets Tab Implementation**: Currently empty. Must support multi-file upload (drag & drop).
- [x] 2.  **Assets Tab Grid View**: Display uploaded assets with intelligent aspect ratio handling.
- [x] 3.  **Assets Tab Delete/Manage**: Context menu to delete or rename assets.
- [x] 4.  **Context Tab AI Suggestions**: "Generate Suggestions" button must actually populate the "Key Objectives" and "Target Audience" fields via AI.
5.  **Context Tab Auto-Save**: Verify 2000ms debounce works flawlessly for *every* field (Brand Name, Website, etc.) without race conditions.
- [x] 6.  **Plan Tab PDF Export**: "Export PDF" must render the *actual* current slides, not a placeholder.
7.  **Plan Tab Slide Addition**: "Add Slide" must allow selecting from the 11 templates visually.
8.  **Plan Tab Slide Deletion**: Ability to remove a slide from the list.
9.  **Plan Tab Reordering**: Drag-and-drop to reorder slides in the sidebar.
10. **Research Tab Voice Input**: Microphone button for the AI chat must work (Web Speech API).
11. **Research Tab URL Scraper**: Analyzing a URL must return *real* data (meta tags, summary) or a graceful error, never crash.
12. **Research Tab Chat History**: Chat must persist across tab switches (state management).
13. **Competitors Tab Card Creation**: Ability to manually add a competitor.
- [x] 14. **Competitors Tab AI Analysis**: "Analyze Competitors" button must fill the matrix.
15. **Comments Tab Core**: Ability to add a comment to a specific slide.
16. **Comments Tab Display**: Show comments in a list, filtered by active slide.
17. **Review Mode Access**: "Client View" button must open a clean, read-only version of the deck.
18. **Review Mode Mobile**: Client view must be 100% responsive on mobile (stack slides or swipe).
19. **Global Auth Protection**: Ensure `/flow` redirects to login if session expires.
20. **Data Persistence**: Reloading the page must restore *all* current state (from Supabase/Sanity).

## Phase 2: "Silent Luxury" Visual Polish (The Feel)
21. **Global Dark Mode**: Audit *every* input text color in Dark Mode (must be `text-slate-100`, not gray-on-gray).
22. **Global Light Mode**: Ensure inputs are `text-slate-900` with `bg-transparent` or `bg-slate-50`.
23. **Transition Smoothening**: Tab switching must use `framer-motion` `AnimatePresence` for zero-jank crossfades.
24. **Loading States**: Replace all "Loading..." text with `Skeleton` loaders or luxury spinners.
25. **Toast Notifications**: Every success/error action must trigger a `Sonner` toast (e.g., "Strategy Saved").
26. **Input Focus States**: All inputs need the specific "Silent Luxury" blue border transition (`focus:border-blue-500`).
27. **Typography Hierarchy**: Verify `font-display` (headings) vs `font-sans` (body) consistency everywhere.
28. **Slide Preview Fidelity**: The sidebar thumbnail must exactly match the main canvas scaling.
29. **Moodboard Drag Physics**: Dragging an image must feel "heavy" and smooth (spring animations).
30. **Moodboard Z-Index**: Clicking an item in Moodboard must bring it to front.
31. **Context Tab Gradient**: The "AI Recommendations" gradient should be subtle Blue, not default/purple.
32. **Sidebar Scroll**: The slide list sidebar must scroll independently without moving the main page.
33. **Toolbar Tooltips**: All icon-only buttons (bold, italic, etc.) need hover tooltips.
34. **Empty States**: Every tab needs a beautiful "Empty State" illustration if no data exists.
35. **Error Boundaries**: Component crash should show a "Reload Component" button, not white screen.

## Phase 3: Intelligent Features (The "Wow" Factor)
36. **Plan Tab ROI Calculator**: Changing inputs (Budget/CPC) must instantly update the projection graph.
37. **Plan Tab AI Slide Gen**: "Magic Generate" button for a slide content based on Context.
38. **Research Tab Source Citations**: AI answers should link to the URLs it found.
39. **Research Tab "Deep Dive"**: Suggested follow-up questions chips below AI response.
40. **Competitors Tab Visuals**: Auto-fetch favicons/logos for added competitors.
41. **Moodboard Color Palette**: Auto-extract 5 dominant colors from the uploaded moodboard images.
42. **Assets Tab Auto-Tagging**: AI suggests tags (e.g., "Logo", "Lifestyle") for uploaded images.
43. **Review Mode "Approve"**: Client "Approve" button triggers confetti and status update.
44. **Review Mode Comments**: Clients can leave comments on specific slides without logging in.
45. **Briefing Board Status**: The "Status" badge (Draft/Review/Approved) must be live-linked to DB.

## Phase 4: Edge Case Robustness (The Reliability)
46. **Network Failure**: Disconnect internet -> Show "Offline - Changes will sync later" toast.
47. **Large Image Upload**: Uploading 10MB+ image should compress or warn user.
48. **Invalid URL**: Entering "broken.com" in Research/Context should show "Invalid URL" error.
49. **Long Text Overflow**: 500-character title in Slide shouldn't break layout (ellipsis or wrap).
50. **Zero Slides**: Deleting the last slide should auto-create a default "Cover" slide.
51. **Double Click Prevention**: Prevent double-submitting "Generate Strategy".
52. **Special Characters**: Inputs handling emojis and special chars correctly.
53. **Tab Switching mid-save**: Switching tabs while "Saving..." should not lose data.
54. **Browser Back Button**: Should navigate navigation history, not break app state.
55. **Zoom Levels**: App should look good at 90% and 110% browser zoom.

## Phase 5: Detailed Component Audit (1-by-1 Check)
56. **Header Logo**: Verify `h-5` size is consistent on mobile and desktop.
57. **User Dropdown**: Clicking avatar must show "Sign Out" and "Profile".
58. **Briefing Board Dates**: Date picker must block past dates for "Due Date".
59. **Context Tab "Brand Name"**: Required field validation.
60. **Context Tab "Website"**: Clickable "Visit" icon next to input.
61. **Plan Tab "Cover Slide"**: Background image upload working.
62. **Plan Tab "Introduction Slide"**: Bullet point editor working.
63. **Plan Tab "Problem Slide"**: Graph/Chart editor working.
64. **Plan Tab "Solution Slide"**: Image + Text layout working.
65. **Plan Tab "Market Size Slide"**: TAM/SAM/SOM inputs working.
66. **Plan Tab "Product Slide"**: Carousel or Grid gallery working.
67. **Plan Tab "Business Model"**: Pricing tier editor working.
68. **Plan Tab "Go-to-Market"**: Timeline/Roadmap editor working.
69. **Plan Tab "Team Slide"**: Add/Remove team member avatars.
70. **Plan Tab "Financials"**: Table editor working.
71. **Plan Tab "Ask Slide"**: Large number input working.
72. **Research Tab Search Bar**: "Enter" key triggers search.
73. **Research Tab Loading**: Skeleton pulse while AI thinks.
74. **Competitors Tab Grid**: Responsive (1 col mobile, 3 col desktop).
75. **Moodboard Canvas**: "Clear All" button with confirmation.
76. **Moodboard Upload**: Progress bar for uploads.
77. **Assets Tab Filter**: Filter by Type (Image/Video/Doc).
78. **Assets Tab Search**: Search assets by name.
79. **Comments Tab Input**: `Cmd+Enter` to submit comment.
80. **Comments Tab Avatars**: Show author initials/avatar.
81. **Review Mode Password**: Optional password field works.
82. **Review Mode Expiry**: Link expiry date works.
83. **Mobile Menu**: Hamburger menu works smoothly.
84. **Desktop Sidebar**: Collapsible sidebar state persists.
85. **Keyboard Shortcuts**: `Cmd+S` triggers manual save.
86. **Keyboard Shortcuts**: `Esc` closes modals/moodboard full screen.
87. **Accessibility**: Tab navigation works through all inputs.
88. **Accessibility**: ARIA labels on all icon buttons.
89. **SEO**: Page titles update based on Campaign Name.
90. **Favicon**: Dynamic favicon based on status (optional).
91. **Print Styles**: `Cmd+P` prints a clean version (or blocks it in favor of Export).
92. **Text Selection**: Selection color should be Brand Blue.
93. **Scrollbars**: Custom thin scrollbars (no default OS bars).
94. **Code Blocks**: Markdown code blocks syntax highlighting (if used).
95. **Image Fallbacks**: Broken image links show placeholder.
96. **Avatar Fallbacks**: No avatar -> Initials with colored background.
97. **Rich Text**: Bold/Italic actually applies to text.
98. **Undo/Redo**: Basic undo support in text areas (browser native).
99. **Sanity Sync**: Verify data actually appears in Sanity Studio.
100. **Supabase Sync**: Verify auth/user data matches Supabase Auth.
