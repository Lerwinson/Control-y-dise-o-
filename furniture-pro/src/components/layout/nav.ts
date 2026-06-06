import {
  Home, Folder, PencilRuler, Sofa, BedDouble, Layers, Armchair, Library,
  Pen, Box, Boxes, List, DollarSign, Factory, BarChart3, Bot, Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem { href: string; label: string; icon: LucideIcon; }
export interface NavGroup { section: string; items: NavItem[]; }

export const NAV: NavGroup[] = [
  { section: 'sec_main', items: [
    { href: '/dashboard', label: 'nav_home', icon: Home },
    { href: '/projects', label: 'nav_projects', icon: Folder },
    { href: '/designs', label: 'nav_designs', icon: PencilRuler },
  ]},
  { section: 'sec_catalog', items: [
    { href: '/sofas', label: 'nav_sofas', icon: Sofa },
    { href: '/beds', label: 'nav_beds', icon: BedDouble },
    { href: '/mattress', label: 'nav_mattress', icon: Layers },
    { href: '/furniture', label: 'nav_furniture', icon: Armchair },
    { href: '/library', label: 'nav_library', icon: Library },
  ]},
  { section: 'sec_design', items: [
    { href: '/design2d', label: 'nav_design2d', icon: Pen },
    { href: '/design3d', label: 'nav_design3d', icon: Box },
    { href: '/exploded', label: 'nav_exploded', icon: Boxes },
  ]},
  { section: 'sec_manufacturing', items: [
    { href: '/bom', label: 'nav_bom', icon: List },
    { href: '/costs', label: 'nav_costs', icon: DollarSign },
    { href: '/production', label: 'nav_production', icon: Factory },
    { href: '/reports', label: 'nav_reports', icon: BarChart3 },
  ]},
  { section: 'sec_system', items: [
    { href: '/ai', label: 'nav_ai', icon: Bot },
    { href: '/settings', label: 'nav_settings', icon: Settings },
  ]},
];
