# FitConnect Frontend

A modern, responsive frontend for the FitConnect personal trainer platform built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Landing Page**: Hero section, features, testimonials, and call-to-action
- **Trainers Page**: Browse trainers with filtering and pagination
- **Client Dashboard**: Comprehensive dashboard with sidebar navigation
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Animations**: AOS animations for smooth user experience
- **Accessibility**: WCAG compliant with proper focus states and ARIA attributes

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Feather Icons
- **Animations**: AOS (Animate On Scroll)
- **Font**: Inter

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with navbar and footer
│   ├── page.tsx           # Landing page
│   ├── trainers/          # Trainers page
│   └── client/            # Client dashboard
├── components/            # Reusable components
│   ├── Cards/            # Card components
│   ├── Trainers/         # Trainer-specific components
│   ├── Navbar.tsx        # Navigation bar
│   ├── Footer.tsx        # Footer
│   ├── Sidebar.tsx       # Dashboard sidebar
│   └── PageHeader.tsx    # Dashboard header
├── lib/                  # Utilities and data
│   ├── types.ts          # TypeScript type definitions
│   └── data.ts           # Mock data
└── styles/
    └── globals.css       # Global styles and custom utilities
```

## Key Components

### Pages
- **Landing Page** (`/`): Marketing page with hero, features, testimonials
- **Trainers Page** (`/trainers`): Browse and filter trainers
- **Client Dashboard** (`/client`): User dashboard with sidebar navigation

### Components
- **Navbar**: Fixed navigation with mobile menu
- **Sidebar**: Collapsible sidebar for dashboard
- **Cards**: Reusable card components for stats, sessions, programs, messages
- **Filters**: Trainer filtering functionality
- **Pagination**: Grid pagination for trainers

## Custom Utilities

The project includes custom CSS utilities in `globals.css`:

- `.card-hover`: Hover effects for cards
- `.hero-gradient`: Gradient background for hero section
- `.sidebar-*`: Sidebar collapse/expand utilities
- `.focus-ring`: Consistent focus states for accessibility

## Features

### Responsive Design
- Mobile-first approach
- Responsive grid layouts
- Collapsible sidebar on mobile
- Touch-friendly interactions

### Accessibility
- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Color contrast compliance

### Performance
- Optimized images with Next.js Image component
- Lazy loading with AOS
- Efficient state management
- Minimal bundle size

## Development

### Adding New Pages
1. Create a new directory in `src/app/`
2. Add `page.tsx` with your component
3. Update navigation in `Navbar.tsx`

### Adding New Components
1. Create component in appropriate directory
2. Add TypeScript types if needed
3. Import and use in pages

### Styling
- Use Tailwind CSS classes
- Add custom utilities to `globals.css` if needed
- Follow mobile-first responsive design

## Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Export static files (if needed)
npm run export
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is part of the FitConnect personal trainer platform.