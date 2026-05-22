# Frontend Quick Start Guide

## Installation & Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure API URL

Create or update `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Pharmacy Inventory Management
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm start
```

---

## Project Structure Overview

### App Structure (Next.js App Router)

```
src/app/
├── (dashboard)/           # Grouped routes for dashboard
│   ├── layout.js         # Dashboard layout wrapper
│   └── dashboard/
│       ├── page.js       # Dashboard homepage
│       ├── medicines/
│       ├── purchases/
│       ├── sales/
│       ├── batches/
│       ├── reports/
│       ├── notifications/
│       ├── profile/
│       └── settings/
├── login/
│   └── page.js
├── layout.js             # Root HTML layout
├── page.js              # Home/landing page
└── globals.css          # Global styles
```

### Component Architecture

**Common Components** (`src/components/Common/`)
- `Button.js` - Reusable button with variants
- `Input.js` - Form input with validation
- `Select.js` - Dropdown selector
- `Card.js` - Styled card container
- `Table.js` - Data table with rendering
- `Modal.js` - Dialog component
- `Badge.js` - Status badge
- `Alert.js` - Alert message
- `NotificationCenter.js` - Toast notifications
- `Skeleton.js` - Loading skeleton

**Layout Components** (`src/components/Layout/`)
- `Sidebar.js` - Navigation sidebar
- `Topbar.js` - Header with user menu
- `DashboardLayout.js` - Combined layout wrapper

**Feature Components**
- `Medicine/` - Medicine CRUD
- `Purchase/` - Purchase forms & lists
- `Sale/` - Sale tracking
- `Batch/` - Batch management (forms inline)

### State Management (Zustand)

Located in `src/store/`:

```javascript
// Auth Store
import useAuthStore from '@/store/authStore';
const user = useAuthStore((state) => state.user);

// Medicine Store
import useMedicineStore from '@/store/medicineStore';
const medicines = useMedicineStore((state) => state.medicines);

// UI Store
import useUiStore from '@/store/uiStore';
const sidebarOpen = useUiStore((state) => state.sidebarOpen);

// Notification Store
import useNotificationStore from '@/store/notificationStore';
const unreadCount = useNotificationStore((state) => state.unreadCount);
```

### API Services

Located in `src/services/`:

All services use the `apiClient` which automatically handles:
- JWT token injection
- Error handling
- Request/response transformation

```javascript
import { medicineService } from '@/services/medicineService';

// GET
const medicines = await medicineService.getAll();
const medicine = await medicineService.getById(id);

// POST
await medicineService.create(data);

// PUT
await medicineService.update(id, data);

// DELETE
await medicineService.delete(id);
```

Available Services:
- `authService` - Authentication
- `medicineService` - Medicines
- `batchService` - Batches
- `purchaseService` - Purchases
- `saleService` - Sales
- `reportService` - Reports
- `notificationService` - Notifications

### Custom Hooks

Located in `src/hooks/`:

```javascript
// Async Operations
import { useAsync } from '@/hooks/useAsync';
const { execute, isLoading, error, data } = useAsync(asyncFunc);

// Notifications
import { useNotification } from '@/hooks/useNotification';
const { success, error, warning, info } = useNotification();
success('Operation successful!');

// Local Storage
import { useLocalStorage } from '@/hooks/useLocalStorage';
const [value, setValue, isLoaded] = useLocalStorage('key', defaultValue);

// Debounce
import { useDebounce } from '@/hooks/useDebounce';
const debouncedValue = useDebounce(value, 300);
```

### Utilities

Located in `src/utils/`:

- `constants.js` - Routes, endpoints, status constants
- `apiClient.js` - Axios configuration
- `errorHandler.js` - Error handling utilities
- `helpers.js` - Formatting and utility functions

---

## Common Workflows

### Adding a New Page

1. Create file: `src/app/(dashboard)/dashboard/[feature]/page.js`

```javascript
'use client';

import Card from '@/components/Common/Card';
import Button from '@/components/Common/Button';

export default function FeaturePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Feature</h1>
      {/* Content */}
    </div>
  );
}
```

