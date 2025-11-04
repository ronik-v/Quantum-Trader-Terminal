pub struct ModelsPrediction {
    pub arima_log_income: f64,
    pub arima_v: f64,
    pub sigma_next: f64,
    pub last_close_price: f64,
}

pub fn predict(models_data: ModelsPrediction) -> f64 {
    let w_arima: f64 = models_data.sigma_next / (models_data.arima_v + models_data.sigma_next);
    let w_garch: f64 = 1.0 - w_arima;

    (models_data.arima_log_income * w_arima + w_garch) + models_data.last_close_price
}