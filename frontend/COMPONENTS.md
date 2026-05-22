# Component Development Guide

## Component Patterns & Examples

### 1. Basic Functional Component

```javascript
'use client';

const MyComponent = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Hello World</h1>
    </div>
  );
};

export default MyComponent;
```

### 2. Component with Props

```javascript
'use client';

const Card = ({ title, subtitle, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      {children}
    </div>
  );
};

export default Card;
```

**Usage:**
```javascript
<Card title="Summary" subtitle="Stats overview">
  <p>Content here</p>
</Card>
```

### 3. Component with State

```javascript
'use client';

import { useState } from 'react';
import Button from './Button';

const Counter = ({ initialValue = 0 }) => {
  const [count, setCount] = useState(initialValue);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{count}</h2>
      <div className="flex gap-2">
        <Button onClick={() => setCount(c => c - 1)}>Decrease</Button>
        <Button onClick={() => setCount(c => c + 1)}>Increase</Button>
      </div>
    </div>
  );
};

export default Counter;
```

### 4. Component with Effects

```javascript
'use client';

import { useState, useEffect } from 'react';

const DataFetcher = ({ url }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(url);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchData();
    }
  }, [url]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  
  return <div>{JSON.stringify(data)}</div>;
};

export default DataFetcher;
```

### 5. Component with Form Handling

```javascript
'use client';

import { useState } from 'react';
import Input from './Input';
import Button from './Button';

const LoginForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />
      
      <Input
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required
      />

      <Button variant="primary" type="submit" className="w-full">
        Sign In
      </Button>
    </form>
  );
};

export default LoginForm;
```

### 6. Component with Conditional Rendering

```javascript
'use client';

const MedicineStatus = ({ quantity, threshold = 10 }) => {
  let status, color;

  if (quantity === 0) {
    status = 'Out of Stock';
    color = 'text-red-600';
  } else if (quantity < threshold) {
    status = 'Low Stock';
    color = 'text-yellow-600';
  } else {
    status = 'In Stock';
    color = 'text-green-600';
  }

  return <span className={`font-semibold ${color}`}>{status}</span>;
};

export default MedicineStatus;
```

### 7. Component with Lists

```javascript
'use client';

import Table from './Table';
import Button from './Button';
import Badge from './Badge';

const SalesList = ({ sales, onDelete }) => {
  const columns = [
    { label: 'Date', key: 'saleDate' },
    { label: 'Medicine', key: 'medicine', render: (_, row) => row.medicine?.name },
    { label: 'Quantity', key: 'quantity' },
    { 
      label: 'Total', 
      key: 'total',
      render: (value) => `$${value.toFixed(2)}`
    },
    {
      label: 'Status',
      key: 'status',
      render: (value) => <Badge variant={value === 'completed' ? 'success' : 'gray'}>{value}</Badge>
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <Button 
          variant="danger" 
          size="sm"
          onClick={() => onDelete(row._id)}
        >
          Delete
        </Button>
      )
    }
  ];

  return <Table columns={columns} data={sales} />;
};

export default SalesList;
```

### 8. Component using Zustand Store

```javascript
'use client';

import { useEffect } from 'react';
import useMedicineStore from '@/store/medicineStore';
import { medicineService } from '@/services/medicineService';

const MedicineInventory = () => {
  const medicines = useMedicineStore((state) => state.medicines);
  const setMedicines = useMedicineStore((state) => state.setMedicines);
  const updateMedicine = useMedicineStore((state) => state.updateMedicine);

  useEffect(() => {
    const fetchMedicines = async () => {
      const data = await medicineService.getAll();
      setMedicines(data);
    };
    fetchMedicines();
  }, [setMedicines]);

  const handleStockUpdate = (medicineId, newQuantity) => {
    updateMedicine(medicineId, { quantity: newQuantity });
  };

  return (
    <div>
      {medicines.map(medicine => (
        <div key={medicine._id} className="flex justify-between p-4 border-b">
          <span>{medicine.name}</span>
          <span>{medicine.quantity} units</span>
          <button onClick={() => handleStockUpdate(medicine._id, 100)}>
            Update
          </button>
        </div>
      ))}
    </div>
  );
};

export default MedicineInventory;
```

