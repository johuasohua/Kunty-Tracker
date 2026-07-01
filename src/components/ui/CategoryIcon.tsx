import {
  Wallet,
  TrendingUp,
  ShoppingCart,
  Utensils,
  Receipt,
  Car,
  ShoppingBag,
  Sparkles,
  Plane,
  Wrench,
  Landmark,
  ArrowLeftRight,
  Undo2,
  Tag,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  wallet: Wallet,
  "trending-up": TrendingUp,
  "shopping-cart": ShoppingCart,
  utensils: Utensils,
  receipt: Receipt,
  car: Car,
  "shopping-bag": ShoppingBag,
  sparkles: Sparkles,
  plane: Plane,
  wrench: Wrench,
  landmark: Landmark,
  "arrow-left-right": ArrowLeftRight,
  "undo-2": Undo2,
};

export function CategoryIcon({
  icon,
  color,
  size = 16,
}: {
  icon: string | null;
  color: string;
  size?: number;
}) {
  const Icon = (icon && ICONS[icon]) || Tag;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size * 2,
        height: size * 2,
        backgroundColor: `${color}22`,
        color,
      }}
    >
      <Icon size={size} strokeWidth={2} />
    </div>
  );
}
