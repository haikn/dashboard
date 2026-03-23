// Advanced TypeScript examples: unions, intersections, literals,
// discriminated unions and core utility types.

// --- Union, intersection, literal types ---

export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface BaseEntity {
  id: string;
}

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// Intersection type combines properties from multiple types
export type EntityWithTimestamps = BaseEntity & Timestamps;

// Narrowing with union + literals
export function isFinished(status: Status): boolean {
  if (status === 'success' || status === 'error') {
    return true;
  }

  // Here status is narrowed to 'idle' | 'loading'
  return false;
}

// --- Discriminated unions ---

export type ApiSuccess<T> = {
  kind: 'success';
  data: T;
};

export type ApiError = {
  kind: 'error';
  message: string;
  code?: number;
};

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export function handleApiResult<T>(result: ApiResult<T>): T | null {
  switch (result.kind) {
    case 'success': {
      // Narrowed to ApiSuccess<T>
      return result.data;
    }
    case 'error': {
      // Narrowed to ApiError
      console.error('API error:', result.message);
      return null;
    }
  }
}

// --- Utility types ---

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'busy';
}

// Partial<T> - make all properties optional
export type UserUpdate = Partial<User>;

// Required<T> - make all properties required (removes ?)
export type UserRequired = Required<User>;

// Readonly<T> - prevent reassignment of properties
export type UserReadonly = Readonly<User>;

// Pick<T, K> - select a subset of properties
export type UserPreview = Pick<User, 'id' | 'name'>;

// Omit<T, K> - remove a subset of properties
export type UserWithoutRole = Omit<User, 'role'>;

// Record<K, T> - object map from keys to a type
export type UserById = Record<string, UserPreview>;

export type UserStatusMap = Partial<Omit<User, 'id' | 'name'>>;

// Project model and DTO built using utility types
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planned' | 'in-progress' | 'completed';
}

// UpdateProjectDto: all updatable fields optional, id not updatable
export type UpdateProjectDto = Partial<Omit<Project, 'id'>>;

// A tiny usage example that exercises the utility types
export function applyUserUpdate(user: User, update: UserUpdate): User {
  // Using spread keeps this simple and type-safe
  const updated: User = { ...user, ...update };
  return updated;
}

// Apply an UpdateProjectDto to a Project immutably
export function applyProjectUpdate(
  project: Project,
  update: UpdateProjectDto,
): Project {
  const updated: Project = { ...project, ...update };
  return updated;
}

export function applyUserStatusUpdate(user: User, update: UserStatusMap): User {
  const updated: User = { ...user, ...update };
  return updated;
}
