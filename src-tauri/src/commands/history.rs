use tauri::State;
use crate::commands::request::DbState;
use crate::db::repository;
use crate::model::HistoryEntry;

#[tauri::command]
pub fn get_history(state: State<DbState>) -> Result<Vec<HistoryEntry>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    repository::get_all_history(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_history(state: State<DbState>, entry: HistoryEntry) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    repository::save_history(&conn, &entry).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_history(state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    repository::clear_history(&conn).map_err(|e| e.to_string())
}
