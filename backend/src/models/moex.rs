use serde::{Deserialize, Serialize};
use tracing_subscriber::registry::Data;
use utoipa::ToSchema;

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct Ticker {
    // Ticker data from MOEX API
    pub open: Vec<f64>,
    pub close: Vec<f64>,
    pub high: Vec<f64>,
    pub low: Vec<f64>,
    pub value: Vec<f64>,
    pub volume: Vec<i64>,
    pub begin: Vec<String>,
    pub end: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct GarchData {
    pub upper: Vec<f64>,
    pub lower: Vec<f64>,
    pub sigma: Vec<f64>,
    pub sigma_next: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ModelsData {
    pub arima: Vec<f64>,
    pub sma_5: Vec<f64>,
    pub sma_12: Vec<f64>,
    pub garch: GarchData,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TerminalData {
    pub ticker: Ticker,
    pub models: ModelsData,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PredictionData {
    pub next_price: f64,
    pub price_diff: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TerminalResponse {
    pub data: TerminalData,
    pub prediction: PredictionData,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct FindCompanyResponse {
    pub ticker: String,
    pub company_name: String,
    pub short_company_name: String,
}