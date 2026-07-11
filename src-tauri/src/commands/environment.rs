use tauri::State;
use crate::commands::request::DbState;
use crate::db::repository;
use crate::model::*;

#[tauri::command]
pub fn get_environments(state: State<DbState>) -> Result<serde_json::Value, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let environments = repository::get_all_environments(&conn).map_err(|e| e.to_string())?;
    let variables = repository::get_all_variables(&conn).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "environments": environments,
        "variables": variables
    }))
}

#[tauri::command]
pub fn create_environment(state: State<DbState>, name: String) -> Result<Environment, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    repository::create_environment(&conn, &name).map_err(|e| e.to_string())
}
