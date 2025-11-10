use axum::{extract::{State, Query}, Json};
use axum::http::{HeaderMap, StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use utoipa::{IntoParams, ToSchema};
use crate::{AppState, api::{ApiResponse, ApiError}, config};
use crate::repositories::user::UserRepository;
use crate::models::moex::{FindCompanyResponse, TerminalData, TerminalResponse};
use crate::services::company::get_info_by_company_name;
use crate::services::moex::MoexDataService;
use crate::utils::{check_token_error, checking_user};

#[derive(Debug, Deserialize, IntoParams, ToSchema)]
pub struct TickerQuery {
    pub ticker: String,
    pub date_from: String,
    pub date_till: String,
    pub interval: u32,
}

#[derive(Debug, Deserialize, IntoParams, ToSchema)]
pub struct FindCompanyQuery {
    pub company_name: String,
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
        (status = 200, description = "Successfully fetched ticker data", body = TerminalResponse),
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
) -> Result<Json<TerminalResponse>, (StatusCode, Json<ErrorBody>)> {
    let token = check_token_error(&headers)?;
    let _ = checking_user(&state, token).await;

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


#[utoipa::path(
    get,
    path = "/api/find",
    params(FindCompanyQuery),
    responses(
        (status = 200, description = "Company found", body = FindCompanyResponse),
        (status = 400, description = "No data by this name", body = ErrorBody),
        (status = 401, description = "Unauthorized — missing or invalid token", body = ErrorBody),
        (status = 500, description = "Internal server error", body = ErrorBody)
    ),
    security(
        ("bearerAuth" = [])
    ),
    tag = "MOEX"
)]
pub async fn get_ticker_by_company_name(
    State(state): State<AppState>,
    Query(query): Query<FindCompanyQuery>,
    headers: HeaderMap,
) -> Result<Json<FindCompanyResponse>, (StatusCode, Json<ErrorBody>)> {
    let token = check_token_error(&headers)?;
    let _ = checking_user(&state, token).await;
    let cfg = config::Config::from_env();

    let company_info = get_info_by_company_name(cfg.moex_find_company_url.as_str(), query.company_name.as_str()).await
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ErrorBody { error: format!("No data by this name: {}", e) })))?;

    Ok(Json(company_info))
}