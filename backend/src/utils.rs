use axum::http::{HeaderMap, StatusCode};
use axum::http::header::AUTHORIZATION;
use axum::Json;
use crate::AppState;
use crate::handlers::moex::ErrorBody;
use crate::models::user::User;
use crate::repositories::user::UserRepository;

// getting auth token from header
fn extract_bearer_token(headers: &HeaderMap) -> Option<String> {
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

pub fn check_token_error(headers: &HeaderMap) -> Result<String, (StatusCode, Json<ErrorBody>)> {
    return match extract_bearer_token(&headers) {
        Some(t) => Ok(t),
        None => {
            return Err((StatusCode::UNAUTHORIZED, Json(ErrorBody { error: "No token".into() })));
        }
    }
}

pub async fn checking_user(state: &AppState, token: String) -> Result<User, (StatusCode, Json<ErrorBody>)> {
    let repo = UserRepository::new(&state.db);
    let maybe_user = repo
        .find_user_by_token(token.as_str())
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorBody { error: format!("DB error: {}", e) })))?;

    match maybe_user {
        Some(u) => Ok(u),
        None => Err((StatusCode::UNAUTHORIZED, Json(ErrorBody { error: "Invalid token".into() }))),
    }
}
