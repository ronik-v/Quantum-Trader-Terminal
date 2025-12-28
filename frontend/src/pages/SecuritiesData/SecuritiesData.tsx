import {type JSX, useState} from 'react';
import { Chart as ChartComponent } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import {
    CandlestickController,
    CandlestickElement,
} from 'chartjs-chart-financial';
import styles from './SecuritiesData.module.css';
import type {FindCompanyResponse, TickerApiResponse} from "../../api/stockData/types.ts";
import type {StockDataService} from "../../api/stockData/module.ts";
import {ApiServiceFactory} from "../../api/connection.ts";
import {Footer} from "../../components/Footer/Footer.tsx";
import {UserUtils} from "../../utils/user.ts";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    CandlestickController,
    CandlestickElement
);

export function SecuritiesData(): JSX.Element {
    const [companyName, setCompanyName] = useState<string>('');
    const [tickerInfo, setTickerInfo] = useState<FindCompanyResponse | null>(null);
    const [error, setError] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTill, setDateTill] = useState<string>('');
    const [interval, setInterval] = useState<string>('24');
    const [data, setData] = useState<TickerApiResponse | null>(null);
    const [graphType, setGraphType] = useState<string>('normal');
    const userUtils = new UserUtils();

    async function handleSearch() {
        setError('');
        setTickerInfo(null);
        setData(null);
        const stockService: StockDataService = ApiServiceFactory.stockService(userUtils.getToken());
        const res = await stockService.findByCompanyName(companyName);
        if ('error' in res) {
            setError((res as { error: string }).error);
        } else {
            setTickerInfo(res as FindCompanyResponse);
        }
    }

    async function handleFetch() {
        if (!tickerInfo) return;
        setError('');
        setData(null);
        const stockService: StockDataService = ApiServiceFactory.stockService(userUtils.getToken());
        const res = await stockService.getTickerData(tickerInfo.ticker, dateFrom, dateTill, interval);
        if ('error' in res) {
            setError((res as { error: string }).error);
        } else {
            setData(res as TickerApiResponse);
        }
    }

    let chartData = {
        labels: [],
        datasets: [],
    };
    if (data) {
        const labels = data.data.ticker.begin;
        let datasets: any[] = [];
        if (graphType === 'normal') {
            datasets = [
                {
                    label: 'Open',
                    data: data.data.ticker.open,
                    borderColor: 'cyan',
                    backgroundColor: 'rgba(0, 255, 255, 0.5)',
                    type: 'line',
                },
                {
                    label: 'Close',
                    data: data.data.ticker.close,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0, 0, 255, 0.5)',
                    type: 'line',
                },
                {
                    label: 'High',
                    data: data.data.ticker.high,
                    borderColor: 'green',
                    backgroundColor: 'rgba(0, 255, 0, 0.5)',
                    type: 'line',
                },
                {
                    label: 'Low',
                    data: data.data.ticker.low,
                    borderColor: 'red',
                    backgroundColor: 'rgba(255, 0, 0, 0.5)',
                    type: 'line',
                },
            ];
        } else {
            const candleData = labels.map((label, i) => ({
                x: label,
                o: data.data.ticker.open[i],
                h: data.data.ticker.high[i],
                l: data.data.ticker.low[i],
                c: data.data.ticker.close[i],
            }));
            datasets = [
                {
                    label: 'Candlestick',
                    data: candleData,
                    type: 'candlestick',
                    color: {
                        up: 'rgba(0, 255, 0, 0.5)',
                        down: 'rgba(255, 0, 0, 0.5)',
                        unchanged: 'rgba(255, 255, 255, 0.5)',
                    },
                    borderColor: {
                        up: 'green',
                        down: 'red',
                        unchanged: 'white',
                    },
                },
            ];
        }

        if (data.data.models.arima) {
            // @ts-ignore
            datasets.push({
                label: 'ARIMA',
                data: [null, ...data.data.models.arima],
                borderColor: 'magenta',
                backgroundColor: 'rgba(255, 0, 255, 0.5)',
                type: 'line',
            });
        }

        if (data.data.models.sma_5) {
            datasets.push({
                label: 'SMA 5',
                data: [...Array(labels.length - data.data.models.sma_5.length).fill(null), ...data.data.models.sma_5],
                borderColor: 'purple',
                backgroundColor: 'rgba(128, 0, 128, 0.5)',
                type: 'line',
            });
        }

        if (data.data.models.sma_12 && data.data.models.sma_12.length > 0) {
            datasets.push({
                label: 'SMA 12',
                data: [...Array(labels.length - data.data.models.sma_12.length).fill(null), ...data.data.models.sma_12],
                borderColor: 'orange',
                backgroundColor: 'rgba(255, 165, 0, 0.5)',
                type: 'line',
            });
        }

        if (data.data.models.garch) {
            // @ts-ignore
            datasets.push({
                label: 'GARCH Upper',
                data: [null, ...data.data.models.garch.upper],
                borderColor: 'lime',
                backgroundColor: 'rgba(0, 255, 0, 0.2)',
                type: 'line',
            });
            // @ts-ignore
            datasets.push({
                label: 'GARCH Lower',
                data: [null, ...data.data.models.garch.lower],
                borderColor: 'maroon',
                backgroundColor: 'rgba(128, 0, 0, 0.2)',
                type: 'line',
            });
        }

        chartData = {
            labels,
            datasets,
        };
    }

    return (
        <div>
            <div className={styles.securitiesPage}>
                <div className={styles.chartWrapper}>
                    <div className={styles.securitiesForm}>
                        <div className={styles.searchContainer}>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Enter company name"
                                className={styles.securitiesInput}
                            />
                            <button onClick={handleSearch} className={styles.securitiesBtn}>Search Ticker</button>
                        </div>
                        {error && <p className={styles.securitiesError}>{error}</p>}
                        {tickerInfo && (
                            <h2 className={styles.securitiesTitle}>{tickerInfo.company_name} ({tickerInfo.short_company_name})</h2>
                        )}
                        {tickerInfo && (
                            <div className={styles.filtersContainer}>
                                <label className={styles.securitiesLabel}>
                                    Date From:
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className={styles.securitiesInput}
                                    />
                                </label>
                                <label className={styles.securitiesLabel}>
                                    Date Till:
                                    <input
                                        type="date"
                                        value={dateTill}
                                        onChange={(e) => setDateTill(e.target.value)}
                                        className={styles.securitiesInput}
                                    />
                                </label>
                                <label className={styles.securitiesLabel}>
                                    Interval:
                                    <select value={interval} onChange={(e) => setInterval(e.target.value)} className={styles.securitiesSelect}>
                                        <option value="1">1 Minute</option>
                                        <option value="10">10 Minutes</option>
                                        <option value="60">1 Hour</option>
                                        <option value="24">1 Day</option>
                                        <option value="7">1 Week</option>
                                        <option value="31">1 Month</option>
                                        <option value="4">1 Quarter</option>
                                    </select>
                                </label>
                            </div>
                        )}
                        {tickerInfo && (
                            <button onClick={handleFetch} className={styles.securitiesBtn}>Fetch Data</button>
                        )}
                    </div>
                    <div className={styles.securitiesChartContainer}>
                        {tickerInfo && (
                            <button onClick={() => setGraphType(graphType === 'normal' ? 'candlestick' : 'normal')} className={styles.securitiesBtn}>
                                Switch to {graphType === 'normal' ? 'Candlestick' : 'Line'}
                            </button>
                        )}
                        <ChartComponent
                            data={chartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'bottom' },
                                    title: {
                                        display: true,
                                        text: 'Stock Data Chart',
                                        font: { size: 20 },
                                    },
                                },
                                scales: {
                                    x: {
                                        title: { display: true, text: 'Date' },
                                        ticks: { font: { size: 10 } },
                                        grid: { display: true },
                                    },
                                    y: {
                                        title: { display: true, text: 'Price' },
                                        ticks: { font: { size: 10 } },
                                        grid: { display: true },
                                    },
                                },
                            }}
                        />
                        {data && data.prediction && (
                            <div className={styles.securitiesPrediction}>
                                <h3>Price Prediction</h3>
                                <p>Next Price: {data.prediction.next_price.toFixed(2)}</p>
                                <p>
                                    Price Diff: {data.prediction.price_diff.toFixed(2)}
                                    <span className={data.prediction.price_diff > 0 ? styles.up : styles.down}>
                                        {data.prediction.price_diff > 0 ? ' ↑' : ' ↓'}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}