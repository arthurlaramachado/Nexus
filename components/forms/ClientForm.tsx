'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientSchema, ClientFormData } from '@/lib/validations/client'
import { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/types/database'
import LocationSelector from '@/components/forms/LocationSelector'
import TagInput from '@/components/forms/TagInput'
import { useFormSubmission } from '@/lib/hooks/useFormSubmission'

interface ClientFormProps {
  client?: Client
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const supabase = createClient()
  const [selectedTags, setSelectedTags] = useState<{id: string, name: string}[]>([])
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? {
      name: client.name,
      status: client.status,
      country: client.country || undefined,
      city: client.city || undefined,
      unique_identifier: client.unique_identifier || undefined,
    } : {
      name: '',
      status: 'active',
      country: '',
      city: '',
      unique_identifier: '',
    },
  })

  const country = watch('country')
  const city = watch('city')

  useEffect(() => {
    if (client) {
      const fetchTags = async () => {
        const { data } = await supabase
          .from('client_tags')
          .select('tags(id, name)')
          .eq('client_id', client.id)
        
        if (data) {
          // Flatten the structure since Supabase returns { tags: { ... } }
          const flattenedTags = data.map((item: any) => item.tags).filter(Boolean)
          setSelectedTags(flattenedTags)
        }
      }
      fetchTags()
    }
  }, [client, supabase])

  const { submit, loading } = useFormSubmission(async (data: ClientFormData) => {
    let clientId = client?.id

    if (client) {
      // Update
      const { error } = await supabase
        .from('clients')
        .update({
          name: data.name,
          status: data.status,
          country: data.country,
          city: data.city,
        })
        .eq('id', client.id)
      
      if (error) throw error
    } else {
      // Create
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert(data)
        .select()
        .single()
      
      if (error) throw error
      clientId = newClient.id
    }

    // Handle Tags
    if (clientId) {
      // Delete existing tags if update
      if (client) {
        await supabase.from('client_tags').delete().eq('client_id', clientId)
      }

      if (selectedTags.length > 0) {
        const tagsToInsert = selectedTags.map(tag => ({
          client_id: clientId,
          tag_id: tag.id,
        }))
        
        const { error: tagError } = await supabase
          .from('client_tags')
          .insert(tagsToInsert)
        
        if (tagError) throw tagError
      }
    }
  }, {
    onSuccess,
    successMessage: client ? 'Client updated successfully' : 'Client created successfully'
  })

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <Input
        label="Client Name *"
        {...register('name')}
        error={errors.name?.message}
      />

      <Select
        label="Status *"
        {...register('status')}
        error={errors.status?.message}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>

      <LocationSelector
        countryValue={country || ''}
        cityValue={city || ''}
        onCountryChange={(val) => setValue('country', val)}
        onCityChange={(val) => setValue('city', val)}
        error={errors.country?.message || errors.city?.message}
      />

      <TagInput
        selectedTags={selectedTags}
        onChange={setSelectedTags}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
        </Button>
      </div>
    </form>
  )
}
