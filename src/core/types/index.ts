/**
 * Core Types
 * Barrel export for all core types
 */

export * from './auth.types';

// Common utility types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  timestamp: string;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  version: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchRequest extends PaginationRequest {
  query?: string;
  filters?: Record<string, any>;
}

export interface GeospatialPoint {
  latitude: number;
  longitude: number;
}

export interface GeospatialBounds {
  northEast: GeospatialPoint;
  southWest: GeospatialPoint;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: GeospatialPoint;
}

export interface FileUpload {
  key: string;
  bucket: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
  url?: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // HH:MM format
  closeTime?: string; // HH:MM format
  breaks?: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

export interface AuditInfo {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
}

export interface SoftDelete {
  deletedAt?: Date;
  deletedBy?: string;
  deleteReason?: string;
}

export type EntityWithAudit<T> = T & AuditInfo;
export type EntityWithSoftDelete<T> = T & SoftDelete;
export type FullEntity<T> = EntityWithAudit<EntityWithSoftDelete<T>>;

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface BulkOperationResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: ValidationError[];
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export interface AsyncOperationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message?: string;
  result?: any;
  error?: ApiError;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
