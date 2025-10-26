use axum::{extract::{State, Query}, Json};
use axum::http::{HeaderMap, StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use utoipa::{IntoParams, ToSchema};
use crate::{AppState, api::{ApiResponse, ApiError}};
use crate::repositories::user::UserRepository;
use crate::models::moex::Ticker;
use crate::services::moex::MoexDataService;
use crate::utils::extract_bearer_token;

#[derive(Debug, Deserialize, IntoParams, ToSchema)]
pub struct TickerQuery {
    pub ticker: String,
    pub date_from: String,
    pub date_till: String,
    pub interval: u32,
}

#[derive(Serialize, ToSchema)]
pub struct ErrorBody {
    pub error: String,
}

#[utoipa::path(
    get,
    path = "/api/ticker",
    params(TickerQuery),
    responses(
        (status = 200, description = "Successfully fetched ticker data", body = Ticker),
        (status = 401, description = "Unauthorized — missing or invalid token", body = ErrorBody),
        (status = 500, description = "Internal server error", body = ErrorBody)
    ),
    security(
        ("bearerAuth" = [])
    ),
    tag = "MOEX"
)]
pub async fn get_ticker_data_handler(
    State(state): State<AppState>,
    Query(query): Query<TickerQuery>,
    headers: HeaderMap,
) -> Result<Json<Ticker>, (StatusCode, Json<ErrorBody>)> {
    let token = match extract_bearer_token(&headers) {
        Some(t) => t,
        None => {
            return Err((StatusCode::UNAUTHORIZED, Json(ErrorBody { error: "No token".into() })));
        }
    };
    let repo = UserRepository::new(&state.db);
    let maybe_user = repo
        .find_user_by_token(&token)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorBody { error: format!("DB error: {}", e) })))?;

    match maybe_user {
        Some(u) => u,
        None => return Err((StatusCode::UNAUTHORIZED, Json(ErrorBody { error: "Invalid token".into() }))),
    };

    let svc = MoexDataService::new(
        query.ticker.clone(),
        query.date_from.clone(),
        query.date_till.clone(),
        query.interval,
    );

    let ticker = svc.get().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorBody { error: format!("MOEX error: {}", e) })))?;
    Ok(Json(ticker))
}