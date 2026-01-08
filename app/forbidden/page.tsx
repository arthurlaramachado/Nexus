import Link from 'next/link'
import Button from '@/components/ui/Button'
import { getUserCollaborator } from '@/lib/auth/helpers'

export default async function ForbiddenPage() {
  const collaborator = await getUserCollaborator()
  
  // Handle roles potentially being an array or object
  const roles = (collaborator as any)?.roles
  const roleName = Array.isArray(roles) ? roles[0]?.name : roles?.name
  const role = roleName || 'Nenhum'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
        <p className="text-gray-600 mb-4">
          Você não tem permissão para acessar esta página.
        </p>
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Seu role atual:</span> {role}
          </p>
          {role === 'contributor' && (
            <p className="text-xs text-gray-600 mt-2">
              Esta página requer permissões de Admin ou Manager.
              Entre em contato com um administrador para atualizar suas permissões.
            </p>
          )}
        </div>
        <Link href="/dashboard">
          <Button>Voltar para Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

