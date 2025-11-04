use reqwest::Client;
use serde_json::Value;
use crate::models::moex::{GarchData, ModelsData, PredictionData, TerminalData, TerminalResponse, Ticker};
use crate::services::finance::arima::Arima;
use crate::services::finance::garch::Garch;
use crate::services::finance::prediction::{ModelsPrediction, predict};
use crate::services::finance::sma::Sma;
use crate::services::finance::utils::std;

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
        let (models_data, prediction_data) = self.prepare_models_data(close_price);

        if !data.is_empty() {
            Ok(
                TerminalResponse {
                    data: TerminalData {
                        ticker: ticker_data,
                        models: models_data,
                    },
                    prediction: prediction_data,
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

    fn prepare_models_data(&self, close_price: Vec<f64>) -> (ModelsData, PredictionData) {
        let arima = Arima::new(close_price.clone());
        let sma_5 = Sma::new(close_price.clone(), 5);
        let sma_12 = Sma::new(close_price.clone(), 12);
        let garch = Garch::new(close_price.clone());
        let (upper, lower, sigma, sigma_next) = garch.price_bounds(1.0);

        let arima_prediction = arima.model_prediction_time_series();
        let arima_log_income: f64 = arima_prediction[arima_prediction.len() - 1].ln() - arima_prediction[arima_prediction.len() - 2].ln();
        let arima_v: f64 = std(&arima_prediction).powf(2.0);

        let predict_price: f64 = predict(ModelsPrediction{
            arima_log_income,
            arima_v,
            sigma_next: sigma_next.unwrap(),
            last_close_price: *close_price.last().unwrap(),
        });

        (
            ModelsData {
            arima: arima_prediction,
            sma_5: sma_5.values(),
            sma_12: sma_12.values(),
            garch: GarchData {
                upper,
                lower,
                sigma,
                sigma_next,
            }
        },
        PredictionData {
            next_price: predict_price,
            price_diff: predict_price - *close_price.last().unwrap(),
        }
        )
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