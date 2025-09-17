export const TEAM_ID = import.meta.env.VITE_TEAM_ID || (typeof localStorage !== 'undefined' ? localStorage.getItem('teamId') : null)
export const USER_ID = import.meta.env.VITE_USER_ID || (typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null)


