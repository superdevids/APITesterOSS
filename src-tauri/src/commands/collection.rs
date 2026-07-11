use tauri::State;
use crate::commands::request::DbState;
use crate::db::repository;
use crate::model::*;

#[tauri::command]
pub fn get_collections(state: State<DbState>) -> Result<serde_json::Value, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let collections = repository::get_all_collections(&conn).map_err(|e| e.to_string())?;
    let folders = repository::get_all_folders(&conn).map_err(|e| e.to_string())?;
    let requests = repository::get_all_requests(&conn).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "collections": collections,
        "folders": folders,
        "requests": requests
    }))
}

#[tauri::command]
pub fn create_collection(state: State<DbState>, name: String, description: String) -> Result<Collection, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    repository::create_collection(&conn, &name, &description).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_collection(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    repository::delete_collection(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_request(state: State<DbState>, request: RequestDefinition) -> Result<RequestDefinition, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    repository::save_request(&conn, &request).map_err(|e| e.to_string())
}
