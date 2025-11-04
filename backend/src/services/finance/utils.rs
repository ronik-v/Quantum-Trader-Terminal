pub fn mean(data: &[f64]) -> f64 {
    let sum: f64 = data.iter().sum();
    sum / data.len() as f64
}

pub fn std(data: &[f64]) -> f64 {
    let mean = mean(data);
    let variance: f64 = data.iter()
        .map(|&x| (x - mean).powi(2))
        .sum::<f64>() / data.len() as f64;
    variance.sqrt()
}