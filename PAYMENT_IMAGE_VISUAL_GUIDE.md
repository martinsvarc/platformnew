# 📸 Payment Image Generator - Visual Guide

## 🎨 What the Generated Images Look Like

The payment images are designed to be beautiful, professional, and perfectly sized for Telegram sharing.

### Image Specifications
- **Dimensions**: 1200 x 1400 pixels
- **Format**: PNG
- **File Size**: ~200-400 KB
- **Optimized for**: Telegram groups

---

## 🖼️ Image Layout

```
┌─────────────────────────────────────────┐
│  ╔═══════════════════════════════════╗  │
│  ║   [Golden corner accent]          ║  │
│  ║                                   ║  │
│  ║        💰 NEW PAYMENT             ║  │  ← Title (bold, white)
│  ║     ─────────────────────         ║  │  ← Purple divider line
│  ║                                   ║  │
│  ║   ╭────────────╮                  ║  │
│  ║   │  [Photo]   │  Chatter Name    ║  │  ← Profile pic with glow
│  ║   │   120px    │  Total: 125k CZK ║  │  ← Chatter stats (gold)
│  ║   ╰────────────╯                  ║  │
│  ║                                   ║  │
│  ║   ┌─────────────────────────────┐ ║  │
│  ║   │                             │ ║  │  ← Payment amount box
│  ║   │      5,000 CZK              │ ║  │     (gradient text, glow)
│  ║   │                             │ ║  │     (purple border)
│  ║   └─────────────────────────────┘ ║  │
│  ║                                   ║  │
│  ║   🆕 Client#12345                 ║  │  ← Client name
│  ║   NEW CLIENT                      ║  │  ← Status (gold/purple)
│  ║                                   ║  │
│  ║   ┌─────────────────────────────┐ ║  │
│  ║   │ 💳 Client Sent Total        │ ║  │  ← Info boxes
│  ║   │    5,000 CZK                │ ║  │     (semi-transparent)
│  ║   └─────────────────────────────┘ ║  │
│  ║                                   ║  │
│  ║   ┌─────────────────────────────┐ ║  │
│  ║   │ 📅 Client Session           │ ║  │
│  ║   │    1st day                  │ ║  │
│  ║   └─────────────────────────────┘ ║  │
│  ║                                   ║  │
│  ║   ┌─────────────────────────────┐ ║  │
│  ║   │ 🛍️ Product                  │ ║  │
│  ║   │    Premium content package  │ ║  │
│  ║   └─────────────────────────────┘ ║  │
│  ║                                   ║  │
│  ║   ┌─────────────────────────────┐ ║  │
│  ║   │ 💬 Message                  │ ║  │  ← Custom message box
│  ║   │ Great first session!        │ ║  │     (gold border)
│  ║   │ Looking forward to more 🎉  │ ║  │
│  ║   └─────────────────────────────┘ ║  │
│  ║                                   ║  │
│  ║   Generated: Oct 9, 2025, 3:45 PM║  │  ← Timestamp
│  ║   [Golden corner accent]          ║  │
│  ╚═══════════════════════════════════╝  │
└─────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### Background
- **Outer**: Dark gradient (Obsidian → Charcoal → Obsidian)
- **Card**: Semi-transparent dark with blur effect
- **Subtle noise**: Random purple pixels for texture

### Borders & Accents
- **Main Card Border**: Neon Orchid purple with glow
  - `rgba(218, 112, 214, 0.5)`
- **Corner Accents**: Sunset Gold
  - `rgb(255, 215, 0)`
- **Divider Lines**: Purple semi-transparent

### Text Colors
- **Title**: Pearl white (`rgb(248, 248, 255)`)
- **Payment Amount**: Gradient (Purple → Gold)
- **Client Status (New)**: Sunset Gold
- **Client Status (Old)**: Neon Orchid
- **Labels**: Smoke gray (`rgb(60, 60, 63)`)
- **Values**: Pearl white

### Special Effects
- **Profile Picture**: Circular with purple glow
- **Payment Box**: Purple border with glow effect
- **Message Box**: Gold border with light yellow tint
- **Info Boxes**: Semi-transparent gray with subtle purple border

---

## 📱 Example Scenarios

### Scenario 1: New Client Payment
```
Status Badge: 🆕 NEW CLIENT (in gold)
Payment Amount: Prominent gradient display
Client Day: "1st day"
Overall vibe: Exciting, celebratory
```

### Scenario 2: Returning Client
```
Status Badge: 🔄 RETURNING CLIENT (in purple)
Payment Amount: Same prominent display
Client Day: "5th session"
Client Total: Shows cumulative amount
Overall vibe: Professional, established
```

### Scenario 3: Big Payment
```
Same layout but:
- Larger numbers stand out
- Multiple sessions shown
- High client total displayed
- Celebratory message encouraged
Overall vibe: Achievement, success
```

---

## 🎭 Visual Elements

### Header Section
- **Title**: Large, bold "💰 NEW PAYMENT"
- **Divider**: Elegant purple line
- **Spacing**: Generous padding for readability

### Profile Section
- **Shape**: Perfect circle, 120px diameter
- **Border**: 4px solid purple with glow
- **Fallback**: Displays info without image if URL fails

### Payment Amount
- **Font Size**: Extra large (70px)
- **Style**: Bold gradient text
- **Shadow**: Purple glow effect
- **Background**: Highlighted box with purple border

### Info Grid
- **Layout**: Stacked boxes with consistent spacing
- **Icons**: Emoji for visual interest
- **Hierarchy**: Label (small) → Value (large, bold)

### Message Box
- **Border**: Gold color to distinguish from other boxes
- **Background**: Light yellow tint
- **Text**: Wrapped automatically, max 3 lines

### Footer
- **Content**: Timestamp in Czech locale
- **Style**: Small, gray, centered
- **Purpose**: Tracking and authenticity

### Corner Accents
- **Position**: All four corners
- **Color**: Gold
- **Style**: L-shaped line accents
- **Purpose**: Decorative framing

---

## 🌟 Design Principles

1. **Hierarchy**: Most important info (amount) is largest
2. **Contrast**: Dark background with light text
3. **Consistency**: All boxes use same styling pattern
4. **Balance**: Even spacing and alignment
5. **Elegance**: Frosted glass and glow effects
6. **Readability**: Clear fonts, good spacing
7. **Brand Identity**: Uses platform's signature colors

---

## 📐 Responsive Considerations

While the image is fixed size (1200x1400), it's designed to:
- Display well on mobile Telegram (scales automatically)
- Look professional on desktop
- Maintain readability at various sizes
- Work in both light and dark Telegram themes

---

## 🎨 Customization Points

If you want to customize the design, edit these sections in `generate-payment-image.js`:

### Colors
```javascript
const COLORS = {
  neonOrchid: 'rgb(218, 112, 214)',
  sunsetGold: 'rgb(255, 215, 0)',
  // ... etc
}
```

### Dimensions
```javascript
const width = 1200;
const height = 1400;
```

### Layout Spacing
```javascript
const cardPadding = 40;
const leftMargin = cardX + 60;
currentY += 50; // Adjust vertical spacing
```

### Text Sizes
```javascript
ctx.font = 'bold 56px Arial'; // Title
ctx.font = 'bold 70px Arial'; // Payment amount
ctx.font = 'bold 38px Arial'; // Client name
```

---

## 🎯 Perfect For

✅ Telegram group announcements
✅ Team motivation and celebration
✅ Payment tracking and records
✅ Professional presentation
✅ Easy sharing and communication
✅ Visual payment logs

---

## 💡 Tips for Best Results

1. **Profile Pictures**: Use high-quality square images (300x300px+)
2. **Client Names**: Use consistent format (Client#12345)
3. **Messages**: Keep under 100 characters for best display
4. **Currency**: Always include for clarity
5. **Session Info**: Be specific ("1st day", "3rd session")

---

## 🔍 Preview

Want to see it in action?
1. Visit `/payment-image-test`
2. Click any example button
3. Generate and preview!

---

**The images are designed to make your team proud and your clients feel valued! 🌟**

