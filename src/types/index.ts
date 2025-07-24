export interface MenuItem {
  id: string
  label: string
  icon?: string
  route: string
  active?: boolean
}

export interface User {
  id: number
  name: string
  email: string
  role: string
}