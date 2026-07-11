use rusqlite::{params, Connection, Result};
use crate::model::*;

// === Collections ===
pub fn get_all_collections(conn: &Connection) -> Result<Vec<Collection>> {
    let mut stmt = conn.prepare("SELECT id, name, description, created_at, updated_at FROM collections ORDER BY created_at")?;
    let rows = stmt.query_map([], |row| {
        Ok(Collection {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })?;
    rows.collect()
}

pub fn create_collection(conn: &Connection, name: &str, description: &str) -> Result<Collection> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO collections (id, name, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, name, description, now, now],
    )?;
    Ok(Collection { id, name: name.to_string(), description: description.to_string(), created_at: now.clone(), updated_at: now })
}

pub fn delete_collection(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM collections WHERE id = ?1", params![id])?;
    Ok(())
}

// === Folders ===
pub fn get_all_folders(conn: &Connection) -> Result<Vec<Folder>> {
    let mut stmt = conn.prepare("SELECT id, collection_id, parent_id, name, sort_order FROM folders ORDER BY sort_order")?;
    let rows = stmt.query_map([], |row| {
        Ok(Folder {
            id: row.get(0)?,
            collection_id: row.get(1)?,
            parent_id: row.get(2)?,
            name: row.get(3)?,
            sort_order: row.get(4)?,
        })
    })?;
    rows.collect()
}

// === Requests ===
pub fn get_all_requests(conn: &Connection) -> Result<Vec<RequestDefinition>> {
    let mut stmt = conn.prepare(
        "SELECT id, collection_id, folder_id, name, method, url, headers, query_params, body, auth, pre_script, test_script, sort_order, created_at, updated_at FROM requests ORDER BY sort_order"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(RequestDefinition {
            id: row.get(0)?,
            collection_id: row.get(1)?,
            folder_id: row.get(2)?,
            name: row.get(3)?,
            method: row.get(4)?,
            url: row.get(5)?,
            headers: row.get(6)?,
            query_params: row.get(7)?,
            body: row.get(8)?,
            auth: row.get(9)?,
            pre_script: row.get(10)?,
            test_script: row.get(11)?,
            sort_order: row.get(12)?,
            created_at: row.get(13)?,
            updated_at: row.get(14)?,
        })
    })?;
    rows.collect()
}

pub fn save_request(conn: &Connection, req: &RequestDefinition) -> Result<RequestDefinition> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO requests (id, collection_id, folder_id, name, method, url, headers, query_params, body, auth, pre_script, test_script, sort_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
         ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, method=excluded.method, url=excluded.url,
            headers=excluded.headers, query_params=excluded.query_params,
            body=excluded.body, auth=excluded.auth,
            pre_script=excluded.pre_script, test_script=excluded.test_script,
            sort_order=excluded.sort_order, updated_at=excluded.updated_at",
        params![
            req.id, req.collection_id, req.folder_id, req.name, req.method,
            req.url, req.headers, req.query_params, req.body, req.auth,
            req.pre_script, req.test_script, req.sort_order, req.created_at, now
        ],
    )?;
    let mut saved = req.clone();
    saved.updated_at = now;
    Ok(saved)
}

// === Environments ===
pub fn get_all_environments(conn: &Connection) -> Result<Vec<Environment>> {
    let mut stmt = conn.prepare("SELECT id, name, created_at, updated_at FROM environments ORDER BY created_at")?;
    let rows = stmt.query_map([], |row| {
        Ok(Environment {
            id: row.get(0)?,
            name: row.get(1)?,
            created_at: row.get(2)?,
            updated_at: row.get(3)?,
        })
    })?;
    rows.collect()
}

pub fn create_environment(conn: &Connection, name: &str) -> Result<Environment> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO environments (id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, name, now, now],
    )?;
    Ok(Environment { id, name: name.to_string(), created_at: now.clone(), updated_at: now })
}

// === Variables ===
pub fn get_all_variables(conn: &Connection) -> Result<Vec<Variable>> {
    let mut stmt = conn.prepare("SELECT id, environment_id, key, value, is_secret, description, sort_order FROM variables ORDER BY sort_order")?;
    let rows = stmt.query_map([], |row| {
        Ok(Variable {
            id: row.get(0)?,
            environment_id: row.get(1)?,
            key: row.get(2)?,
            value: row.get(3)?,
            is_secret: row.get::<_, i32>(4)? != 0,
            description: row.get(5)?,
            sort_order: row.get(6)?,
        })
    })?;
    rows.collect()
}

// === History ===
pub fn get_all_history(conn: &Connection) -> Result<Vec<HistoryEntry>> {
    let mut stmt = conn.prepare(
        "SELECT id, method, url, request_body, request_headers, response_status, response_body, response_headers, response_time_ms, response_size_bytes, created_at FROM history ORDER BY created_at DESC LIMIT 500"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(HistoryEntry {
            id: row.get(0)?,
            method: row.get(1)?,
            url: row.get(2)?,
            request_body: row.get(3)?,
            request_headers: row.get(4)?,
            response_status: row.get(5)?,
            response_body: row.get(6)?,
            response_headers: row.get(7)?,
            response_time_ms: row.get(8)?,
            response_size_bytes: row.get(9)?,
            created_at: row.get(10)?,
        })
    })?;
    rows.collect()
}

pub fn save_history(conn: &Connection, entry: &HistoryEntry) -> Result<()> {
    conn.execute(
        "INSERT INTO history (id, method, url, request_body, request_headers, response_status, response_body, response_headers, response_time_ms, response_size_bytes, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            entry.id, entry.method, entry.url, entry.request_body,
            entry.request_headers, entry.response_status, entry.response_body,
            entry.response_headers, entry.response_time_ms, entry.response_size_bytes,
            entry.created_at
        ],
    )?;
    Ok(())
}

pub fn clear_history(conn: &Connection) -> Result<()> {
    conn.execute("DELETE FROM history", [])?;
    Ok(())
}
