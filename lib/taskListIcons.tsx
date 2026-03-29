import {
  ClipboardList, CheckSquare, ListChecks, Target, Flag, Bookmark, Star, Rocket,
  Briefcase, Laptop, Building2, Mail, Bell, Award, Folder, Trophy,
  Home, Heart, Users, User, Gift, Coffee, Smile,
  BookOpen, GraduationCap, Lightbulb, Pencil,
  Dumbbell, HeartPulse, Stethoscope, Leaf,
  ShoppingCart, ShoppingBag, Package, PiggyBank, TrendingUp, Tag,
  Plane, Car, Globe, Train, Map,
  Music, Film, Camera, Gamepad2,
  Zap, Shield, Wrench, MessageSquare, PawPrint, Phone, Code2, Calendar,
  type LucideIcon,
} from 'lucide-react';

export type ListIconDef = { name: string; icon: LucideIcon; color: string };

export const LIST_ICONS: ListIconDef[] = [
  // ── Task essentials ──────────────────────────────────────────
  { name: 'ClipboardList', icon: ClipboardList, color: 'text-emerald-600' },
  { name: 'CheckSquare',   icon: CheckSquare,   color: 'text-green-600'   },
  { name: 'ListChecks',    icon: ListChecks,    color: 'text-teal-600'    },
  { name: 'Target',        icon: Target,        color: 'text-red-500'     },
  { name: 'Flag',          icon: Flag,          color: 'text-orange-500'  },
  { name: 'Bookmark',      icon: Bookmark,      color: 'text-blue-500'    },
  { name: 'Star',          icon: Star,          color: 'text-yellow-500'  },
  { name: 'Rocket',        icon: Rocket,        color: 'text-violet-500'  },
  // ── Work & Productivity ──────────────────────────────────────
  { name: 'Briefcase',     icon: Briefcase,     color: 'text-slate-600'   },
  { name: 'Laptop',        icon: Laptop,        color: 'text-blue-600'    },
  { name: 'Building2',     icon: Building2,     color: 'text-slate-500'   },
  { name: 'Code2',         icon: Code2,         color: 'text-indigo-600'  },
  { name: 'Mail',          icon: Mail,          color: 'text-sky-600'     },
  { name: 'Calendar',      icon: Calendar,      color: 'text-indigo-500'  },
  { name: 'Bell',          icon: Bell,          color: 'text-amber-500'   },
  { name: 'Award',         icon: Award,         color: 'text-amber-600'   },
  { name: 'Folder',        icon: Folder,        color: 'text-yellow-600'  },
  { name: 'Trophy',        icon: Trophy,        color: 'text-amber-500'   },
  // ── Personal & Home ──────────────────────────────────────────
  { name: 'Home',          icon: Home,          color: 'text-violet-500'  },
  { name: 'Heart',         icon: Heart,         color: 'text-rose-500'    },
  { name: 'Users',         icon: Users,         color: 'text-teal-500'    },
  { name: 'User',          icon: User,          color: 'text-gray-500'    },
  { name: 'Gift',          icon: Gift,          color: 'text-rose-400'    },
  { name: 'Coffee',        icon: Coffee,        color: 'text-amber-700'   },
  { name: 'Smile',         icon: Smile,         color: 'text-yellow-500'  },
  { name: 'PawPrint',      icon: PawPrint,      color: 'text-orange-400'  },
  // ── Learning ─────────────────────────────────────────────────
  { name: 'BookOpen',      icon: BookOpen,      color: 'text-indigo-500'  },
  { name: 'GraduationCap', icon: GraduationCap, color: 'text-indigo-600'  },
  { name: 'Lightbulb',     icon: Lightbulb,     color: 'text-yellow-500'  },
  { name: 'Pencil',        icon: Pencil,        color: 'text-slate-500'   },
  // ── Health & Fitness ─────────────────────────────────────────
  { name: 'Dumbbell',      icon: Dumbbell,      color: 'text-orange-600'  },
  { name: 'HeartPulse',    icon: HeartPulse,    color: 'text-red-500'     },
  { name: 'Stethoscope',   icon: Stethoscope,   color: 'text-red-600'     },
  { name: 'Leaf',          icon: Leaf,          color: 'text-green-500'   },
  // ── Shopping & Finance ───────────────────────────────────────
  { name: 'ShoppingCart',  icon: ShoppingCart,  color: 'text-green-500'   },
  { name: 'ShoppingBag',   icon: ShoppingBag,   color: 'text-pink-500'    },
  { name: 'Package',       icon: Package,       color: 'text-gray-500'    },
  { name: 'PiggyBank',     icon: PiggyBank,     color: 'text-teal-500'    },
  { name: 'TrendingUp',    icon: TrendingUp,    color: 'text-emerald-600' },
  { name: 'Tag',           icon: Tag,           color: 'text-gray-400'    },
  // ── Travel & Transport ───────────────────────────────────────
  { name: 'Plane',         icon: Plane,         color: 'text-sky-600'     },
  { name: 'Car',           icon: Car,           color: 'text-amber-600'   },
  { name: 'Globe',         icon: Globe,         color: 'text-teal-500'    },
  { name: 'Train',         icon: Train,         color: 'text-blue-600'    },
  { name: 'Map',           icon: Map,           color: 'text-green-600'   },
  // ── Entertainment ────────────────────────────────────────────
  { name: 'Music',         icon: Music,         color: 'text-purple-500'  },
  { name: 'Film',          icon: Film,          color: 'text-purple-600'  },
  { name: 'Camera',        icon: Camera,        color: 'text-slate-500'   },
  { name: 'Gamepad2',      icon: Gamepad2,      color: 'text-violet-500'  },
  // ── Utilities ────────────────────────────────────────────────
  { name: 'Zap',           icon: Zap,           color: 'text-yellow-500'  },
  { name: 'Shield',        icon: Shield,        color: 'text-teal-600'    },
  { name: 'Wrench',        icon: Wrench,        color: 'text-slate-400'   },
  { name: 'MessageSquare', icon: MessageSquare, color: 'text-blue-500'    },
  { name: 'Phone',         icon: Phone,         color: 'text-cyan-600'    },
];

export const ICON_MAP = Object.fromEntries(LIST_ICONS.map(i => [i.name, i]));

/**
 * Renders a list icon by name. Falls back to ClipboardList if the name
 * isn't found (handles old emoji strings gracefully).
 */
export function getListIcon(name: string | undefined, cls = 'h-3.5 w-3.5') {
  const entry = ICON_MAP[name || 'ClipboardList'] ?? ICON_MAP['ClipboardList'];
  const Icon = entry.icon;
  return <Icon className={`${cls} ${entry.color}`} />;
}
