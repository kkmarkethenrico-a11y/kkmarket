'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Megaphone,
  ShoppingCart,
  Users,
  Wallet,
  Shield,
  Tag,
  Star,
  BookOpen,
  Settings,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/anuncios', label: 'Anúncios', icon: Megaphone, badge: 'pending' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
  { href: '/admin/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/admin/moderacao', label: 'Moderação', icon: Shield },
  { href: '/admin/categorias', label: 'Categorias', icon: Tag },
  { href: '/admin/pontos', label: 'Pontos GG', icon: Star },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

interface AdminSidebarProps {
  pendingCount: number
  role: string
}

export default function AdminSidebar({ pendingCount, role }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold">Admin</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground uppercase">
          {role}
        </span>
      </div>
      <nav className="p-3">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const isActive =
              href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge === 'pending' && pendingCount > 0 && (
                    <Badge className="h-5 min-w-5 justify-center rounded-full bg-destructive px-1.5 text-destructive-foreground">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </Badge>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
