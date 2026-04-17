'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'

interface Tag {
  id: string
  name: string
}

interface TagInputProps {
  selectedTags: Tag[]
  onChange: (tags: Tag[]) => void
}

export default function TagInput({ selectedTags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Fetch all tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('tags')
        .select('id, name')
        .order('name')
      
      if (data) {
        setAllTags(data)
      }
      setLoading(false)
    }

    fetchTags()
  }, [supabase])

  // Filter tags when input changes
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([])
      return
    }

    const filtered = allTags
      .filter(tag => 
        tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.some(selected => selected.id === tag.id)
      )
      .slice(0, 5) // Limit to top 5 matches

    setSuggestions(filtered)
  }, [inputValue, allTags, selectedTags])

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!inputValue.trim()) return

      // Check if tag already selected
      if (selectedTags.some(t => t.name.toLowerCase() === inputValue.trim().toLowerCase())) {
        setInputValue('')
        setSuggestions([])
        return
      }

      // Check if tag exists in allTags (exact match)
      const existingTag = allTags.find(
        t => t.name.toLowerCase() === inputValue.trim().toLowerCase()
      )

      if (existingTag) {
        onChange([...selectedTags, existingTag])
      } else {
        // Create new tag
        try {
          const { data: newTag, error } = await supabase
            .from('tags')
            .insert({ 
              name: inputValue.trim()
            })
            .select()
            .single()
          
          if (newTag) {
            const updatedAllTags = [...allTags, newTag].sort((a, b) => a.name.localeCompare(b.name))
            setAllTags(updatedAllTags)
            onChange([...selectedTags, newTag])
          }
          
          if (error) {
            console.error('Error creating tag:', error)
          }
        } catch (error) {
          console.error('Error creating tag:', error)
        }
      }
      setInputValue('')
      setSuggestions([])
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      onChange(selectedTags.slice(0, -1))
    }
  }

  const removeTag = (tagId: string) => {
    onChange(selectedTags.filter(t => t.id !== tagId))
  }

  const addTag = (tag: Tag) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      onChange([...selectedTags, tag])
    }
    setInputValue('')
    setSuggestions([])
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#3A3A47]">Tags / Categories</label>
      <div className="relative">
        <div className="flex flex-wrap gap-2 p-2 border border-[#E4E4E8] rounded-lg bg-white focus-within:ring-2 focus-within:ring-[#9898A3] focus-within:border-[#9898A3] min-h-[42px]">
          {selectedTags.map(tag => (
            <span key={tag.id} className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-[#F1F1F4] text-[#6B6B78]">
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="ml-1 text-[#3B82F6] hover:text-[#1A1A2E]"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            className="flex-1 min-w-[120px] border-none p-1 focus:ring-0 text-sm outline-none"
            placeholder={selectedTags.length === 0 ? "Type and press Enter..." : ""}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#E4E4E8] rounded-xl shadow-[var(--shadow-dropdown)] z-10 max-h-60 overflow-auto p-1">
            {suggestions.map(tag => (
              <button
                key={tag.id}
                type="button"
                className="block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#F7F7F8]"
                onClick={() => addTag(tag)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
