import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminCategoryActions } from './AdminCategoryActions'
import { AdminCategoryForm } from './AdminCategoryForm'

export const metadata = { title: 'Categorias — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminCategoriasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'moderator'].includes(me.role)) redirect('/')

  const admin = createAdminClient()

  const { data: categories } = await admin
    .from('categories')
    .select('id, parent_id, name, slug, icon, is_featured, show_in_menu, status, sort_order, balance_release_days, created_at')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  const parents = (categories ?? []).filter((c: any) => !c.parent_id)
  const children = (categories ?? []).filter((c: any) => c.parent_id)

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Categorias</h1>
        <p className="text-sm text-muted-foreground">{(categories ?? []).length} categorias cadastradas</p>
      </header>

      {/* Formulário de nova categoria */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Nova categoria</h2>
        <AdminCategoryForm parents={parents.map((p: any) => ({ id: p.id, name: p.name }))} />
      </section>

      {/* Lista de categorias */}
      <section className="space-y-4">
        <h2 className="font-semibold">Categorias raiz</h2>
        {parents.map((cat: any) => {
          const subs = children.filter((c: any) => c.parent_id === cat.id)
          return (
            <div key={cat.id} className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-muted/30">
                {cat.icon && <span className="text-xl">{cat.icon}</span>}
                <div className="flex-1">
                  <p className="font-semibold">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">/{cat.slug} · {subs.length} subcategoria(s) · {cat.balance_release_days}d liberação</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cat.status ? 'bg-green-500/20 text-green-300' : 'bg-zinc-700 text-zinc-400'}`}>
                    {cat.status ? 'Ativa' : 'Inativa'}
                  </span>
                  {cat.is_featured && <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[11px] text-yellow-300">Destaque</span>}
                  <AdminCategoryActions categoryId={cat.id} currentStatus={cat.status} />
                </div>
              </div>
              {subs.length > 0 && (
                <div className="divide-y">
                  {subs.map((sub: any) => (
                    <div key={sub.id} className="flex items-center gap-3 px-5 py-3 pl-10">
                      {sub.icon && <span className="text-sm">{sub.icon}</span>}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">/{sub.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${sub.status ? 'bg-green-500/20 text-green-300' : 'bg-zinc-700 text-zinc-400'}`}>
                          {sub.status ? 'Ativa' : 'Inativa'}
                        </span>
                        <AdminCategoryActions categoryId={sub.id} currentStatus={sub.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {!parents.length && <p className="text-muted-foreground text-sm">Nenhuma categoria cadastrada ainda.</p>}
      </section>
    </div>
  )
}
