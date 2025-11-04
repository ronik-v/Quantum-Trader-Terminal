use axum::{Router, routing::post, routing::get};
use crate::handlers::auth::auth_handler;
use crate::handlers::moex::{get_ticker_data_handler, get_ticker_by_company_name};
use crate::AppState;

/// Api routers
pub fn auth_api_router() -> Router<AppState> {
    Router::new()
        .route("/api/auth", post(auth_handler))
}

// Exchange integration api
pub fn moex_api_router() -> Router<AppState> {
    Router::new()
        .route("/api/ticker", get(get_ticker_data_handler))
        .route("/api/find", get(get_ticker_by_company_name))
}