import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { UserResponse } from '@repo/types'
import { usersApi } from '@/lib/api/users'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, UserPlus } from 'lucide-react'

interface AssigneePickerProps {
  value: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

export function AssigneePicker({ value, onChange, disabled }: AssigneePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data, isFetching } = useQuery({
    queryKey: ['users', 'list', { search, page: 1, size: 20 }],
    queryFn: () => usersApi.getUsers({ search, page: 1, size: 20 }),
    staleTime: 5 * 60 * 1000,
  })

  const users = data?.users ?? []

  const selectedUsers = useMemo<UserResponse[]>(() => {
    const byId = new Map(users.map((u) => [u.id, u]))
    return value.map((id) => byId.get(id)).filter(Boolean) as UserResponse[]
  }, [users, value])

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id))
    } else {
      onChange([...value, id])
    }
  }

  const clearAll = () => onChange([])

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap gap-2'>
        {selectedUsers.length === 0 ? (
          <span className='text-sm text-muted-foreground'>Nenhum responsável selecionado</span>
        ) : (
          selectedUsers.map((u) => (
            <Badge key={u.id} variant='secondary'>{u.username || u.email}</Badge>
          ))
        )}
      </div>

      <div className='flex items-center gap-2'>
        <Button type='button' variant='outline' size='sm' onClick={() => setOpen((o) => !o)} disabled={disabled}>
          <UserPlus className='h-4 w-4 mr-2' />
          {open ? 'Fechar' : 'Selecionar usuários'}
        </Button>
        {value.length > 0 && (
          <Button type='button' variant='ghost' size='sm' onClick={clearAll} disabled={disabled}>
            Limpar
          </Button>
        )}
      </div>

      {open && (
        <div className='border rounded-md p-3 space-y-3'>
          <Input
            placeholder='Buscar usuários...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={disabled}
          />
          <div className='max-h-60 overflow-y-auto divide-y'>
            {isFetching && users.length === 0 && (
              <div className='text-sm text-muted-foreground p-2'>Carregando...</div>
            )}
            {users.length === 0 && !isFetching && (
              <div className='text-sm text-muted-foreground p-2'>Nenhum usuário encontrado</div>
            )}
            {users.map((u) => {
              const selected = value.includes(u.id)
              return (
                <button
                  type='button'
                  key={u.id}
                  onClick={() => toggle(u.id)}
                  className='w-full text-left p-2 hover:bg-accent flex items-center justify-between'
                  disabled={disabled}
                >
                  <div>
                    <p className='text-sm font-medium'>{u.username || u.email}</p>
                    <p className='text-xs text-muted-foreground'>{u.email}</p>
                  </div>
                  {selected && <Check className='h-4 w-4 text-primary' />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

