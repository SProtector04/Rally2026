export type Role = 'admin' | 'volunteer'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  joinedAt: string
}

export type ActuatorType = 'valve' | 'pump' | 'gate' | 'aerator'
export type ActuatorState = 'active' | 'idle' | 'error'

export interface Actuator {
  id: string
  name: string
  type: ActuatorType
  state: ActuatorState
  latitude: number
  longitude: number
  lastAction: string
  description: string
}

export type PostType = 'qa' | 'proposal' | 'task'

export interface ForumPost {
  id: string
  author: string
  title: string
  body: string
  type: PostType
  votes: number
  myVote: -1 | 0 | 1
  replies: number
  createdAt: string
}

export interface PollOption {
  id: string
  label: string
  votes: number
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  myOptionId: string | null
  closed: boolean
}

export interface ScheduleEntry {
  id: string
  day: number
  start: string
  end: string
  task: string
  location: string
}

export interface AlertPreference {
  id: string
  label: string
  description: string
  enabled: boolean
}
