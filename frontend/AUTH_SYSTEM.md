# Authentication System Documentation

## Overview

A complete, production-ready authentication system for the Pharmacy Inventory Management System using Next.js App Router.

## File Structure

```
src/
├── app/
│   ├── login/
│   │   └── page.jsx          # Login page
│   └── register/
│       └── page.jsx          # Registration page
├── components/
│   └── Auth/
│       ├── AuthForm.jsx       # Reusable auth form component
│       ├── InputField.jsx     # Controlled input field
│       ├── Button.jsx         # Action button
│       └── index.jsx          # Exports
├── services/
│   └── authService.js         # API calls (already created)
├── store/
│   └── authStore.js           # Zustand auth store (already created)
├── hooks/
│   └── useAuthInit.js         # Auth initialization hook
└── utils/
    └── withAuth.js            # Route protection HOCs
```

## Components

### AuthForm
Main authentication form component with built-in validation and error handling.

```javascript
<AuthForm
  title="Login"
  submitButtonText="Sign In"
  onSubmit={handleLogin}
  isLoading={isLoading}
  errors={errors}
  mode="login"  // or "register"
/>
```

**Props:**
- `title` (string) - Form heading
- `submitButtonText` (string) - Button text
- `onSubmit` (function) - Form submission handler
- `isLoading` (boolean) - Loading state
- `errors` (object) - Server-side validation errors
- `mode` (string) - "login" or "register"

**Features:**
- Email and password validation
- Confirm password field (in register mode)
- Client-side validation
- Display server errors
- Links to switch between login/register
- Demo credentials display (login mode)

### InputField
Controlled input component with validation.

```javascript
<InputField
  label="Email Address"
  name="email"
  type="email"
  value={email}
  onChange={handleChange}
  error={errorMessage}
  placeholder="you@example.com"
  required
/>
```

**Props:**
- `label` (string) - Input label
- `name` (string) - Input name
- `type` (string) - HTML input type
- `value` (string) - Input value
- `onChange` (function) - Change handler
- `error` (string) - Error message
- `placeholder` (string) - Input placeholder
- `required` (boolean) - Required field indicator

### Button
Flexible button component with variants and loading state.

```javascript
<Button
  type="submit"
  variant="primary"
  size="md"
  isLoading={loading}
  disabled={disabled}
  onClick={handleClick}
>
  Click Me
</Button>
```

**Props:**
- `type` (string) - Button type ("button", "submit", "reset")
- `variant` (string) - "primary", "secondary", "outline"
- `size` (string) - "sm", "md", "lg"
- `isLoading` (boolean) - Show loading state
- `disabled` (boolean) - Disable button
- `onClick` (function) - Click handler
- `className` (string) - Additional classes

## Pages

### Login Page (`/login`)

```javascript
'use client';
// Handles user login with JWT token storage
// Validates email and password
// Stores token in localStorage
// Redirects to /dashboard on success
```

**Features:**
- Form validation
- Error handling
- JWT token storage
- Automatic redirect to dashboard
- Zustand state update

### Register Page (`/register`)

```javascript
'use client';
// Handles user registration
// Password confirmation
// Automatic login after registration
// Redirects to /dashboard
```

**Features:**
- Email validation
- Password confirmation
- Create new account
- Auto-login after signup
- Redirects to dashboard

## Hooks

### useAuthInit
Initializes authentication on app load by checking for existing JWT token.

```javascript
'use client';

import { useAuthInit } from '@/hooks/useAuthInit';

export default function SomeComponent() {
  useAuthInit();
  // Component logic
}
```

## Utilities

### withAuth
Higher-order component to protect routes from unauthorized access.

```javascript
'use client';

import { withAuth } from '@/utils/withAuth';

const Dashboard = () => {
  return <div>Protected Content</div>;
};

export default withAuth(Dashboard);
```

**Behavior:**
- Redirects to `/login` if not authenticated
- Renders nothing while checking auth
- Allows access if authenticated

### withoutAuth
Redirects authenticated users away from auth pages.

```javascript
import { withoutAuth } from '@/utils/withAuth';

const Login = () => <AuthForm ... />;
export default withoutAuth(Login);
```

