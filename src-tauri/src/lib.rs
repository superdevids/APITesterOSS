mod commands;
mod db;
mod model;

use commands::request::DbState;
use db::migration;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize SQLite database
    let conn = init_database();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(DbState(Mutex::new(conn)))
        .invoke_handler(tauri::generate_handler![
            commands::request::send_request,
            commands::collection::get_collections,
            commands::collection::create_collection,
            commands::collection::delete_collection,
            commands::collection::save_request,
            commands::environment::get_environments,
            commands::environment::create_environment,
            commands::history::get_history,
            commands::history::save_history,
            commands::history::clear_history,
            commands::grpc::grpc_call,
        ])
        .run(tauri::generate_context!())
        .expect("error while running APITesterOSS");
}

fn init_database() -> rusqlite::Connection {
    let app_dir = get_app_dir();
    std::fs::create_dir_all(&app_dir).expect("Failed to create app directory");

    let db_path = format!("{}/api_tester.db", app_dir);
    let conn = rusqlite::Connection::open(&db_path)
        .expect("Failed to open database");

    // Enable WAL mode for performance
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
        .expect("Failed to set PRAGMAs");

    migration::run_migrations(&conn).expect("Failed to run migrations");

    conn
}

fn get_app_dir() -> String {
    #[cfg(target_os = "windows")]
    {
        let path = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
        format!("{}/api-tester-oss", path)
    }
    #[cfg(target_os = "macos")]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        format!("{}/Library/Application Support/api-tester-oss", home)
    }
    #[cfg(target_os = "linux")]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        format!("{}/.local/share/api-tester-oss", home)
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        ".".to_string()
    }
}
