export interface UserCreatedEvent {
  id: string
  email: string
  username: string
  timestamp: Date
}

export interface UserUpdatedEvent {
  id: string
  changes: Partial<{
    email: string
    username: string
  }>
  timestamp: Date
}

export interface UserDeletedEvent {
  id: string
  timestamp: Date
}
