import { sql } from './db.js'

/**
 * List all models for a team
 */
export async function listModels(teamId) {
  return await sql`
    SELECT id, name, display_order, active, created_at
    FROM models
    WHERE team_id = ${teamId} AND active = true
    ORDER BY display_order ASC, name ASC
  `
}

/**
 * Create a new model
 */
export async function createModel(teamId, name) {
  const result = await sql`
    INSERT INTO models (team_id, name)
    VALUES (${teamId}, ${name})
    RETURNING id, name, display_order, active, created_at
  `
  return result[0]
}

/**
 * Update model
 */
export async function updateModel(modelId, teamId, updates) {
  const allowed = ['name', 'display_order']
  const fields = Object.keys(updates).filter(k => allowed.includes(k))
  if (fields.length === 0) return null
  
  // Build update query dynamically based on provided fields
  if (updates.name && updates.display_order !== undefined) {
    const result = await sql`
      UPDATE models
      SET name = ${updates.name}, display_order = ${updates.display_order}
      WHERE id = ${modelId} AND team_id = ${teamId} AND active = true
      RETURNING id, name, display_order, active, created_at
    `
    return result[0]
  } else if (updates.name) {
    const result = await sql`
      UPDATE models
      SET name = ${updates.name}
      WHERE id = ${modelId} AND team_id = ${teamId} AND active = true
      RETURNING id, name, display_order, active, created_at
    `
    return result[0]
  } else if (updates.display_order !== undefined) {
    const result = await sql`
      UPDATE models
      SET display_order = ${updates.display_order}
      WHERE id = ${modelId} AND team_id = ${teamId} AND active = true
      RETURNING id, name, display_order, active, created_at
    `
    return result[0]
  }
  return null
}

/**
 * Delete (soft delete) a model
 */
export async function deleteModel(modelId, teamId) {
  const result = await sql`
    UPDATE models
    SET active = false, updated_at = now()
    WHERE id = ${modelId} AND team_id = ${teamId}
    RETURNING id
  `
  return result[0]
}

/**
 * Initialize default models for a team (if none exist)
 */
export async function initializeDefaultModels(teamId) {
  const existing = await listModels(teamId)
  if (existing.length > 0) return existing
  
  const defaultModels = [
    'Natálie',
    'Nastya',
    'Isabella',
    'Eliška',
    'Other'
  ]
  
  const created = []
  for (let i = 0; i < defaultModels.length; i++) {
    const model = await createModel(teamId, defaultModels[i])
    await sql`
      UPDATE models 
      SET display_order = ${i} 
      WHERE id = ${model.id}
    `
    created.push({ ...model, display_order: i })
  }
  
  return created
}

