use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS collections (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS folders (
            id TEXT PRIMARY KEY,
            collection_id TEXT NOT NULL,
            parent_id TEXT,
            name TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS requests (
            id TEXT PRIMARY KEY,
            collection_id TEXT,
            folder_id TEXT,
            name TEXT NOT NULL,
            method TEXT NOT NULL DEFAULT 'GET',
            url TEXT NOT NULL DEFAULT '',
            headers TEXT DEFAULT '[]',
            query_params TEXT DEFAULT '[]',
            body TEXT DEFAULT '{\"mode\":\"none\"}',
            auth TEXT DEFAULT '{\"type\":\"none\"}',
            pre_script TEXT DEFAULT '',
            test_script TEXT DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS environments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS variables (
            id TEXT PRIMARY KEY,
            environment_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT DEFAULT '',
            is_secret INTEGER DEFAULT 0,
            description TEXT DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY,
            method TEXT NOT NULL,
            url TEXT NOT NULL,
            request_body TEXT,
            request_headers TEXT DEFAULT '{}',
            response_status INTEGER,
            response_body TEXT,
            response_headers TEXT,
            response_time_ms INTEGER,
            response_size_bytes INTEGER,
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_requests_collection ON requests(collection_id);
        CREATE INDEX IF NOT EXISTS idx_variables_environment ON variables(environment_id);
    ")?;

    Ok(())
}
