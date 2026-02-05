import {
  UtensilsCrossed,
  ShoppingCart,
  Car,
  ShoppingBag,
  Lightbulb,
  HeartPulse,
  Film,
  BookOpen,
  Sparkles,
  Home,
  Users,
  CreditCard,
  Gift,
  Smartphone,
  Package,
  PiggyBank,
  Plane,
  Baby,
  PawPrint,
  Briefcase,
  Wrench,
} from 'lucide-react'

const CATEGORY_ICONS = {
  'Food & Dining': UtensilsCrossed,
  'Groceries': ShoppingCart,
  'Transport': Car,
  'Shopping': ShoppingBag,
  'Bills & Utilities': Lightbulb,
  'Health & Medical': HeartPulse,
  'Entertainment': Film,
  'Education': BookOpen,
  'Personal Care': Sparkles,
  'Housing': Home,
  'Family Support': Users,
  'Debt & Loans': CreditCard,
  'Gifts & Events': Gift,
  'Subscriptions': Smartphone,
  'Others': Package,
  'Investments & Savings': PiggyBank,
  'Travel & Vacation': Plane,
  'Kids & Baby': Baby,
  'Pets': PawPrint,
  'Business & Work': Briefcase,
  'Vehicle': Wrench,
}

const DEFAULT_ICON = Package

/**
 * Renders the Lucide icon for an expense category.
 * @param {string} name - Category name (e.g. 'Food & Dining')
 * @param {string} [className] - Optional Tailwind/class for the SVG
 * @param {number} [size=18] - Icon size in pixels
 */
export default function CategoryIcon({ name, className = '', size = 18 }) {
  const Icon = (name && CATEGORY_ICONS[name]) || DEFAULT_ICON
  return <Icon className={className} size={size} aria-hidden />
}

export { CATEGORY_ICONS }