### Fetching Data

```javascript
'use client';

import { useState, useEffect } from 'react';
import { featureService } from '@/services/featureService';
import { useNotification } from '@/hooks/useNotification';

export default function FeaturePage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: showError } = useNotification();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await featureService.getAll();
      setItems(data.data || data);
    } catch (err) {
      showError('Failed to fetch items');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Render items */}
    </div>
  );
}
```

### Creating/Updating Items

```javascript
const handleSubmit = async (formData) => {
  setIsLoading(true);
  try {
    if (editingItem) {
      await featureService.update(editingItem._id, formData);
      success('Item updated');
    } else {
      await featureService.create(formData);
      success('Item created');
    }
    fetchItems();
  } catch (err) {
    showError('Operation failed');
  } finally {
    setIsLoading(false);
  }
};
```

### Using Notifications

```javascript
import { useNotification } from '@/hooks/useNotification';

const { success, error, warning, info } = useNotification();

// Auto-dismiss after 3 seconds (default)
success('Operation completed!');

// Custom duration (in ms)
error('Something went wrong!', 5000);

// No auto-dismiss
info('Important message', 0);
```

### Form Validation

```javascript
const [errors, setErrors] = useState({});

const validateForm = () => {
  const newErrors = {};
  if (!formData.name) newErrors.name = 'Required';
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Invalid email';
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = (e) => {
  e.preventDefault();
  if (validateForm()) {
    // Submit
  }
};
```

---

## Styling Guide

### Tailwind Classes Usage

**Layout:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
<div className="flex items-center justify-between">
<div className="space-y-4">
```

**Colors:**
```jsx
<div className="bg-primary-500 text-white">
<div className="text-gray-600">
<div className="border border-gray-200">
```

**Responsive:**
```jsx
<div className="w-full md:w-1/2 lg:w-1/3">
<div className="hidden md:block">
<div className="block md:hidden">
```

### Custom Colors

Primary color palette is defined in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    50-900: 'Sky blue shades'
  }
}
```

---

## Testing

### Manual Testing Checklist

- [ ] Login with demo credentials
- [ ] Navigate all sidebar links
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Create, read, update, delete for each section
- [ ] Search/filter functionality
- [ ] Notifications appear and dismiss
- [ ] Forms validate correctly
- [ ] API errors show proper messages

### Demo Credentials

```
Email: admin@pharmacy.com
Password: password123
```

---

## Debugging

### Enable Debug Logs

In `src/utils/apiClient.js`:

```javascript
apiClient.interceptors.request.use((config) => {
  console.log('API Request:', config);
  return config;
});
```

### Check Store State

```javascript
// In browser console
localStorage.getItem('authToken')

// Add debugging to Zustand stores
import useAuthStore from '@/store/authStore';
console.log(useAuthStore.getState());
```

### Network Tab

1. Open DevTools → Network tab
2. Filter by XHR/Fetch
3. Check request/response

---

## Deployment

### Vercel (Recommended for Next.js)

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

---

## Performance Tips

1. **Use Image Optimization**: Use `next/image` for images
2. **Code Splitting**: Dynamic imports for heavy components
3. **Lazy Load**: Use React.lazy for below-fold content
4. **Optimize API Calls**: Use debouncing for search
5. **Caching**: Leverage browser cache with proper headers

---

## Troubleshooting

### "Module not found" errors

Check path aliases in `jsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### API connection refused

1. Check backend is running on `http://localhost:5000`
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check CORS configuration in backend

### Components not updating

1. Ensure 'use client' directive is present
2. Check state management setup
3. Verify useEffect dependencies

### Styling not applying

1. Check Tailwind classes are spelled correctly
2. Rebuild with `npm run dev`
3. Clear `.next` cache: `rm -rf .next`

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [Axios](https://axios-http.com/docs/intro)
- [React Hooks](https://react.dev/reference/react/hooks)

---

## Support

For issues or questions:
1. Check this guide first
2. Review backend API documentation
3. Check browser console for errors
4. View network requests in DevTools
