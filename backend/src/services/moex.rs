use reqwest::Client;
use serde_json::Value;
use crate::models::moex::{ModelsData, TerminalResponse, Ticker};
use crate::services::finance::arima::Arima;
use crate::services::finance::sma::Sma;

pub(crate) struct MoexDataService {
    pub ticker: String,
    pub date_start: String,
    pub date_end: String,
    pub interval: u32,
}


impl MoexDataService {
    pub fn new(ticker: String, date_start: String, date_end: String, interval: u32) -> Self {
        Self { ticker, date_start, date_end, interval }
    }

    pub async fn get(&self) -> Result<TerminalResponse, Box<dyn std::error::Error>> {
        let api_url = self.make_url_request();
        let client = Client::new();
        let response = client.get(&api_url).send().await?;
        let response_body = response.text().await?;

        let json: Value = serde_json::from_str(&response_body)?;
        let data: Vec<Vec<Value>> = serde_json::from_value(json["candles"]["data"].clone())?;
        let close_price: Vec<f64> = data.iter().map(|v| v[1].as_f64().unwrap_or(0.0)).collect();

        // prepare service response
        let ticker_data = self.prepare_moex_data(&data);
        let models_data = self.prepare_models_data(close_price);

        if !data.is_empty() {
            Ok(
                TerminalResponse {
                    ticker: ticker_data,
                    models: models_data,
                }
            )
        } else {
            Err("No data".into())
        }
    }

    fn make_url_request(&self) -> String {
        let api_prefix = std::env::var("MOEX_DATA_BASE_URL".to_string()).unwrap_or_default();
        let json_format_data_piece = "/candles.json";
        let date_from = "?from=";
        let date_till = "&till=";
        let data_interval = "&interval=";

        format!(
            "{}{}{}{}{}{}{}{}{}",
            api_prefix, self.ticker, json_format_data_piece, date_from,
            self.date_start, date_till, self.date_end, data_interval, self.interval
        )
    }

    fn prepare_models_data(&self, close_price: Vec<f64>) -> ModelsData {
        let arima = Arima::new(close_price.clone());
        let sma_5 = Sma::new(close_price.clone(), 5);
        let sma_12 = Sma::new(close_price, 12);

        ModelsData {
            arima: arima.model_prediction_time_series(),
            sma_5: sma_5.values(),
            sma_12: sma_12.values(),
        }
    }

    fn prepare_moex_data(&self, data: &[Vec<Value>]) -> Ticker {
        Ticker {
            open: data.iter().map(|v| v[0].as_f64().unwrap_or(0.0)).collect(),
            close: data.iter().map(|v| v[1].as_f64().unwrap_or(0.0)).collect(),
            high: data.iter().map(|v| v[2].as_f64().unwrap_or(0.0)).collect(),
            low: data.iter().map(|v| v[3].as_f64().unwrap_or(0.0)).collect(),
            value: data.iter().map(|v| v[4].as_f64().unwrap_or(0.0)).collect(),
            volume: data.iter().map(|v| v[5].as_i64().unwrap_or(0)).collect(),
            begin: data.iter().map(|v| v[6].as_str().unwrap_or("").to_string()).collect(),
            end: data.iter().map(|v| v[7].as_str().unwrap_or("").to_string()).collect(),
        }
    }
}