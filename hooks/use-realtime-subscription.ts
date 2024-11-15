"use client"

import { useEffect } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/auth'

export function useRealtimeSubscription(
  table: string,
  onUpdate: () => void
) {
  const { userId } = useUser()

  useEffect(() => {
    if (!userId) return

    let channel: RealtimeChannel

    const setupSubscription = async () => {
      channel = supabase
        .channel(`public:${table}:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('Change received!', payload)
            onUpdate()
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status for ${table}:`, status)
        })
    }

    setupSubscription()

    return () => {
      if (channel) {
        console.log(`Cleaning up subscription for ${table}`)
        supabase.removeChannel(channel)
      }
    }
  }, [table, onUpdate, userId])
}