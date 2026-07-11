use serde::{Deserialize, Serialize};

// === Request Definition ===
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestDefinition {
    pub id: String,
    pub collection_id: Option<String>,
    pub folder_id: Option<String>,
    pub name: String,
    pub method: String,
    pub url: String,
    pub headers: String,
    pub query_params: String,
    pub body: String,
    pub auth: String,
    pub pre_script: String,
    pub test_script: String,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

// === Collection ===
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
}

// === Folder ===
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Folder {
    pub id: String,
    pub collection_id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub sort_order: i32,
}

// === Environment ===
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Environment {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}

// === Variable ===
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Variable {
    pub id: String,
    pub environment_id: String,
    pub key: String,
    pub value: String,
    pub is_secret: bool,
    pub description: String,
    pub sort_order: i32,
}

// === History Entry ===
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub id: String,
    pub method: String,
    pub url: String,
    pub request_body: Option<String>,
    pub request_headers: String,
    pub response_status: Option<i32>,
    pub response_body: Option<String>,
    pub response_headers: Option<String>,
    pub response_time_ms: Option<i64>,
    pub response_size_bytes: Option<i64>,
    pub created_at: String,
}

// === API Response ===
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse {
    pub status_code: u16,
    pub status_text: String,
    pub headers: std::collections::HashMap<String, String>,
    pub body: String,
    pub cookies: Vec<ResponseCookie>,
    pub response_time_ms: u64,
    pub response_size_bytes: u64,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResponseCookie {
    pub name: String,
    pub value: String,
    pub domain: String,
    pub path: String,
    pub expires: String,
}
