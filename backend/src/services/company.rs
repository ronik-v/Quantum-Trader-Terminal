use std::error::Error;
use reqwest::Client;
use serde_json::Value;
use crate::models::moex::FindCompanyResponse;

// getting ticker and meta info by finding company
pub async fn get_info_by_company_name(find_url: &str, company_name: &str) -> Result<FindCompanyResponse, Box<dyn Error>> {
    let url = format!("{}{}", find_url, company_name);
    let client = Client::new();
    let response = client.get(&url).send().await?;
    let response_body = response.text().await?;

    let json: Value = serde_json::from_str(&response_body)?;
    let data = &json["securities"]["data"];

    for item in data.as_array().ok_or("Data format error")? {
        if let Some(list) = item.as_array() {
            if list.contains(&Value::String("common_share".to_string())) {
                if let Some(_ticker) = list.get(1) {

                    return Ok(
                        FindCompanyResponse {
                            ticker: list.get(0).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                            company_name: list.get(3).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                            short_company_name: list.get(1).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                        }
                    );
                }
            }
        }
    }

    Err("Company data not found...".into())
}