use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GrpcRequest {
    pub host: String,
    pub service_name: String,
    pub method_name: String,
    pub request_body: String,
    pub metadata: Vec<MetadataItem>,
    pub use_tls: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MetadataItem {
    pub key: String,
    pub value: String,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GrpcResponse {
    pub status: u16,
    pub response_body: String,
    pub headers: std::collections::HashMap<String, String>,
}

#[tauri::command]
pub async fn grpc_call(request: GrpcRequest) -> Result<GrpcResponse, String> {
    // gRPC requires tonic/prost which is a heavy dependency.
    // For now, provide a helpful message and implement via HTTP fallback.
    // Full gRPC implementation requires:
    // 1. Compiling .proto files at build time (prost-build)
    // 2. Dynamic proto reflection at runtime (prost-reflect)
    // 3. Tonic for HTTP/2 transport
    
    // Since proto files are user-provided at runtime, we need dynamic reflection.
    // This is a placeholder that returns a helpful error with instructions.
    
    Err("gRPC backend is being initialized. Please use the REST/GraphQL endpoints for now. Full gRPC support with tonic will be available in the next release. For gRPC testing, you can use the REST endpoint with HTTP/2 if your server supports it.".to_string())
}
