export const ACCOUNT_TYPE_GROUPS = {
  assets: ["CHECKING", "SAVINGS", "INVESTMENT", "RETIREMENT", "CRYPTO", "REAL_ESTATE", "VEHICLE", "CASH", "OTHER_ASSET"],
  liabilities: ["CREDIT_CARD", "LOAN", "MORTGAGE", "OTHER_LIABILITY"],
};

export const ACCOUNT_COLORS: Record<string, string> = {
  CHECKING: "#4F86C6",
  SAVINGS: "#52B788",
  CREDIT_CARD: "#E07A5F",
  LOAN: "#F2CC8F",
  MORTGAGE: "#8D6E63",
  INVESTMENT: "#7B68EE",
  RETIREMENT: "#9B59B6",
  CRYPTO: "#F39C12",
  REAL_ESTATE: "#1ABC9C",
  VEHICLE: "#95A5A6",
  CASH: "#2ECC71",
  OTHER_ASSET: "#3498DB",
  OTHER_LIABILITY: "#E74C3C",
};

export const CATEGORY_COLORS = [
  "#4F86C6", "#52B788", "#E07A5F", "#F2CC8F", "#8D6E63",
  "#7B68EE", "#9B59B6", "#F39C12", "#1ABC9C", "#E74C3C",
  "#3498DB", "#2ECC71", "#95A5A6", "#D35400", "#27AE60",
];

export const DEFAULT_CATEGORY_GROUPS = [
  { name: "Housing", icon: "🏠" },
  { name: "Food & Dining", icon: "🍽️" },
  { name: "Transportation", icon: "🚗" },
  { name: "Health", icon: "💊" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Personal Care", icon: "💅" },
  { name: "Education", icon: "📚" },
  { name: "Savings & Investing", icon: "💰" },
  { name: "Income", icon: "💵" },
  { name: "Transfers", icon: "↔️" },
  { name: "Other", icon: "📦" },
];

export const DEFAULT_CATEGORIES = [
  { name: "Rent / Mortgage", group: "Housing", emoji: "🏠", isIncome: false },
  { name: "Utilities", group: "Housing", emoji: "💡", isIncome: false },
  { name: "Internet", group: "Housing", emoji: "📡", isIncome: false },
  { name: "Groceries", group: "Food & Dining", emoji: "🛒", isIncome: false },
  { name: "Restaurants", group: "Food & Dining", emoji: "🍽️", isIncome: false },
  { name: "Coffee Shops", group: "Food & Dining", emoji: "☕", isIncome: false },
  { name: "Gas", group: "Transportation", emoji: "⛽", isIncome: false },
  { name: "Public Transit", group: "Transportation", emoji: "🚌", isIncome: false },
  { name: "Parking", group: "Transportation", emoji: "🅿️", isIncome: false },
  { name: "Rideshare", group: "Transportation", emoji: "🚕", isIncome: false },
  { name: "Doctor / Medical", group: "Health", emoji: "🏥", isIncome: false },
  { name: "Pharmacy", group: "Health", emoji: "💊", isIncome: false },
  { name: "Gym / Fitness", group: "Health", emoji: "🏋️", isIncome: false },
  { name: "Streaming", group: "Entertainment", emoji: "📺", isIncome: false },
  { name: "Movies / Events", group: "Entertainment", emoji: "🎬", isIncome: false },
  { name: "Clothing", group: "Shopping", emoji: "👕", isIncome: false },
  { name: "Electronics", group: "Shopping", emoji: "📱", isIncome: false },
  { name: "Amazon / Online", group: "Shopping", emoji: "📦", isIncome: false },
  { name: "Haircut / Beauty", group: "Personal Care", emoji: "💈", isIncome: false },
  { name: "Tuition", group: "Education", emoji: "🎓", isIncome: false },
  { name: "Books / Courses", group: "Education", emoji: "📚", isIncome: false },
  { name: "Emergency Fund", group: "Savings & Investing", emoji: "🛡️", isIncome: false },
  { name: "Investments", group: "Savings & Investing", emoji: "📈", isIncome: false },
  { name: "Salary", group: "Income", emoji: "💵", isIncome: true },
  { name: "Freelance", group: "Income", emoji: "💻", isIncome: true },
  { name: "Side Hustle", group: "Income", emoji: "🤑", isIncome: true },
  { name: "Interest", group: "Income", emoji: "🏦", isIncome: true },
  { name: "Transfer In", group: "Transfers", emoji: "⬇️", isIncome: true },
  { name: "Transfer Out", group: "Transfers", emoji: "⬆️", isIncome: false },
  { name: "Uncategorized", group: "Other", emoji: "❓", isIncome: false },
];

export const GOAL_TYPE_LABELS: Record<string, string> = {
  SAVINGS: "Savings",
  DEBT_PAYOFF: "Debt Payoff",
  INVESTMENT: "Investment",
  EMERGENCY_FUND: "Emergency Fund",
  VACATION: "Vacation",
  DOWN_PAYMENT: "Down Payment",
  WEDDING: "Wedding",
  OTHER: "Other",
};

export const GOAL_ICONS: Record<string, string> = {
  SAVINGS: "💰",
  DEBT_PAYOFF: "💳",
  INVESTMENT: "📈",
  EMERGENCY_FUND: "🛡️",
  VACATION: "✈️",
  DOWN_PAYMENT: "🏠",
  WEDDING: "💍",
  OTHER: "🎯",
};

export const FREQ_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUAL: "Annual",
};

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/accounts", label: "Accounts", icon: "Landmark" },
  { href: "/transactions", label: "Transactions", icon: "ArrowLeftRight" },
  { href: "/budget", label: "Budget", icon: "PieChart" },
  { href: "/goals", label: "Goals", icon: "Target" },
  { href: "/recurring", label: "Recurring", icon: "RefreshCw" },
  { href: "/cashflow", label: "Cash Flow", icon: "TrendingUp" },
  { href: "/investments", label: "Investments", icon: "BarChart2" },
  { href: "/debt", label: "Debt", icon: "CreditCard" },
  { href: "/reports", label: "Reports", icon: "FileBarChart" },
  { href: "/ai", label: "AI Assistant", icon: "Sparkles" },
  { href: "/household", label: "Household", icon: "Users" },
  { href: "/settings", label: "Settings", icon: "Settings" },
];
