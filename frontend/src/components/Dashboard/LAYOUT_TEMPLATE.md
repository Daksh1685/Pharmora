# Dashboard Page Layout Template

All pages should follow this consistent layout structure and styling:

## Page Structure Template

```jsx
'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import apiClient from '@/utils/apiClient';
import SearchResults from '@/components/Dashboard/SearchResults';

export default function PageName() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/endpoint');
        setData(response.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-96 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Page Title</h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Page description
          </p>
        </div>
        {/* Optional: Add button if needed */}
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
          <IconPlus size={20} />
          Add Item
        </button>
      </div>

      {/* Search Results */}
      <SearchResults />

      {/* Main Content Card */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Content Section Title</h2>
        
        <div className="bg-white rounded-2xl shadow-xl border border-blue-200/50 p-6 sm:p-8 lg:p-10">
          {/* Page Content Here */}
          {data.length > 0 ? (
            // Render data
            <div>Content goes here</div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600">No data found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Key Styling Classes

### Main Container
- `space-y-8` - Spacing between major sections

### Header Section
- `flex flex-col sm:flex-row` - Responsive header layout
- `justify-between items-start sm:items-center` - Alignment
- `gap-4` - Gap between header elements

### Title
- `text-3xl sm:text-4xl font-bold text-slate-900` - Main title

### Subtitle
- `text-slate-600 text-sm sm:text-base mt-1` - Description text

### Action Buttons
- `px-4 py-2.5` - Padding
- `bg-blue-600 text-white` - Colors
- `rounded-lg` - Border radius
- `hover:bg-blue-700` - Hover state
- `shadow-md hover:shadow-lg` - Shadow effects
- `transition-colors` - Smooth transitions

### Content Card
- `bg-white` - White background
- `rounded-2xl` - Large border radius
- `shadow-xl` - Strong shadow
- `border border-blue-200/50` - Blue border with transparency
- `p-6 sm:p-8 lg:p-10` - Responsive padding

## Important Notes

1. **Always include SearchResults component** - Below main header, before content card
2. **Use consistent spacing** - `space-y-8` for major sections
3. **Responsive design** - Use sm: breakpoints for mobile/tablet/desktop
4. **Color scheme** - Blue primary (#3b82f6), slate grays for text
5. **Cards** - Always use `bg-white rounded-2xl shadow-xl border border-blue-200/50` for content containers
6. **Typography** - Bold titles with consistent sizing
7. **Empty states** - Show centered message when no data available

## Pages Using This Template

✅ Dashboard - Main dashboard with stats
✅ Medicines - Medicine inventory management
✅ Categories - Category management
✅ Sales - Sales tracking
✅ Purchases/Orders - Order management
✅ Customers - Customer management
✅ AI Chat - AI assistant interface
✅ Notifications - Notification center
✅ Payments - Payment transactions
✅ Reports - Analytics and reports