### 9. Component using Custom Hook

```javascript
'use client';

import { useAsync } from '@/hooks/useAsync';
import { medicineService } from '@/services/medicineService';
import Card from './Card';

const MedicineDetail = ({ medicineId }) => {
  const { execute, isLoading, error, data } = useAsync(
    () => medicineService.getById(medicineId),
    false // Don't execute immediately
  );

  React.useEffect(() => {
    execute();
  }, [medicineId, execute]);

  if (isLoading) return <Card>Loading...</Card>;
  if (error) return <Card className="text-red-600">{error}</Card>;
  if (!data) return null;

  return (
    <Card title={data.name}>
      <p>Manufacturer: {data.manufacturer}</p>
      <p>Price: ${data.price}</p>
      <p>Stock: {data.quantity}</p>
    </Card>
  );
};

export default MedicineDetail;
```

### 10. Component with Modal Dialog

```javascript
'use client';

import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import DeleteForm from './DeleteForm';

const MedicineCard = ({ medicine, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirmDelete = async () => {
    await onDelete(medicine._id);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="p-4 border rounded-lg">
        <h3 className="font-bold">{medicine.name}</h3>
        <p className="text-gray-600">{medicine.manufacturer}</p>
        <Button 
          variant="danger"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="mt-4"
        >
          Delete
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Delete Medicine"
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
      >
        <p>Are you sure you want to delete <strong>{medicine.name}</strong>?</p>
        <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
      </Modal>
    </>
  );
};

export default MedicineCard;
```

### 11. Component with Search/Filter

```javascript
'use client';

import { useState, useEffect } from 'react';
import Input from './Input';
import { useDebounce } from '@/hooks/useDebounce';
import { useNotification } from '@/hooks/useNotification';
import Select from './Select';

const AdvancedSearch = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', sortBy: 'name' });
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    onSearch({ search: debouncedSearch, ...filters });
  }, [debouncedSearch, filters, onSearch]);

  return (
    <form className="space-y-4" onSubmit={e => e.preventDefault()}>
      <Input
        placeholder="Search medicines..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <Select
        label="Status"
        value={filters.status}
        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
        options={[
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]}
      />

      <Select
        label="Sort By"
        value={filters.sortBy}
        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
        options={[
          { label: 'Name', value: 'name' },
          { label: 'Price', value: 'price' },
          { label: 'Quantity', value: 'quantity' },
        ]}
      />
    </form>
  );
};

export default AdvancedSearch;
```

### 12. Higher-Order Component (HOC) Pattern

```javascript
'use client';

import useAuthStore from '@/store/authStore';
import { useRouter } from 'next/navigation';

export const withAuth = (Component) => {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
      router.push('/login');
      return null;
    }

    return <Component {...props} />;
  };
};

// Usage
const Dashboard = () => <div>Dashboard Content</div>;
export default withAuth(Dashboard);
```

## Best Practices

### ✅ DO

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript-ready prop documentation
- Memoize callbacks with useCallback
- Extract magic numbers to constants
- Use proper naming conventions
- Add error boundaries
- Handle loading states
- Validate form inputs

### ❌ DON'T

- Use class components
- Create deeply nested JSX
- Put all logic in one component
- Ignore accessibility (a11y)
- Use inline styles (Tailwind instead)
- Mutate state directly
- Forget cleanup in useEffect
- Create large dependency arrays
- Use index as key in lists

## Component Checklist

When creating a new component, ensure:

- [ ] Has descriptive name (noun-based for containers, verb-based for actions)
- [ ] Properly exported as default
- [ ] Has `'use client'` if using hooks/interactivity
- [ ] Props documented or self-explanatory
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design applied
- [ ] Accessibility considered (labels, alt text, etc.)
- [ ] Reusable where possible
- [ ] No prop drilling (use store for shared state)
