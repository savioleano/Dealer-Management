'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { CITIES, districtForCity, isKnownCity } from '@/lib/locations'

interface Props {
  value: string
  // Fires with the chosen city and its mapped district (district = '' when cleared).
  onChange: (city: string, district: string) => void
  required?: boolean
  placeholder?: string
}

const MAX_RESULTS = 50

export default function CityAutocomplete({ value, onChange, required, placeholder = 'Search city…' }: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  // Keep the visible text in sync when the parent value changes (e.g. reset).
  useEffect(() => setQuery(value), [value])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CITIES.slice(0, MAX_RESULTS)
    return CITIES.filter((c) => c.toLowerCase().includes(q)).slice(0, MAX_RESULTS)
  }, [query])

  // Close on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function commit(city: string) {
    onChange(city, districtForCity(city) ?? '')
    setQuery(city)
    setOpen(false)
  }

  function handleBlur() {
    // On blur, accept an exact (case-insensitive) match; otherwise revert to the
    // last valid value so District never desyncs from a non-existent city.
    const exact = CITIES.find((c) => c.toLowerCase() === query.trim().toLowerCase())
    if (exact) {
      if (exact !== value) commit(exact)
    } else {
      setQuery(value)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && matches[highlight]) {
        e.preventDefault()
        commit(matches[highlight])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const invalid = required && query.trim() !== '' && !isKnownCity(query.trim())

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setHighlight(0)
          // Typing invalidates any previously selected city until re-confirmed.
          if (value) onChange('', '')
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      {/* Hidden field so the browser's native "required" validation still applies. */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          className="sr-only absolute bottom-0 left-1/2 h-0 w-0 opacity-0"
        />
      )}

      {open && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {matches.map((city, i) => (
            <li
              key={city}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault()
                commit(city)
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${i === highlight ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
            >
              {city}
              <span className="text-xs text-gray-400"> · {districtForCity(city)}</span>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && matches.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg">
          No matching city.
        </div>
      )}

      {invalid && <p className="mt-1 text-xs text-amber-600">Select a city from the list.</p>}
    </div>
  )
}
