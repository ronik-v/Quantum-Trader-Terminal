use axum::{Router, routing::post};
use crate::handlers::auth::auth_handler;
use crate::AppState;

/// Api routers
pub fn auth_api_router() -> Router<AppState> {
    Router::new()
        .route("/auth", post(auth_handler))
}