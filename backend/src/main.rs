mod config;
mod db;
mod repositories;
mod models;
mod services;
mod api;
mod handlers;
mod routes;

use axum::Router;
use std::net::{SocketAddr, IpAddr};
use anyhow::Result;
use tokio::net::TcpListener;
use tracing_subscriber;
use crate::routes::auth_api_router;

use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

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

    let app = Router::new()
        .merge(auth_api_router())
        .merge(SwaggerUi::new("/swagger-ui").url("/api-doc/openapi.json", ApiDoc::openapi()))
        .with_state(state);

    let ip: IpAddr = cfg.app_host.parse()?;
    let addr = SocketAddr::new(ip, cfg.app_port);
    println!("Listening on http://{}", addr);

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app.into_make_service()).await?;
    Ok(())
}

#[derive(OpenApi)]
#[openapi(paths(crate::handlers::auth::auth_handler_openapi), components(schemas(crate::handlers::auth::AuthRequest, crate::handlers::auth::AuthResponse)))]
pub struct ApiDoc;
