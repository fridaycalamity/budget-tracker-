# Budget Tracker

A modern, responsive personal budget tracking application built with React, TypeScript, and Tailwind CSS. Track your income and expenses, visualize spending patterns, and manage your finances with ease.

![Budget Tracker](https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=Budget+Tracker+Dashboard)

## ✨ Features

- 📊 **Financial Dashboard** - View income, expenses, and balance at a glance
- 💰 **Transaction Management** - Add, view, and delete income/expense transactions
- 📈 **Visual Analytics** - Interactive spending charts by category using Chart.js
- 🔍 **Advanced Filtering** - Filter transactions by type, category, and date range
- 📋 **Smart Sorting** - Sort transactions by date or amount in ascending/descending order
- 🎯 **Budget Goals** - Set monthly spending limits with progress tracking (optional)
- 🌓 **Theme Switching** - Toggle between light and dark modes with persistence
- 💾 **Local Storage** - Automatic data persistence in browser storage
- 📱 **Fully Responsive** - Optimized for mobile, tablet, and desktop devices
- ♿ **Accessible** - WCAG 2.1 AA compliant with ARIA labels and keyboard navigation
- 🇵🇭 **Philippine Peso** - Currency formatting with ₱ symbol and proper separators
- 🎨 **Modern UI** - Clean design with smooth animations and transitions
- 🚀 **Fast Performance** - Optimized React rendering with Context API state management

## 🛠️ Tech Stack

- **Framework**: React 19.2
- **Language**: TypeScript 5.9 (strict mode)
- **Build Tool**: Vite 7.2
- **Styling**: Tailwind CSS v4.1
- **Routing**: React Router DOM v7.13
- **Charts**: Chart.js 4.5 with react-chartjs-2
- **Date Handling**: date-fns 4.1
- **Testing**: Vitest 4.0 + Testing Library
- **Code Quality**: ESLint 9 + Prettier 3

## 📁 Project Structure

```
budget-tracker/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── AddTransactionButton.tsx    # Floating action button
│   │   ├── FilterBar.tsx               # Transaction filtering controls
│   │   ├── Header.tsx                  # App header with navigation
│   │   ├── SortControls.tsx            # Transaction sorting controls
│   │   ├── SpendingChart.tsx           # Category spending visualization
│   │   ├── SummaryCard.tsx             # Financial summary cards
│   │   ├── ThemeToggle.tsx             # Light/dark mode toggle
│   │   ├── Toast.tsx                   # Notification toast component
│   │   ├── ToastContainer.tsx          # Toast notification manager
│   │   ├── TransactionForm.tsx         # Add/edit transaction form
│   │   ├── TransactionModal.tsx        # Modal for transaction form
│   │   ├── TransactionRow.tsx          # Single transaction display
│   │   └── index.ts                    # Component exports
│   ├── contexts/            # React Context providers
│   │   ├── BudgetContext.tsx           # Transaction & budget state
│   │   ├── ThemeContext.tsx            # Theme state management
│   │   ├── ToastContext.tsx            # Toast notification state
│   │   └── index.ts                    # Context exports
│   ├── pages/               # Page components (routes)
│   │   ├── Dashboard.tsx               # Main dashboard view
│   │   ├── TransactionList.tsx         # Full transaction list
│   │   ├── BudgetGoals.tsx             # Budget goal management
│   │   ├── Settings.tsx                # App settings & data management
│   │   └── index.ts                    # Page exports
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts                    # All type definitions
│   ├── utils/               # Utility functions
│   │   ├── index.ts                    # Core utilities (formatting, calculations, validation)
│   │   ├── storage.ts                  # localStorage wrapper
│   │   └── seedData.ts                 # Sample data generator
│   ├── demo/                # Component demo pages
│   ├── test/                # Test utilities and setup
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles with Tailwind
├── public/                  # Static assets
├── dist/                    # Production build output
├── .kiro/                   # Kiro spec files
│   └── specs/budget-tracker/
│       ├── requirements.md  # Detailed requirements
│       ├── design.md        # Design document
│       └── tasks.md         # Implementation tasks
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── eslint.config.js         # ESLint configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher (comes with Node.js)

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd budget-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

The application will load with sample seed data on first visit. Your data is automatically saved to browser localStorage.

### Building for Production

1. **Create a production build:**
   ```bash
   npm run build
   ```
   
   This compiles TypeScript and bundles the application into the `dist/` directory with optimizations:
   - Code minification and tree-shaking
   - Automatic code splitting for better caching
   - Asset optimization
   - Source maps for debugging

2. **Preview the production build locally:**
   ```bash
   npm run preview
   ```
   
   The preview server will start at `http://localhost:4173`

3. **Deploy the `dist/` folder** to your hosting service

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

#### Quick Deploy Options

**Vercel (Recommended):**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify init
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guides for Vercel, Netlify, GitHub Pages, and other platforms.

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot module replacement |
| `npm run build` | Build for production (TypeScript compilation + Vite build) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check if code is properly formatted |
| `npm run test` | Run tests in watch mode |
| `npm run test:ui` | Run tests with Vitest UI |

## 🎯 Usage Guide

### Adding Transactions

