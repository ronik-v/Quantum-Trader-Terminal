use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use crate::{AppState, repositories::user::UserRepository, services::user::UserService, api::ApiResponse};
use serde_json::json;

#[derive(Deserialize, ToSchema)]
pub struct AuthRequest {
    pub username: String,
    pub password: String,
}

#[derive(Serialize, ToSchema)]
pub struct AuthResponse {
    pub username: String,
    pub token: String,
}

#[utoipa::path(
    post,
    path = "/api/auth",
    request_body = AuthRequest,
    responses(
        (status = 200, description = "User authenticated", body = AuthResponse),
        (status = 401, description = "Invalid credentials")
    ),
    security(),
    tag = "Auth"
)]
pub async fn auth_handler(
    State(state): State<AppState>,
    Json(payload): Json<AuthRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, crate::api::ApiError> {
    let repo = UserRepository::new(&state.db);
    let salt = std::env::var("PASSWORD_SALT".to_string()).unwrap_or_default();
    let service = UserService::new(repo, salt);

    let token = service.auth(&payload.username, &payload.password).await?;

    let data = json!({ "username": payload.username });
    let meta = json!({ "token": token });

    Ok(Json(ApiResponse { data, meta: Some(meta) }))
}
