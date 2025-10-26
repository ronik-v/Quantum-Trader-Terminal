use axum::http::HeaderMap;
use axum::http::header::AUTHORIZATION;

// getting auth token from header
pub fn extract_bearer_token(headers: &HeaderMap) -> Option<String> {
    if let Some(value) = headers.get(AUTHORIZATION) {
        if let Ok(s) = value.to_str() {
            let s = s.trim();
            if let Some(rest) = s.strip_prefix("Bearer ") {
                return Some(rest.to_string());
            }

            if let Some(rest) = s.strip_prefix("bearer ") {
                return Some(rest.to_string());
            }
        }
    }
    None
}