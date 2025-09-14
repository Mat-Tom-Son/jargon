# Translation Layer Admin Frontend

A sophisticated, enterprise-grade admin interface for managing semantic data translation layers. Built with modern React patterns and designed for data stewards, analysts, and IT administrators.

## 🎯 **What This Interface Manages**

This frontend provides a complete administrative experience for:

- **Semantic Debt Assessment**: Real-time measurement of terminology clarity costs
- **Governance Workflows**: Term approval processes and compliance tracking
- **Data Source Management**: Configuration of Salesforce, PostgreSQL, REST APIs
- **Business Term Definition**: Semantic contracts with examples and mappings
- **Query Testing**: Interactive testing with full lineage visualization
- **System Monitoring**: Health checks and performance metrics

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 14    │    │   API Routes    │    │   Translation   │
│   Frontend      │◄──►│   (Client)      │◄──►│   Layer API     │
│                 │    │                 │    │                 │
│ • React 18      │    │ • RESTful       │    │ • Express       │
│ • TypeScript    │    │ • Real-time     │    │ • Semantic      │
│ • Tailwind CSS  │    │ • Error Handling│    │   Engine        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 **Project Structure**

```
frontend/
├── app/                    # Next.js 14 app router
│   ├── globals.css        # Global styles & Tailwind
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Dashboard overview
│   ├── semantic-debt/     # Debt assessment page
│   │   └── page.tsx
│   ├── governance/        # Term governance page
│   │   └── page.tsx
│   ├── sources/           # Data source management
│   │   ├── page.tsx
│   │   └── [id]/         # Dynamic source details
│   ├── terms/             # Business term management
│   │   └── page.tsx
│   ├── mappings/          # Mapping rule configuration
│   │   └── page.tsx
│   └── test/              # Query testing interface
│       └── page.tsx
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui base components
│   ├── dashboard-overview.tsx    # Main dashboard
│   ├── header.tsx               # Navigation header
│   ├── sidebar.tsx              # Navigation sidebar
│   ├── business-terms/          # Term management
│   ├── data-sources/            # Source management
│   ├── mapping-rules/           # Mapping configuration
│   └── query-testing/           # Testing interface
├── lib/                 # Utility functions
│   └── utils.ts         # cn() helper, formatters
├── hooks/               # Custom React hooks
├── styles/              # Additional stylesheets
└── public/              # Static assets
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- npm, yarn, or pnpm
- Translation Layer API running (see main README)

### **Installation**
```bash
cd frontend
npm install
```

### **Development**
```bash
npm run dev
```

### **Production Build**
```bash
npm run build
npm start
```

### **Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_ENV=development
# Optional: admin auth for config update (matches gateway ADMIN_API_TOKEN)
# NEXT_PUBLIC_ADMIN_API_TOKEN=your_admin_token
```

## 🎨 **Design System**

### **UI Framework**
- **shadcn/ui**: Professional component library
- **Tailwind CSS v4**: Utility-first styling
- **Radix UI**: Accessible, unstyled primitives
- **Lucide Icons**: Consistent iconography

### **Design Principles**
- **Professional**: Enterprise-grade appearance
- **Responsive**: Works on all screen sizes
- **Accessible**: WCAG compliant
- **Consistent**: Unified design language
- **Performant**: Optimized for speed

