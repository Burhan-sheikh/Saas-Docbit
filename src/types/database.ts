// Generated domain types mirroring the Supabase Postgres schema.
// Keep in sync with supabase/migrations/*.sql

export type UUID = string;
export type ISODateString = string;

export type PlanTier = 'free' | 'pro' | 'business' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

export type WorkspaceRole = 'owner' | 'admin' | 'member';
export type ProjectRole = 'owner' | 'editor' | 'viewer';

export type ProjectStatus = 'active' | 'archived';
export type WorkspaceStatus = 'active' | 'archived';

export type FileCategory =
  | 'images'
  | 'pdfs'
  | 'documents'
  | 'spreadsheets'
  | 'presentations'
  | 'archives'
  | 'design_files'
  | 'other';

export type NodeType = 'folder' | 'file';

export type PermissionRequestStatus = 'pending' | 'approved' | 'denied';

export type NotificationType =
  | 'project_created'
  | 'project_updated'
  | 'workspace_updated'
  | 'link_generated'
  | 'link_expired'
  | 'permission_request'
  | 'permission_approved'
  | 'permission_denied'
  | 'member_joined'
  | 'member_removed'
  | 'storage_limit_reached'
  | 'plan_upgraded'
  | 'plan_expired'
  | 'billing_updated';

export interface Profile {
  id: UUID;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  google_id: string | null;
  onboarded: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Plan {
  id: UUID;
  slug: PlanTier;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_workspaces: number;
  max_projects_per_workspace: number;
  max_storage_bytes: number;
  max_members_per_project: number;
  features: string[];
  is_active: boolean;
  created_at: ISODateString;
}

export interface Subscription {
  id: UUID;
  user_id: UUID;
  plan_id: UUID;
  plan?: Plan;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  current_period_start: ISODateString;
  current_period_end: ISODateString;
  cancel_at_period_end: boolean;
  provider: 'mock' | 'razorpay';
  provider_subscription_id: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Workspace {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  owner_id: UUID;
  status: WorkspaceStatus;
  is_favorite?: boolean;
  archived_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface WorkspaceMember {
  id: UUID;
  workspace_id: UUID;
  user_id: UUID;
  role: WorkspaceRole;
  profile?: Profile;
  created_at: ISODateString;
}

export interface WorkspaceStats {
  workspace_id: UUID;
  project_count: number;
  member_count: number;
  storage_used_bytes: number;
}

export interface Project {
  id: UUID;
  workspace_id: UUID;
  name: string;
  description: string | null;
  icon: string | null;
  status: ProjectStatus;
  owner_id: UUID;
  archived_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ProjectStats {
  project_id: UUID;
  file_count: number;
  folder_count: number;
  member_count: number;
  link_count: number;
  storage_used_bytes: number;
}

export interface ProjectMember {
  id: UUID;
  project_id: UUID;
  user_id: UUID;
  role: ProjectRole;
  profile?: Profile;
  invited_by: UUID | null;
  invited_email: string | null;
  accepted: boolean;
  created_at: ISODateString;
}

export interface ProjectPermission {
  id: UUID;
  project_id: UUID;
  user_id: UUID;
  can_upload: boolean;
  can_delete: boolean;
  can_share: boolean;
  can_manage_members: boolean;
  created_at: ISODateString;
}

export interface ProjectPermissionRequest {
  id: UUID;
  project_id: UUID;
  requester_id: UUID;
  requester?: Profile;
  reason: string | null;
  status: PermissionRequestStatus;
  resolved_by: UUID | null;
  resolved_at: ISODateString | null;
  created_at: ISODateString;
}

export interface FileNode {
  id: UUID;
  project_id: UUID;
  parent_id: UUID | null;
  name: string;
  type: NodeType;
  category: FileCategory | null;
  is_system_folder: boolean;
  mime_type: string | null;
  size_bytes: number;
  storage_key: string | null;
  storage_url: string | null;
  checksum: string | null;
  created_by: UUID;
  is_deleted: boolean;
  deleted_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export type LinkTargetType = 'file' | 'folder' | 'category' | 'project';

export interface ProjectLink {
  id: UUID;
  project_id: UUID;
  target_type: LinkTargetType;
  target_ids: UUID[];
  slug: string;
  password_hash: string | null;
  expires_at: ISODateString | null;
  max_downloads: number | null;
  download_count: number;
  view_count: number;
  require_login: boolean;
  permission: 'view' | 'download';
  is_active: boolean;
  created_by: UUID;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Notification {
  id: UUID;
  user_id: UUID;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: ISODateString;
}

export interface StorageUsage {
  id: UUID;
  workspace_id: UUID | null;
  project_id: UUID | null;
  user_id: UUID;
  bytes_used: number;
  updated_at: ISODateString;
}

export type AnalyticsEventType =
  | 'project_view'
  | 'file_upload'
  | 'file_download'
  | 'link_view'
  | 'link_download';

export interface AnalyticsEvent {
  id: UUID;
  project_id: UUID;
  event_type: AnalyticsEventType;
  actor_id: UUID | null;
  link_id: UUID | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  metadata: Record<string, unknown>;
  created_at: ISODateString;
}

export interface ActivityLog {
  id: UUID;
  workspace_id: UUID | null;
  project_id: UUID | null;
  actor_id: UUID;
  actor?: Profile;
  action: string;
  target_type: string;
  target_id: UUID | null;
  metadata: Record<string, unknown>;
  created_at: ISODateString;
}