1. Click the **+** floating action button (bottom-right corner)
2. Fill in the transaction details:
   - **Description**: What the transaction is for (required)
   - **Amount**: Transaction amount in Philippine Peso (required, positive number)
   - **Type**: Income or Expense (required)
   - **Category**: Select from predefined categories (required)
   - **Date**: Transaction date (defaults to today)
3. Click **Add Transaction**
4. A success notification will appear

### Viewing Transactions

- **Dashboard**: Shows 10 most recent transactions with financial summary
- **Transactions Page**: View all transactions with filtering and sorting options

### Filtering Transactions

Use the filter bar to narrow down transactions:
- **Type**: All, Income, or Expense
- **Category**: Filter by specific category
- **Date Range**: Set start and end dates

### Sorting Transactions

Use the sort controls to order transactions:
- **Sort by**: Date or Amount
- **Direction**: Ascending (↑) or Descending (↓)

### Deleting Transactions

1. Click the **Delete** button on any transaction
2. Confirm the deletion in the dialog
3. The transaction will be removed and totals updated

### Setting Budget Goals

1. Navigate to **Budget Goals** page
2. Enter your monthly spending limit
3. View progress bar showing spending vs. limit
4. Warning appears when spending exceeds 80% of limit

### Clearing All Data

1. Navigate to **Settings** page
2. Click **Clear All Data**
3. Confirm the action
4. All transactions and settings will be reset

### Theme Switching

- Click the **theme toggle** button in the header
- Choose between light and dark modes
- Your preference is saved automatically

## ⚙️ Configuration

### TypeScript Configuration

The project uses strict TypeScript settings for maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

### Tailwind CSS Configuration

Custom theme extends Tailwind with project-specific colors:

- **Primary**: Blue palette for main UI elements
- **Income**: Green palette for income transactions
- **Expense**: Red palette for expense transactions
- **Dark Mode**: Class-based strategy (`dark:` prefix)

### ESLint & Prettier

Code quality is maintained through:
- **ESLint**: TypeScript and React best practices
- **Prettier**: Consistent code formatting
- **React Hooks**: Enforced rules for hooks usage
- **React Refresh**: Fast refresh during development

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui
```

Test files are co-located with components using `.test.tsx` suffix:
- Unit tests for utilities and components
- Integration tests for complex interactions
- Property-based tests for validation logic

## 📊 Data Models

### Transaction

```typescript
interface Transaction {
  id: string;                    // UUID v4
  description: string;           // 1-200 characters
  amount: number;                // Positive number, max 2 decimals
  type: 'income' | 'expense';
  category: TransactionCategory;
  date: string;                  // ISO 8601 date (YYYY-MM-DD)
  createdAt: string;             // ISO 8601 timestamp
}
```

### Categories

- Food
- Transport
- Bills
- Entertainment
- Salary
- Freelance
- Shopping
- Healthcare
- Education
- Other

### Budget Goal

```typescript
interface BudgetGoal {
  monthlyLimit: number;          // Positive number
  month: string;                 // Format: YYYY-MM
}
```

## 🔒 Data Storage

All data is stored locally in your browser using `localStorage`:

- **Transactions**: `budget_tracker_transactions`
- **Budget Goals**: `budget_tracker_budget_goal`
- **Theme Preference**: `budget_tracker_theme`

Data persists across browser sessions but is device-specific. No data is sent to external servers.

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 Requirements & Design

This application implements a comprehensive set of requirements:

- **Requirement 1**: Display Financial Summary
- **Requirement 2**: Add New Transactions
- **Requirement 3**: Display Transaction History
- **Requirement 4**: Delete Transactions
- **Requirement 5**: Filter and Sort Transactions
- **Requirement 6**: Budget Goals (Optional Feature)
- **Requirement 7**: Responsive Design and Accessibility
- **Requirement 8**: Theme Switching
- **Requirement 9**: Data Persistence
- **Requirement 10**: Data Management
- **Requirement 11**: Currency Formatting
- **Requirement 12**: User Experience Enhancements

For detailed requirements and design documentation, see:
- `.kiro/specs/budget-tracker/requirements.md`
- `.kiro/specs/budget-tracker/design.md`
- `.kiro/specs/budget-tracker/tasks.md`

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

Private project - All rights reserved

## 🎓 Learning Resources

This project demonstrates:
- React 19 with TypeScript
- Context API for state management
- React Router for navigation
- Tailwind CSS v4 for styling
- Chart.js for data visualization
- Vitest for testing
- localStorage for data persistence
- Responsive design patterns
- Accessibility best practices

## 📸 Screenshots

### Dashboard (Light Mode)
![Dashboard Light](https://via.placeholder.com/800x500/FFFFFF/3B82F6?text=Dashboard+-+Light+Mode)

### Dashboard (Dark Mode)
![Dashboard Dark](https://via.placeholder.com/800x500/1F2937/3B82F6?text=Dashboard+-+Dark+Mode)

### Transaction List with Filters
![Transaction List](https://via.placeholder.com/800x500/FFFFFF/3B82F6?text=Transaction+List+with+Filters)

### Add Transaction Modal
![Add Transaction](https://via.placeholder.com/800x500/FFFFFF/3B82F6?text=Add+Transaction+Modal)

### Mobile Responsive View
![Mobile View](https://via.placeholder.com/400x700/FFFFFF/3B82F6?text=Mobile+Responsive+View)

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
