# Frontend Architecture Documentation

## Overview

This is a **scalable, production-ready** pharmacy inventory management frontend built with modern web technologies. The architecture follows industry best practices for maintainability, testability, and performance.

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15.0 |
| UI Rendering | React | 19.0 |
| Styling | Tailwind CSS | 3.4 |
| State Management | Zustand | 4.4 |
| HTTP Client | Axios | 1.6 |
| Icons | Tabler Icons | 2.44 |
| Language | JavaScript (ES2021+) | - |

## Architecture Layers

### 1. **Presentation Layer** (`src/app/`, `src/components/`)

Responsible for UI rendering and user interaction.

```
Presentation Layer
├── Pages (App Router)
│   ├── Public Routes (login, home)
│   └── Protected Routes (dashboard/*)
├── Layout Components
│   ├── Sidebar
│   ├── Topbar
│   └── DashboardLayout
└── Feature Components
    ├── Medicine (CRUD)
    ├── Purchase (CRUD)
    ├── Sale (CRUD)
    ├── Reports (Read)
    └── Notifications (Read/Update)
```

**Key Principles:**
- Functional components with hooks
- Separation of concerns (one component = one responsibility)
- Reusable, composable components
- Client-side rendering with `'use client'` directive

### 2. **State Management Layer** (`src/store/`)

Manages application state using Zustand.

```
State Stores
├── authStore - User authentication state
├── medicineStore - Medicine list state
├── notificationStore - Notification state
└── uiStore - UI state (sidebar, theme)
```

**Why Zustand?**
- Lightweight (~2KB)
- Zero-dependency
- Simple API
- Excellent performance
- Perfect for this app's state needs

**Store Pattern:**
```javascript
const useStore = create((set) => ({
  // State
  data: [],
  
  // Actions
  setData: (data) => set({ data }),
  addItem: (item) => set((state) => ({
    data: [...state.data, item]
  })),
}));
```

### 3. **API Service Layer** (`src/services/`)

Handles all backend communication.

```
Services
├── authService - Login, register, auth
├── medicineService - Medicine CRUD
├── batchService - Batch CRUD
├── purchaseService - Purchase CRUD
├── saleService - Sale CRUD
├── reportService - Analytics
└── notificationService - Alerts
```

**Features:**
- Centralized API calls
- Consistent error handling
- Request-response transformation
- JWT token management

**Service Pattern:**
```javascript
export const serviceAPI = {
  getAll: async (params) => apiClient.get(endpoint, { params }),
  getById: async (id) => apiClient.get(`${endpoint}/${id}`),
  create: async (data) => apiClient.post(endpoint, data),
  update: async (id, data) => apiClient.put(`${endpoint}/${id}`, data),
  delete: async (id) => apiClient.delete(`${endpoint}/${id}`),
};
```

### 4. **Utilities & Helpers** (`src/utils/`)

Reusable functions and constants.

```
Utilities
├── apiClient.js - Axios instance with interceptors
├── errorHandler.js - Error handling functions
├── helpers.js - Formatting and utility functions
└── constants.js - Routes and API endpoints
```

### 5. **Custom Hooks** (`src/hooks/`)

Encapsulate stateful logic.

```
Hooks
├── useAsync - Async operations with loading
├── useNotification - Toast notifications
├── useLocalStorage - Browser storage
└── useDebounce - Debounced values
```

**Hook Pattern:**
```javascript
export const useCustom = () => {
  const [state, setState] = useState();
  
  const action = useCallback(async () => {
    // Logic
  }, [dependencies]);
  
  return { state, action };
};
```

## Data Flow

### Creating an Item (Medicines Example)

```
User Input Form
    ↓
Form Validation
    ↓
API Call (medicineService.create)
    ↓
Axios Interceptor (Add JWT Token)
    ↓
Backend API
    ↓
Error Handling / Success Response
    ↓
Update Zustand Store (useMedicineStore)
    ↓
UI Re-renders (Component subscribes to store)
    ↓
Toast Notification (useNotification)
```

### Code Example:

```javascript
// Component
const [formData, setFormData] = useState(initialData);
const { success, error } = useNotification();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await medicineService.create(formData);
    success('Medicine created!');
    // Store update happens in service response handler
  } catch (err) {
    error('Failed to create medicine');
  }
};
```

## Authentication Flow

```
Login Page
    ↓
User Enter Credentials
    ↓
authService.login(email, password)
    ↓
Backend validates → Returns JWT Token
    ↓
Store token in localStorage
    ↓
Set user in useAuthStore
    ↓
Redirect to Dashboard
    ↓
All API requests include JWT in header (via Axios interceptor)
    ↓
If 401: Clear token, redirect to login
```

## Page Routing Structure

```
/ (Home - Landing Page)
├── /login (Authentication)
└── /dashboard (Protected Routes - with layout)
    ├── / (Dashboard home)
    ├── /medicines
    ├── /purchases
    ├── /sales
    ├── /batches
    ├── /reports
    ├── /notifications
    ├── /profile
    └── /settings
```

