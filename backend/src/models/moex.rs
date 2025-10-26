use serde::{Deserialize, Serialize};
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