mod config;
mod db;

use axum::Router;
use std::net::{SocketAddr, IpAddr};
use anyhow::Result;
use tokio::net::TcpListener;
use tracing_subscriber;

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

    let app = Router::new().with_state(state);
    let host = cfg.app_host.unwrap();
    let port = cfg.app_port.unwrap();

    let ip: IpAddr = host.parse().map_err(|e| {
        anyhow::anyhow!("failed to parse APP_HOST='{}' as IP: {}", host, e)
    })?;

    let addr = SocketAddr::new(ip, port);

    println!("Listening on http://{}", addr);

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app.into_make_service()).await?;

    Ok(())
}
