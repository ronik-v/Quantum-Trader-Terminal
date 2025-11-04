const OMEGA: f64 = 0.1;
const ALPHA: f64 = 0.1;
const BETA: f64 = 0.8;

pub struct Garch {
    pub price_data: Vec<f64>,
}

impl Garch {
    pub fn new(price_data: Vec<f64>) -> Self {
        Self { price_data }
    }

    pub fn price_bounds(&self, k: f64) -> (Vec<f64>, Vec<f64>, Vec<f64>, Option<f64>) {
        let sigma2 = self.sigma2_series();
        if sigma2.is_empty() { return (vec![], vec![], vec![], None); }

        let sigma: Vec<f64> = sigma2.iter().map(|s2| s2.sqrt()).collect();

        let mut upper: Vec<f64> = Vec::with_capacity(sigma.len());
        let mut lower: Vec<f64> = Vec::with_capacity(sigma.len());

        for (i, &s) in sigma.iter().enumerate() {
            let price_idx = i + 1;
            if price_idx >= self.price_data.len() { break; }
            let p = self.price_data[price_idx];

            upper.push(p * (k * s).exp());
            lower.push(p * (-k * s).exp());
        }

        let n = sigma2.len();
        let sigma_next = if n >= 1 {
            let s_next2 = OMEGA + ALPHA * {
                let returns = self.log_returns();
                let last_return = returns[n - 1];
                let mean = returns.iter().sum::<f64>() / returns.len() as f64;
                let last_eps = last_return - mean;
                last_eps * last_eps
            } + BETA * sigma2[n - 1];
            Some(s_next2.sqrt())
        } else { None };

        (upper, lower, sigma, sigma_next)
    }

    fn sigma2_series(&self) -> Vec<f64> {
        let returns = self.log_returns();
        let eps = self.residuals(&returns);
        let n = eps.len();
        if n == 0 { return vec![]; }

        let var_eps = eps.iter().map(|v| v * v).sum::<f64>() / (n as f64);
        let tiny = 1e-16f64;

        let mut sigma2: Vec<f64> = Vec::with_capacity(n);
        sigma2.push(var_eps.max(tiny));
        for t in 1..n {
            let s2 = OMEGA + ALPHA * eps[t - 1] * eps[t - 1] + BETA * sigma2[t - 1];
            sigma2.push(s2.max(tiny));
        }

        sigma2
    }

    fn log_returns(&self) -> Vec<f64> {
        if self.price_data.len() < 2 { return vec![]; }
        let mut income = Vec::with_capacity(self.price_data.len() - 1);
        for i in 1..self.price_data.len() {
            income.push((self.price_data[i] / self.price_data[i - 1]).ln());
        }

        income
    }

    fn residuals(&self, returns: &[f64]) -> Vec<f64> {
        if returns.is_empty() { return vec![]; }
        let mean = returns.iter().sum::<f64>() / (returns.len() as f64);

        returns.iter().map(|&y| y - mean).collect()
    }
}
