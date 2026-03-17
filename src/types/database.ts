export type UserRole = 'employee' | 'operator' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  employee_id: string | null
  department: string | null
  floor: number | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type ComplaintCategory = 'facility' | 'living_environment' | 'welfare' | 'it' | 'other'
export type ComplaintStatus = 'submitted' | 'reviewing' | 'in_progress' | 'completed' | 'rejected'

export interface Complaint {
  id: string
  reporter_id: string
  is_anonymous: boolean
  category: ComplaintCategory
  title: string
  description: string
  attachments: string[]
  status: ComplaintStatus
  assigned_to: string | null
  response: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
}

export type AssetType = 'pc' | 'monitor' | 'laptop' | 'keyboard' | 'mouse' | 'headset' | 'other'
export type AssetStatus = 'in_use' | 'in_stock' | 'under_repair' | 'disposed'

export interface Asset {
  id: string
  asset_number: string
  type: AssetType
  model: string | null
  spec: Record<string, unknown> | null
  assigned_to: string | null
  status: AssetStatus
  purchased_at: string | null
  warranty_until: string | null
  created_at: string
  updated_at: string
}

export type EquipmentRequestType =
  | 'inspection'
  | 'replacement'
  | 'purchase'
  | 'software_purchase'
  | 'network_inspection'
export type EquipmentRequestStatus =
  | 'submitted'
  | 'reviewing'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
export type UrgencyLevel = 'normal' | 'urgent'

export interface EquipmentRequest {
  id: string
  requester_id: string
  request_type: EquipmentRequestType
  asset_id: string | null
  title: string
  description: string
  urgency: UrgencyLevel
  status: EquipmentRequestStatus
  assigned_to: string | null
  floor: number | null
  attachments: string[]
  created_at: string
  updated_at: string
}

export interface TemperatureReading {
  id: string
  floor: number
  zone: string | null
  current_temp: number | null
  target_temp: number | null
  recorded_at: string
}

export type TemperatureFeeling = 'hot' | 'cold'
export type TemperatureComplaintStatus = 'submitted' | 'acknowledged' | 'resolved'

export interface TemperatureComplaint {
  id: string
  reporter_id: string
  floor: number
  feeling: TemperatureFeeling
  memo: string | null
  status: TemperatureComplaintStatus
  created_at: string
}

export type ItemCategory = 'electronics' | 'clothing' | 'wallet_card' | 'other'

export type FoundItemStatus = 'registered' | 'matched' | 'claimed' | 'disposed'

export interface FoundItem {
  id: string
  reporter_id: string
  item_name: string
  category: ItemCategory
  found_floor: number
  found_location: string | null
  description: string | null
  photo_url: string | null
  storage_location: string | null
  storage_deadline: string | null
  status: FoundItemStatus
  claimed_by: string | null
  claimed_at: string | null
  created_at: string
  updated_at: string
}

export type LostItemStatus = 'reported' | 'matched' | 'claimed' | 'closed'

export interface LostItem {
  id: string
  reporter_id: string
  item_name: string
  category: ItemCategory
  lost_floor: number | null
  lost_location: string | null
  lost_time: string | null
  description: string | null
  photo_url: string | null
  status: LostItemStatus
  matched_found_id: string | null
  created_at: string
  updated_at: string
}

export type ParcelStatus = 'stored' | 'notified' | 'claimed'

export interface Parcel {
  id: string
  recipient_id: string | null
  recipient_name: string
  carrier: string | null
  tracking_number: string | null
  storage_location: string
  registered_by: string
  status: ParcelStatus
  claimed_at: string | null
  reminder_count: number
  created_at: string
  updated_at: string
}

export type FacilityCategory =
  | 'lighting'
  | 'furniture'
  | 'door'
  | 'plumbing'
  | 'electrical'
  | 'cleaning'
  | 'other'
export type FacilityStatus = 'submitted' | 'vendor_assigned' | 'in_repair' | 'completed'

export interface FacilityRequest {
  id: string
  requester_id: string
  category: FacilityCategory
  floor: number
  location_detail: string
  description: string
  photo_url: string | null
  urgency: UrgencyLevel
  status: FacilityStatus
  vendor: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export type NotificationType =
  | 'request_status'
  | 'parcel_arrival'
  | 'parcel_reminder'
  | 'temperature'
  | 'complaint_response'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  is_read: boolean
  channel: 'in_app' | 'email' | 'slack'
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  author_id: string
  is_pinned: boolean
  published_at: string | null
  created_at: string
}
