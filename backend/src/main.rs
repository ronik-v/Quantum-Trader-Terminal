mod config;
mod db;
mod repositories;
mod models;
mod services;
mod api;
mod handlers;
mod routes;
mod utils;

use axum::Router;
use std::net::{SocketAddr, IpAddr};
use anyhow::Result;
use http::{HeaderName, HeaderValue, Method};
use http::header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE};
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber;
use crate::routes::{auth_api_router, moex_api_router};

use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::handlers::moex::{TickerQuery, ErrorBody, get_ticker_data_handler, get_ticker_by_company_name};
use crate::handlers::auth::{AuthRequest, AuthResponse};

use crate::models::moex::{Ticker};

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let cfg = config::Config::from_env();
    let pool = db::pool::create_pool(&cfg).await?;
    let state = AppState { db: pool };

    let cors = CorsLayer::new()
        .allow_origin(HeaderValue::from_str(&cfg.frontend_url).unwrap())
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS, Method::PUT, Method::DELETE])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE, ACCEPT, HeaderName::from_static("x-requested-with")])
        .allow_credentials(true);

    let app = Router::new()
        .merge(auth_api_router())
        .merge(moex_api_router())
        .merge(
            SwaggerUi::new("/swagger-ui")
                .url("/api-doc/openapi.json", ApiDoc::openapi()),
        )
        .with_state(state)
        .layer(cors);

    let ip: IpAddr = cfg.app_host.parse()?;
    let addr = SocketAddr::new(ip, cfg.app_port);
    println!("Listening on http://{}", addr);

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app.into_make_service()).await?;
    Ok(())
}

#[derive(OpenApi)]
#[openapi(
    paths(
        crate::handlers::auth::auth_handler,
        crate::handlers::moex::get_ticker_data_handler,
        crate::handlers::moex::get_ticker_by_company_name,
    ),
    components(
        schemas(
            AuthRequest,
            AuthResponse,
            Ticker,
            ErrorBody,
            TickerQuery
        )
    ),
    tags(
        (name = "Auth", description = "Authentication endpoints"),
        (name = "MOEX", description = "Endpoints for MOEX market data")
    ),
    security(
        ("bearerAuth" = [])
    )
)]
pub struct ApiDoc;
