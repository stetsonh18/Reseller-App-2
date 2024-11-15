"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PlatformActions } from "./platform-actions"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"

type Platform = Database["public"]["Tables"]["platforms"]["Row"]

export function PlatformList() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [filteredPlatforms, setFilteredPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [hideInactive, setHideInactive] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchPlatforms = useCallback(async () => {
    try {
      let query = supabase
        .from("platforms")
        .select("*")
        .order("name")

      if (hideInactive) {
        query = query.eq('active', true)
      }

      const { data, error } = await query

      if (error) throw error
      setPlatforms(data || [])
    } catch (error) {
      console.error("Error fetching platforms:", error)
    } finally {
      setLoading(false)
    }
  }, [hideInactive])

  useEffect(() => {
    fetchPlatforms()
  }, [fetchPlatforms])

  useEffect(() => {
    let result = [...platforms]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(platform => 
        platform.name.toLowerCase().includes(search)
      )
    }

    setFilteredPlatforms(result)
  }, [platforms, searchTerm])

  useRealtimeSubscription("platforms", fetchPlatforms)

  const formatFeeStructure = (feeStructure: any) => {
    if (!feeStructure) return "No fees configured"

    const { baseFee = 0, percentageFee = 0 } = feeStructure
    const parts = []

    if (percentageFee > 0) {
      parts.push(`${percentageFee}% of sale`)
    }
    if (baseFee > 0) {
      parts.push(`$${baseFee.toFixed(2)} base fee`)
    }

    return parts.length > 0 ? parts.join(' + ') : "No fees"
  }

  if (loading) {
    return <div>Loading platforms...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search platforms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="hide-inactive"
            checked={hideInactive}
            onCheckedChange={setHideInactive}
          />
          <Label htmlFor="hide-inactive">Hide inactive platforms</Label>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform Name</TableHead>
              <TableHead>Fee Structure</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlatforms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No platforms found
                </TableCell>
              </TableRow>
            ) : (
              filteredPlatforms.map((platform) => (
                <TableRow key={platform.id}>
                  <TableCell className="font-medium">{platform.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatFeeStructure(platform.fee_structure)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={platform.active ? "default" : "secondary"}>
                      {platform.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PlatformActions platform={platform} onUpdate={fetchPlatforms} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}