## Data Flow

### Login Flow
```
User Form Input
    ↓
AuthForm Component
    ↓
Client-side Validation
    ↓
authService.login(email, password)
    ↓
API Call (POST /auth/login)
    ↓
Backend Response (JWT Token)
    ↓
Store Token (localStorage)
    ↓
Set User (Zustand Store)
    ↓
Redirect to /dashboard
```

### Register Flow
```
User Form Input
    ↓
AuthForm Component
    ↓
Password Confirmation Check
    ↓
authService.register(email, password)
    ↓
API Call (POST /auth/register)
    ↓
Backend Response (JWT Token)
    ↓
Store Token (localStorage)
    ↓
Set User (Zustand Store)
    ↓
Redirect to /dashboard
```

## Token Management

### Storing Token
```javascript
// In login/register pages
authService.setToken(response.token);
```

### Retrieving Token
```javascript
const token = authService.getToken();
```

### Automatic Injection
Token is automatically injected in all API requests via Axios interceptor:

```javascript
// In apiClient.js
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Clearing Token
```javascript
// On logout
authService.setToken(null);
```

## Validation

### Client-side Validation
- Email format validation
- Password length (minimum 6 characters)
- Password confirmation matching
- Required field validation

### Server-side Validation
- Email uniqueness (registration)
- Credentials validation (login)
- Data type validation

## Error Handling

### Form Errors
```javascript
const [validationErrors, setValidationErrors] = useState({});

// Display field-specific errors
{validationErrors.email && <span>{validationErrors.email}</span>}
```

### Server Errors
```javascript
const [errors, setErrors] = useState({});

// Display general errors
{errors.general && <div>{errors.general}</div>}
```

## Security Features

1. **JWT Token Storage** - Secure token management in localStorage
2. **XSS Prevention** - React escapes HTML by default
3. **Validation** - Client and server-side validation
4. **HTTPS** - Recommended for production
5. **Axios Interceptor** - Auto token injection and 401 handling

## Styling

### Colors
- Primary: Blue (`#2563eb`)
- Background: Gradient (blue to indigo)
- Borders: Gray (`#d1d5db`)
- Errors: Red (`#ef4444`)

### Layout
- Centered card design
- Responsive padding
- Maximum width: 448px (md)
- Mobile-friendly

### States
- Focus: Ring focus
- Error: Red border and text
- Loading: Disabled button with "Loading..." text
- Hover: Darker background color

## Usage Example

### Complete Login Page
```javascript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/Auth/AuthForm';
import { authService } from '@/services/authService';
import useAuthStore from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = async (formData) => {
    setIsLoading(true);
    try {
      const response = await authService.login(
        formData.email,
        formData.password
      );
      authService.setToken(response.token);
      setUser(response.user);
      router.push('/dashboard');
    } catch (err) {
      setErrors({ general: err.response?.data?.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Login"
      submitButtonText="Sign In"
      onSubmit={handleLogin}
      isLoading={isLoading}
      errors={errors}
      mode="login"
    />
  );
}
```

## Testing Checklist

- [ ] Email validation works
- [ ] Password validation works
- [ ] Form prevents submission with errors
- [ ] Loading state shows during submission
- [ ] Success redirects to dashboard
- [ ] Error message displays on failure
- [ ] Login/Register links work
- [ ] Token is stored in localStorage
- [ ] Token is included in API requests
- [ ] Invalid token clears auth state
- [ ] Responsive design works on mobile

## Common Issues

### Token not persisting
- Check localStorage is enabled
- Verify `authService.setToken()` is called
- Check Axios interceptor is configured

### Redirect not working
- Ensure router is from `next/navigation`
- Use `router.push()` for client-side navigation
- Check auth store is updated before redirect

### Validation not showing
- Check `validationErrors` state is set
- Verify InputField receives error prop
- Check error messages are not empty

## Next Steps

1. Test login/register on development server
2. Verify API endpoints match backend
3. Implement logout functionality
4. Add remember me functionality
5. Implement password reset
6. Add two-factor authentication
7. Set up session refresh (token expiry)
