import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import NovaOSForm from '@/frontend/components/NovaOSForm'

export default async function NovaOSPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  let user = { name: 'Usuário', email: '' }

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY || 'default-secret-key-change-me-in-prod')
      const { payload } = await jwtVerify(token, secret)
      user = { name: (payload.name as string) || 'Usuário', email: (payload.email as string) || '' }
    } catch {}
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white pb-12 relative">
      <NovaOSForm user={user} />
    </div>
  )
}
