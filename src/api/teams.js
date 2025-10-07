import { sql } from './db'

export async function getTeamBySlug(slug) {
  const teams = await sql`
    select id, name, slug, created_at
    from teams 
    where slug = ${slug}
  `
  return teams.length > 0 ? teams[0] : null
}

export async function createDefaultTeam() {
  // Check if default team already exists
  const existing = await sql`
    select id from teams where slug = 'default'
  `
  
  if (existing.length > 0) {
    return existing[0]
  }
  
  // Create default team
  const result = await sql`
    insert into teams (name, slug)
    values ('Default Team', 'default')
    returning id, name, slug
  `
  
  return result[0]
}

export async function getAllTeams() {
  const teams = await sql`
    select id, name, slug, created_at
    from teams 
    order by created_at desc
  `
  return teams
}
