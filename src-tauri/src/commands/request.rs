use tauri::State;
use crate::db::repository;
use crate::model::ApiResponse;
use std::sync::Mutex;

pub struct DbState(pub Mutex<rusqlite::Connection>);

#[tauri::command]
pub async fn send_request(
    method: String,
    url: String,
    headers: std::collections::HashMap<String, String>,
    body: String,
) -> Result<ApiResponse, String> {
    let start = std::time::Instant::now();
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let req_method = method.parse::<reqwest::Method>().map_err(|e| e.to_string())?;

    let mut req_builder = client.request(req_method, &url);

    for (key, value) in &headers {
        req_builder = req_builder.header(key.as_str(), value.as_str());
    }

    if !body.is_empty() {
        req_builder = req_builder.body(body);
    }

    let response = req_builder.send().await.map_err(|e| e.to_string())?;

    let elapsed = start.elapsed();
    let status_code = response.status().as_u16();
    let status_text = response.status().canonical_reason().unwrap_or("Unknown").to_string();

    let resp_headers: std::collections::HashMap<String, String> = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();

    let resp_body = response.text().await.map_err(|e| e.to_string())?;
    let size = resp_body.len() as u64;

    // Parse cookies
    let cookies = parse_cookies(&resp_headers);

    Ok(ApiResponse {
        status_code,
        status_text,
        headers: resp_headers,
        body: resp_body,
        cookies,
        response_time_ms: elapsed.as_millis() as u64,
        response_size_bytes: size,
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

fn parse_cookies(headers: &std::collections::HashMap<String, String>) -> Vec<crate::model::ResponseCookie> {
    let mut cookies = Vec::new();
    for (key, value) in headers {
        if key.to_lowercase() == "set-cookie" {
            let parts: Vec<&str> = value.split(';').collect();
            if let Some(first) = parts.first() {
                let kv: Vec<&str> = first.split('=').collect();
                let mut cookie = crate::model::ResponseCookie {
                    name: kv.first().unwrap_or(&"").trim().to_string(),
                    value: kv.get(1).unwrap_or(&"").trim().to_string(),
                    domain: String::new(),
                    path: String::new(),
                    expires: String::new(),
                };
                for part in parts.iter().skip(1) {
                    let p = part.trim();
                    if let Some(val) = p.strip_prefix("domain=") {
                        cookie.domain = val.to_string();
                    } else if let Some(val) = p.strip_prefix("path=") {
                        cookie.path = val.to_string();
                    } else if let Some(val) = p.strip_prefix("expires=") {
                        cookie.expires = val.to_string();
                    }
                }
                cookies.push(cookie);
            }
        }
    }
    cookies
}
