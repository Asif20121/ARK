import { createClient } from '@supabase/supabase-js'

// Check if Supabase environment variables are configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-url' || supabaseKey === 'your-supabase-anon-key') {
  console.error('Supabase configuration missing. Please set up your Supabase project and add the environment variables.')
}

// Create a mock client if credentials are missing (for development)
const createMockClient = () => ({
  from: () => ({
    select: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    update: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
    delete: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
    eq: function() { return this },
    single: function() { return this },
    order: function() { return this },
    lte: function() { return this },
    gte: function() { return this }
  })
})

export const supabase = (supabaseUrl && supabaseKey && supabaseUrl !== 'your-supabase-url' && supabaseKey !== 'your-supabase-anon-key') 
  ? createClient(supabaseUrl, supabaseKey)
  : createMockClient() as any

// Database types
export interface Rate {
  id: number
  name: string
  low: number
  high: number
  rate: number
  created_at?: string
}

export interface Product {
  id: number
  species: string
  specification: string
  glazing: number
  size: string
  low: number
  high: number
  reference_weight: number
  status: 'active' | 'inactive'
  created_at?: string
}

export interface Constants {
  id: number
  usd_rate: number
  variable_overhead: number
  fixed_overhead: number
  freight: number
  insurance: number
  subsidy_rate: number
  subsidy_cap: number
  updated_at?: string
}