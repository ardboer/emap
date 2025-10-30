# Article Detail Page Design Specification

Based on Figma designs:

- Light mode: https://www.figma.com/design/tH7b9yaAOOowz2w0t48INH/EMAP-Apps-library?node-id=13-146
- Dark mode: https://www.figma.com/design/tH7b9yaAOOowz2w0t48INH/EMAP-Apps-library?node-id=13-136

## Color Specifications

### Light Mode

| Element                     | Color     | Usage                       |
| --------------------------- | --------- | --------------------------- |
| Main Background             | `#FFFFFF` | Page background             |
| Title Text                  | `#00334C` | Article title               |
| Body Text                   | `#011620` | Article body content        |
| Meta Text                   | `#00334C` | Timestamp, metadata         |
| Back Button Background      | `#00334C` | Back button container       |
| Back Button Text            | `#B3F4FF` | Back button label           |
| Highlight Box Background    | `#00334C` | Featured content boxes      |
| Highlight Box Text          | `#FFFFFF` | Text inside highlight boxes |
| Highlight Box Border        | `#10D1F0` | Top border (2px)            |
| Trending Section Background | `#B3F4FF` | Trending articles section   |
| Trending Section Title      | `#00334C` | Section heading             |
| Article List Background     | `#FFFFFF` | News/Events list background |
| Article Teaser Title        | `#00334C` | Teaser title text           |

### Dark Mode

| Element                     | Color     | Usage                       |
| --------------------------- | --------- | --------------------------- |
| Main Background             | `#011620` | Page background             |
| Title Text                  | `#FFFFFF` | Article title               |
| Body Text                   | `#FFFFFF` | Article body content        |
| Meta Text                   | `#85E7F7` | Timestamp, metadata         |
| Back Button Background      | `#00334C` | Back button container       |
| Back Button Text            | `#B3F4FF` | Back button label           |
| Highlight Box Background    | `#00334C` | Featured content boxes      |
| Highlight Box Text          | `#FFFFFF` | Text inside highlight boxes |
| Highlight Box Border        | `#10D1F0` | Top border (2px)            |
| Trending Section Background | `#B3F4FF` | Trending articles section   |
| Trending Section Title      | `#00334C` | Section heading             |
| Article List Background     | `#011620` | News/Events list background |
| Article Teaser Title        | `#FFFFFF` | Teaser title text           |

## Typography Specifications

### Article Meta (Timestamp)

- **Font Family**: Open Sans
- **Font Weight**: 500 (Medium)
- **Font Size**: 12px
- **Line Height**: 1em (12px)
- **Text Transform**: UPPERCASE
- **Text Align**: LEFT

### Article Title (Main Heading)

- **Font Family**: Open Sans
- **Font Weight**: 700 (Bold)
- **Font Size**: 20px
- **Line Height**: 1.2em (24px)
- **Text Align**: LEFT

### Article Subtitle/Lead

- **Font Family**: Open Sans
- **Font Weight**: 700 (Bold)
- **Font Size**: 16px
- **Line Height**: 1.375em (22px)
- **Text Align**: LEFT

### Article Body Text

- **Font Family**: Open Sans
- **Font Weight**: 400 (Regular)
- **Font Size**: 16px
- **Line Height**: 1.375em (22px)
- **Text Align**: LEFT

### Highlight Box Title

- **Font Family**: Open Sans
- **Font Weight**: 700 (Bold)
- **Font Size**: 18px
- **Line Height**: 1.389em (25px)
- **Text Align**: LEFT

### Trending Section Title

- **Font Family**: Open Sans
- **Font Weight**: 700 (Bold)
- **Font Size**: 20px
- **Line Height**: 1.2em (24px)
- **Text Transform**: UPPERCASE
- **Text Align**: LEFT

### Trending Article Title

- **Font Family**: Open Sans
- **Font Weight**: 600 (SemiBold)
- **Font Size**: 16px
- **Line Height**: 1.25em (20px)
- **Text Align**: LEFT

### Back Button Text

- **Font Family**: Open Sans
- **Font Weight**: 600 (SemiBold)
- **Font Size**: 12px
- **Line Height**: 1em (12px)
- **Text Transform**: UPPERCASE
- **Text Align**: LEFT

## Layout & Spacing Specifications

### Main Container

- **Padding**: 32px top, 0px sides (content starts at 16px from edges via section)
- **Gap between sections**: 64px

### Article Content Section

- **Width**: 288px (320px screen - 32px horizontal padding)
- **Gap between elements**: 18px
- **Horizontal padding**: 16px (from screen edge)

### Article Meta Container

- **Layout**: Row (horizontal)
- **Gap**: 10px
- **Alignment**: Stretch

### Highlight Box

- **Width**: 288px
- **Padding**: 12px (light mode), 12px (dark mode)
- **Gap between elements**: 16px
- **Border**: 2px solid `#10D1F0` (top only)
- **Border Radius**: 4px

### Trending Section

- **Width**: 288px
- **Padding**: 16px 8px
- **Gap between items**: 12px
- **Border**: 2px solid `#00334C` (top only)
- **Border Radius**: 4px

### Trending Section Header

- **Layout**: Row (horizontal)
- **Gap**: 8px
- **Padding**: 8px 0px
- **Icon Size**: 16x16px

### Trending Article Item

- **Layout**: Row (horizontal)
- **Gap**: 12px
- **Padding**: 0px 0px 12px
- **Border**: 1px solid `#FFFFFF` (bottom only)
- **Thumbnail Size**: 100x75px
- **Thumbnail Padding Top**: 4px

### Top Navigation

- **Padding**: 48px 16px 16px
- **Gap**: 10px
- **Background**: Linear gradient (0deg, rgba(1, 22, 32, 0) 0%, rgba(1, 22, 32, 0.5) 33%)

### Back Button

- **Layout**: Row (horizontal)
- **Gap**: 4px
- **Padding**: 4px 8px
- **Border Radius**: 16px
- **Icon Size**: 5.33x5.33px (arrow)
- **Alignment**: Center

## Implementation Notes

1. **Font Mapping**: Use brand config fonts:

   - Primary: OpenSans-Regular (400)
   - PrimaryMedium: OpenSans-Medium (500)
   - PrimarySemiBold: OpenSans-SemiBold (600)
   - PrimaryBold: OpenSans-Bold (700)

2. **Responsive Considerations**:

   - Design is based on iPhone SE (320px width)
   - Content width: 288px (with 16px side margins)
   - Scale appropriately for larger screens

3. **Color Configuration**:

   - All colors should be added to brand config.json
   - Use theme-aware color system via Colors.ts
   - Support both light and dark modes

4. **Component Updates Required**:

   - ArticleDetailView.tsx: Complete redesign to match Figma
   - ArticleTeaser.tsx: Update title color to be theme-aware
   - news.tsx & events.tsx: Apply list background colors

5. **Key Differences from Current Implementation**:
   - Current uses hardcoded `#007AFF` for buttons (should be `#00334C` bg with `#B3F4FF` text)
   - Current title styling doesn't match Figma specs
   - Missing highlight box styling
   - Missing trending section styling
   - Meta text needs uppercase transform
   - Spacing/gaps need adjustment to match Figma
