import { cookies } from 'next/headers'
import { dictionaries } from './dictionaries'

export async function getLanguage() {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value
  return locale === 'en' ? 'en' : 'pt'
}

export async function getDictionary() {
  const lang = await getLanguage()
  return dictionaries[lang]
}
