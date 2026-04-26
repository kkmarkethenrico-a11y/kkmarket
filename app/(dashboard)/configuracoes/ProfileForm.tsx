'use client'

import { useActionState, useState } from 'react'
import { updateProfileAction, type ProfileFormState } from './actions'

type Defaults = {
  display_name: string
  full_name: string
  cpf: string
  phone: string
  birth_date: string
  bio: string
  avatar_url: string
}

function maskCpf(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim()
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim()
}

export function ProfileForm({ defaults }: { defaults: Defaults }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    null
  )
  const [cpf, setCpf] = useState(defaults.cpf ? maskCpf(defaults.cpf) : '')
  const [phone, setPhone] = useState(defaults.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(defaults.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'avatars')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Falha no upload')
      setAvatarUrl(json.url as string)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form action={action} className="space-y-6">
      {/* Avatar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <label className="block text-sm font-medium text-zinc-300 mb-3">Foto de perfil</label>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-zinc-800 bg-zinc-800">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">sem foto</div>
            )}
          </div>
          <div>
            <label className="inline-flex cursor-pointer rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700">
              {uploading ? 'Enviando…' : 'Trocar foto'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={onAvatarChange}
              />
            </label>
            {uploadError && <p className="mt-2 text-xs text-red-400">{uploadError}</p>}
            <p className="mt-1 text-xs text-zinc-500">JPG, PNG ou WEBP até 2MB.</p>
          </div>
        </div>
        <input type="hidden" name="avatar_url" value={avatarUrl} />
      </div>

      {/* Dados pessoais */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Dados pessoais</h2>

        <Input
          label="Nome de exibição"
          name="display_name"
          defaultValue={defaults.display_name}
          maxLength={60}
          placeholder="Como você quer aparecer no site"
          error={state?.errors?.display_name?.[0]}
        />

        <Input
          label="Nome completo"
          name="full_name"
          defaultValue={defaults.full_name}
          maxLength={120}
          placeholder="Como consta no documento"
          error={state?.errors?.full_name?.[0]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="CPF"
            name="cpf"
            value={cpf}
            onChange={(e) => setCpf(maskCpf(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            error={state?.errors?.cpf?.[0]}
          />
          <Input
            label="Data de nascimento"
            name="birth_date"
            type="date"
            defaultValue={defaults.birth_date}
            error={state?.errors?.birth_date?.[0]}
          />
        </div>

        <Input
          label="Telefone / WhatsApp"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(maskPhone(e.target.value))}
          placeholder="(00) 00000-0000"
          inputMode="tel"
          error={state?.errors?.phone?.[0]}
        />

        <Textarea
          label="Bio"
          name="bio"
          defaultValue={defaults.bio}
          maxLength={300}
          placeholder="Conte um pouco sobre você (opcional)"
          error={state?.errors?.bio?.[0]}
        />
      </div>

      {/* Feedback */}
      {state?.message && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            state.ok
              ? 'border-green-500/30 bg-green-500/10 text-green-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-full bg-violet-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-violet-500 active:scale-[0.97] disabled:opacity-50"
        >
          {pending ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}

function Input({
  label,
  error,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
      <input
        {...rest}
        className={`w-full rounded-xl border ${
          error ? 'border-red-500' : 'border-zinc-700'
        } bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

function Textarea({
  label,
  error,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
      <textarea
        {...rest}
        rows={3}
        className={`w-full rounded-xl border ${
          error ? 'border-red-500' : 'border-zinc-700'
        } bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