**Route Protection Pattern:**
```javascript
'use client';

import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';

export default function ProtectedPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  if (!isAuthenticated) return null;
  
  return <YourContent />;
}
```

## Styling Strategy

### Tailwind CSS Architecture

1. **Global Styles** (`src/app/globals.css`)
   - Base element styling
   - Scrollbar customization

2. **Component Styles** (Inline with className)
   - Utility-first approach
   - No CSS files for components
   - Uses Tailwind variants

3. **Responsive Design**
   - Mobile-first approach
   - Breakpoints: `sm:`, `md:`, `lg:`, `xl:`

4. **Design Tokens**
   - Primary color palette in `tailwind.config.js`
   - Consistent spacing scale
   - Reusable component classes

### Color System

```javascript
// Primary palette (sky blue)
primary: {
  50: lightest,
  500: main color,
  900: darkest
}

// Status colors
success: green
warning: yellow
danger: red
```

## Performance Optimizations

### 1. Code Splitting
```javascript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

### 2. Lazy Loading
- Images use `next/image`
- Components loaded on-demand
- API data paginated

### 3. Caching
- Browser cache headers
- Service layer response caching
- Zustand store persistence

### 4. Debouncing
```javascript
// Search input debounced
const debouncedSearch = useDebounce(searchQuery, 300);
```

### 5. Memoization
```javascript
// Prevent unnecessary re-renders
export const MemoComponent = React.memo(Component);
```

## Error Handling Strategy

### API Errors
```javascript
try {
  await apiService.getAll();
} catch (err) {
  // Check error type
  if (isUnauthorized(err)) {
    // Redirect to login
  } else if (isValidationError(err)) {
    // Show validation errors
  } else {
    // Generic error message
  }
}
```

### User Feedback
```javascript
// Toast notifications
useNotification().success('Action successful!');
useNotification().error('Operation failed');

// Form errors
setErrors({ fieldName: 'Error message' });
```

## Security Considerations

1. **JWT Tokens**
   - Stored in localStorage
   - Included in all requests via Axios interceptor
   - Auto-removed on 401 response

2. **XSS Prevention**
   - React escapes HTML by default
   - Sanitize user input

3. **CSRF Protection**
   - Backend handles CSRF tokens
   - All requests include credentials

4. **Data Validation**
   - Client-side validation (UX)
   - Server-side validation (Security)

## Scalability Patterns

### Adding a New Feature

1. **Create Service** (`src/services/featureService.js`)
   ```javascript
   export const featureService = {
     getAll: async () => apiClient.get('/features'),
     // ... other methods
   };
   ```

2. **Create Store** (`src/store/featureStore.js`)
   ```javascript
   const useFeatureStore = create((set) => ({
     items: [],
     setItems: (items) => set({ items }),
     // ... actions
   }));
   ```

3. **Create Components** (`src/components/Feature/`)
   - FeatureList.js
   - FeatureForm.js

4. **Create Pages** (`src/app/(dashboard)/dashboard/features/`)
   - page.js (main page)

### Component Composition Pattern

```javascript
// Page Component (orchestration)
<Page>
  <Header />
  <SearchBar />
  <FeatureList
    data={items}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />
  <Modal>
    <FeatureForm onSubmit={handleSubmit} />
  </Modal>
</Page>
```

## Testing Strategy

### Unit Testing
```javascript
// Test individual functions
describe('helpers.js', () => {
  test('formatCurrency works', () => {
    expect(formatCurrency(100)).toBe('$100.00');
  });
});
```

### Component Testing
```javascript
// Test React components
describe('Button Component', () => {
  test('renders with correct text', () => {
    const { getByText } = render(<Button>Click</Button>);
    expect(getByText('Click')).toBeInTheDocument();
  });
});
```

### Integration Testing
```javascript
// Test complete flows
describe('Medicine CRUD', () => {
  test('can create a medicine', async () => {
    // Create → Verify in list
  });
});
```

## Monitoring & Analytics

### Error Tracking
```javascript
// Can integrate Sentry or similar
if (error) {
  console.error('API Error:', error);
  // sendToErrorTracking(error);
}
```

### Performance Monitoring
```javascript
// Can integrate with analytics service
performance.measure('page-load');
```

## Deployment Architecture

```
GitHub Repository
    ↓
Vercel / Netlify (CD/CD)
    ↓
Build: npm run build
    ↓
Environment Variables Set
    ↓
Deploy to Production
    ↓
Edge CDN Distribution
```

## Future Improvements

1. **TypeScript Migration** - Add type safety
2. **Testing Suite** - Jest + React Testing Library
3. **PWA Features** - Offline support, push notifications
4. **Advanced Analytics** - Charts, dashboards
5. **Real-time Updates** - WebSocket integration
6. **API Caching Strategy** - SWR or React Query
7. **Internationalization** - Multi-language support
8. **Dark Mode** - Theme switching

## Conclusion

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Easy to test and maintain
- ✅ Scalable for new features
- ✅ Performance optimized
- ✅ Security best practices
- ✅ Developer experience focused

The modular approach allows developers to work independently on features without affecting others.
