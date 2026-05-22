# Pharmacy Inventory Management Frontend

A production-ready pharmacy inventory management system frontend built with Next.js, Tailwind CSS, and Zustand.

## Features

- **Dashboard**: Overview of inventory, sales, and purchases
- **Medicine Management**: CRUD operations for medicines
- **Purchase Tracking**: Record and manage medicine purchases
- **Sales Management**: Track and record sales transactions
- **Reports**: Analytics and business insights
- **Notifications**: Real-time alerts and updates
- **User Profile**: Account management
- **Settings**: Configurable preferences

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Tabler Icons
- **Language**: JavaScript (no TypeScript)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Dashboard routes with layout
│   ├── globals.css        # Global styles
│   ├── layout.js          # Root layout
│   └── page.js            # Home page
├── components/            # Reusable React components
│   ├── Layout/           # Layout components (Sidebar, Topbar)
│   ├── Common/           # Common components (Button, Input, etc.)
│   ├── Medicine/         # Medicine-specific components
│   ├── Purchase/         # Purchase-specific components
│   └── Sale/             # Sale-specific components
├── hooks/                # Custom React hooks
├── services/             # API service layer using Axios
├── store/                # Zustand stores
└── utils/                # Utilities and helpers
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies

```bash
npm install
```

2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` to set your API URL:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Component Guidelines

### Functional Components

All components are functional components using React Hooks:

```javascript
'use client';

export default function MyComponent() {
  const [state, setState] = useState(null);
  // Component logic
  return <div>Content</div>;
}
```

### API Calls

Use services from `src/services/` for API calls:

```javascript
import { medicineService } from '@/services/medicineService';

const medicines = await medicineService.getAll();
```

### State Management

Use Zustand stores for global state:

```javascript
import useAuthStore from '@/store/authStore';

const user = useAuthStore((state) => state.user);
```

### Custom Hooks

Use provided custom hooks:

```javascript
import { useNotification } from '@/hooks/useNotification';

const { success, error } = useNotification();
success('Action completed!');
```

## API Integration

The frontend expects a backend API at `http://localhost:5000/api`.

Key endpoints:

- `POST /api/auth/login` - User login
- `GET /api/medicines` - Get all medicines
- `POST /api/medicines` - Create medicine
- `GET /api/purchases` - Get purchases
- `POST /api/purchases` - Create purchase
- `GET /api/sales` - Get sales
- `POST /api/sales` - Create sale

All API calls include automatic JWT token handling via Axios interceptors.

## Styling

Tailwind CSS is configured for:

- Responsive design
- Custom color scheme (primary color palette)
- Smooth transitions
- Accessible components

## Best Practices

1. **Component Structure**: Keep components small and focused
2. **Props**: Use descriptive prop names
3. **Error Handling**: Always handle API errors with user feedback
4. **Loading States**: Show loading indicators during async operations
5. **Accessibility**: Use semantic HTML and ARIA attributes
6. **Performance**: Use React.memo for expensive components

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables

Set environment variables for production:

```
NEXT_PUBLIC_API_URL=https://your-api.com/api
```

## Common Tasks

### Adding a New Page

1. Create a new file in `src/app/(dashboard)/dashboard/[feature]/page.js`
2. Use DashboardLayout for consistent layout
3. Import necessary services and hooks
4. Implement component logic

### Adding a New Component

1. Create in appropriate folder in `src/components/`
2. Use 'use client' directive for interactive components
3. Export as default
4. Add JSDoc comments for props

### Adding API Endpoints

1. Create service file in `src/services/`
2. Export methods using apiClient
3. Update constants in `src/utils/constants.js`
4. Import and use in components

## License

Proprietary - Cloud-based Inventory System
