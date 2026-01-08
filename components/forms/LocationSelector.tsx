'use client'

import { useState, useEffect, useMemo } from 'react'
import { Country, City } from 'country-state-city'
import Combobox from '@/components/ui/Combobox'

interface LocationSelectorProps {
  countryValue?: string
  cityValue?: string
  onCountryChange: (country: string) => void
  onCityChange: (city: string) => void
  error?: string
}

export default function LocationSelector({
  countryValue,
  cityValue,
  onCountryChange,
  onCityChange,
  error
}: LocationSelectorProps) {
  const [countries, setCountries] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])

  useEffect(() => {
    setCountries(Country.getAllCountries())
  }, [])

  useEffect(() => {
    if (countryValue) {
      const selectedCountry = countries.find(c => c.name === countryValue)
      if (selectedCountry) {
        setCities(City.getCitiesOfCountry(selectedCountry.isoCode) || [])
      } else {
        setCities([])
      }
    } else {
      setCities([])
    }
  }, [countryValue, countries])

  const countryOptions = useMemo(() => 
    countries.map(c => ({ label: c.name, value: c.name })),
    [countries]
  )

  const cityOptions = useMemo(() => {
    // Deduplicate cities by name since we only store the city name string
    // and multiple states can have cities with the same name
    const uniqueNames = new Set<string>()
    return cities.reduce((acc: { label: string, value: string }[], c) => {
      if (!uniqueNames.has(c.name)) {
        uniqueNames.add(c.name)
        acc.push({ label: c.name, value: c.name })
      }
      return acc
    }, [])
  }, [cities])

  const handleCountryChange = (value: string) => {
    onCountryChange(value)
    onCityChange('') // Reset city when country changes
  }

  return (
    <div className="space-y-4">
      <Combobox
        label="Country"
        value={countryValue}
        onChange={handleCountryChange}
        options={countryOptions}
        error={error}
        placeholder="Select or type country..."
      />

      <Combobox
        label="City"
        value={cityValue}
        onChange={onCityChange}
        options={cityOptions}
        disabled={!countryValue || cities.length === 0}
        placeholder="Select or type city..."
      />
    </div>
  )
}

