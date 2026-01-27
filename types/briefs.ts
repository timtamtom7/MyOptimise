export type Brief = {
  id: string
  workspace_id: string
  title: string
  hook: string | null
  script: string | null
  visual_direction: string | null
  assets_url: string | null
  video_url: string | null
  feedback: string | null
  status: 'draft' | 'assigned' | 'in_review' | 'client_review' | 'approved' | 'scheduled'
  assignee_id: string | null // Editor
  author_id: string // Strategist
  price: number | null
  metadata: any | null
  created_at: string | null
  updated_at: string | null
  // New fields for MVP FLOW
  creative_goal?: string | null
  content_concept?: string | null
  references?: string[] | null
  required_assets?: { type: 'file' | 'url', url: string; name?: string }[] | null
  difficulty?: 'low' | 'medium' | 'high' | null
  claimed_at?: string | null
  deadline?: string | null
  platform?: string | null
  format?: string | null
  approval_token?: string | null
  approval_token_expiry?: string | null
  // Strategy Context
  strategy_pillars?: string[] | null
  target_audience?: string | null
  tone_of_voice?: string | null
  client_assets?: {
    title: string
    type: 'logo' | 'font' | 'guidelines' | 'other'
    url: string
    tags?: string[]
    assetId?: string
  }[] | null
  status_history?: {
    fromStatus: string | null
    toStatus: string
    changedAt: string
    changedBy?: { name?: string; email?: string }
    notes?: string
  }[] | null
}

export type Deliverable = {
  id: string
  brief_id: string
  editor_id: string
  file_url: string
  version: number | null
  status: 'pending_review' | 'changes_requested' | 'approved'
  feedback: string | null
  metadata: any | null
  created_at: string | null
}
