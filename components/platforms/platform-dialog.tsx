"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/lib/auth"

type Platform = Database["public"]["Tables"]["platforms"]["Row"]

const platformSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  baseFee: z.number().min(0, "Base fee must be 0 or greater"),
  percentageFee: z.number().min(0, "Percentage fee must be 0 or greater").max(100, "Percentage fee cannot exceed 100"),
  active: z.boolean().default(true),
})

interface PlatformDialogProps {
  platform?: Platform
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PlatformDialog({
  platform,
  open,
  onOpenChange,
  onSuccess,
}: PlatformDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { userId } = useUser()
  const isEditing = !!platform

  const form = useForm<z.infer<typeof platformSchema>>({
    resolver: zodResolver(platformSchema),
    defaultValues: {
      name: platform?.name || "",
      baseFee: platform?.fee_structure?.baseFee || 0,
      percentageFee: platform?.fee_structure?.percentageFee || 0,
      active: platform?.active ?? true,
    },
  })

  async function onSubmit(values: z.infer<typeof platformSchema>) {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const feeStructure = {
        baseFee: values.baseFee,
        percentageFee: values.percentageFee,
      }

      if (isEditing) {
        const { error } = await supabase
          .from("platforms")
          .update({
            name: values.name,
            fee_structure: feeStructure,
            active: values.active,
          })
          .eq("id", platform.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("platforms")
          .insert({
            name: values.name,
            fee_structure: feeStructure,
            active: values.active,
            user_id: userId,
          })

        if (error) throw error
      }

      toast({
        title: isEditing ? "Platform updated" : "Platform created",
        description: `Successfully ${isEditing ? "updated" : "created"} ${values.name}`,
      })
      onSuccess()
    } catch (error) {
      console.error("Error saving platform:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} platform. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Platform" : "Add Platform"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the platform details and fee structure."
              : "Add a new selling platform and configure its fee structure."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., eBay, Amazon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baseFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Fee ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="percentageFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentage Fee (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Disable this if you're no longer using this platform
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {isEditing ? "Update" : "Add"} Platform
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}