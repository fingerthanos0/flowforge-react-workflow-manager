import { z } from 'zod'
import type { ApplicationFormValues } from '@/features/application-wizard/types'

export const STORAGE_KEY = 'flowforge.application-draft.v1'

export type StoredDraft = {
  version: 1
  updatedAt: string
  currentStep: number
  values: ApplicationFormValues
}

const storedServiceItemSchema = z.object({
  id: z.string(),
  serviceName: z.string(),
  description: z.string(),
  quantity: z.number(),
  priority: z.enum(['low', 'medium', 'high']),
})

const storedValuesSchema = z.object({
  userInfo: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string(),
  }),
  requestConfiguration: z.object({
    services: z.array(storedServiceItemSchema),
  }),
})

const storedDraftSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  currentStep: z.number().int().min(0),
  values: storedValuesSchema,
}) satisfies z.ZodType<StoredDraft>

export function readDraft(): StoredDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    const result = storedDraftSchema.safeParse(parsed)

    if (!result.success) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return result.data
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function writeDraft(draft: StoredDraft): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // A full or unavailable localStorage must not break the form.
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore — nothing meaningful to recover from here.
  }
}