### **Color Palette**
- **Primary**: Blue (#3b82f6) - Actions, links, focus
- **Success**: Green (#10b981) - Positive states, approvals
- **Warning**: Yellow (#f59e0b) - Attention, pending states
- **Error**: Red (#ef4444) - Errors, rejections
- **Neutral**: Gray (#6b7280) - Secondary text, borders

## 📱 **Key Pages & Features**

### **Dashboard Overview (`/`)**
The central hub showing:
- **Semantic Debt Score**: Real-time health metrics
- **System Status**: Connected data sources and health
- **Recent Activity**: Latest mappings and term updates
- **Quick Actions**: One-click access to all features

### **Semantic Debt Assessment (`/semantic-debt`)**
Comprehensive debt analysis:
- **Overall Health Score**: 72% with detailed breakdowns
- **ROI Calculator**: $45K monthly waste identification
- **Priority Recommendations**: Actionable improvement steps
- **Progress Tracking**: Visual metrics with trend indicators

### **Governance Dashboard (`/governance`)**
Term lifecycle management:
- **Approval Workflows**: Draft → Review → Approved
- **Compliance Metrics**: Review completion tracking
- **Audit Trails**: Complete change history
- **Stakeholder Management**: Data steward assignments

### **Data Source Management (`/sources`)**
Configure and monitor data sources:
- **Multi-Source Support**: Salesforce, PostgreSQL, REST APIs
- **Health Monitoring**: Connection status and performance
- **Schema Discovery**: Automatic field detection
- **Security Configuration**: Credential management

### **Business Term Definition (`/terms`)**
Semantic contract management:
- **Term Creation**: Define business concepts with examples
- **Validation Rules**: Ensure term quality and completeness
- **Ownership Assignment**: Data steward responsibility
- **Version Control**: Track term evolution

### **Mapping Rules (`/mappings`)**
Connect terms to data sources:
- **Visual Mapping**: Drag-and-drop field connections
- **Validation**: Ensure mapping completeness and correctness
- **Testing**: Preview mapping results
- **Governance**: Approval workflows for changes

### **Query Testing (`/test`)**
Interactive testing environment:
- **Natural Language Input**: "Show me active customers"
- **Query Builder**: Visual query construction
- **Lineage Visualization**: Complete data provenance
- **Performance Metrics**: Query execution statistics

## 🔧 **Component Architecture**

### **Layout Components**
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <Sidebar />
          <div className="flex-1">
            <Header />
            <main>{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### **Page Components**
```tsx
// app/semantic-debt/page.tsx
'use client'

export default function SemanticDebtDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/semantic-debt/metrics')
      .then(res => res.json())
      .then(setMetrics)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Dashboard content */}
    </div>
  )
}
```

### **Reusable Components**
```tsx
// components/ui/card.tsx
export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  )
}
```

## 🔗 **API Integration**

### **Data Fetching Patterns**
```typescript
// hooks/useApi.ts
export function useApi(endpoint: string) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [endpoint])

  return { data, loading, error }
}
```

### **Real-time Updates**
```typescript
// hooks/useWebSocket.ts
export function useWebSocket(endpoint: string) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}${endpoint}`)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages(prev => [...prev, data])
    }

    return () => ws.close()
  }, [endpoint])

  return messages
}
```

## 🎯 **User Experience Features**

### **Loading States**
- Skeleton loaders for initial page loads
- Progressive loading for large datasets
- Optimistic updates for user actions

### **Error Handling**
- Graceful error boundaries
- User-friendly error messages
- Retry mechanisms for failed requests

### **Accessibility**
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

### **Performance**
- Code splitting by route
- Image optimization
- Bundle analysis and optimization
- Caching strategies

## 🧪 **Testing**

### **Component Testing**
```bash
# Run component tests
npm run test:components

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y
```

### **Testing Examples**
```typescript
// __tests__/dashboard-overview.test.tsx
import { render, screen } from '@testing-library/react'
import { DashboardOverview } from '@/components/dashboard-overview'

describe('DashboardOverview', () => {
  it('displays semantic debt score', () => {
    render(<DashboardOverview />)
    expect(screen.getByText('72%')).toBeInTheDocument()
  })

  it('shows data source status', () => {
    render(<DashboardOverview />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
```

## 🚀 **Deployment**

### **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Docker**
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

### **Static Export**
```bash
# For static hosting (Netlify, GitHub Pages)
npm run build
npm run export
```

## 🤝 **Contributing**

### **Development Workflow**
1. **Create feature branch**: `git checkout -b feature/new-feature`
2. **Follow component patterns**: Use existing UI components
3. **Add TypeScript types**: No `any` types in new code
4. **Include error handling**: Graceful failure states
5. **Test accessibility**: WCAG compliance
6. **Update documentation**: Component usage examples

### **Code Standards**
```typescript
// ✅ Good: Descriptive component names
export function SemanticDebtDashboard() { ... }

// ✅ Good: Proper TypeScript usage
interface Props {
  metrics: SemanticMetrics
  onRefresh: () => void
}

// ✅ Good: Consistent styling
<div className="flex items-center space-x-4 p-6">

// ❌ Bad: Generic names
export function Component() { ... }

// ❌ Bad: Missing types
function handleClick(data) { ... }

// ❌ Bad: Inline styles
<div style={{ padding: 24 }}>
```

### **Component Guidelines**
- **Single Responsibility**: One component, one job
- **Composition**: Build complex UIs from simple components
- **Props Interface**: Always define TypeScript interfaces
- **Default Props**: Provide sensible defaults
- **Documentation**: JSDoc comments for complex logic

## 📊 **Performance Monitoring**

### **Core Web Vitals**
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### **Bundle Analysis**
```bash
# Analyze bundle size
npm run build:analyze

# Check for unused dependencies
npm run depcheck
```

## 🎨 **Theming & Customization**

### **CSS Variables**
```css
/* styles/globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
  /* ... more variables */
}
```

### **Dark Mode Support**
```typescript
// components/theme-provider.tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      {children}
    </NextThemesProvider>
  )
}
```

---

**This frontend makes semantic debt management accessible, actionable, and enterprise-ready.** 🚀
