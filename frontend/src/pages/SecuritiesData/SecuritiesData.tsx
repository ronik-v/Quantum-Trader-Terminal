import {type JSX, useState, useEffect} from 'react';
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
    TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
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
    TimeScale,
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
    const [graphType, setGraphType] = useState<'normal' | 'candlestick'>('normal');
    const [showPrediction, setShowPrediction] = useState<boolean>(true);
    const userUtils = new UserUtils();

    const [chartData, setChartData] = useState<any>({
        labels: [],
        datasets: [],
    });
    const [stockInfo, setStockInfo] = useState<any>(null);

    async function handleSearch() {
        setError('');
        setTickerInfo(null);
        setData(null);
        setStockInfo(null);
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
        setStockInfo(null);
        const stockService: StockDataService = ApiServiceFactory.stockService(userUtils.getToken());
        const res = await stockService.getTickerData(tickerInfo.ticker, dateFrom, dateTill, interval);
        if ('error' in res) {
            setError((res as { error: string }).error);
        } else {
            setData(res as TickerApiResponse);
        }
    }

    useEffect(() => {
        if (!data || data.data.ticker.begin.length === 0) {
            setChartData({ labels: [], datasets: [] });
            setStockInfo(null);
            return;
        }

        const labels = data.data.ticker.begin;
        const datasets: any[] = [];

        if (graphType === 'normal') {
            datasets.push(
                { label: 'Open', data: data.data.ticker.open, borderColor: 'cyan', backgroundColor: 'rgba(0, 255, 255, 0.2)', fill: false, tension: 0.4 },
                { label: 'Close', data: data.data.ticker.close, borderColor: 'blue', backgroundColor: 'rgba(0, 0, 255, 0.2)', fill: false, tension: 0.4 },
                { label: 'High', data: data.data.ticker.high, borderColor: 'green', backgroundColor: 'rgba(0, 255, 0, 0.2)', fill: false, tension: 0.4 },
                { label: 'Low', data: data.data.ticker.low, borderColor: 'red', backgroundColor: 'rgba(255, 0, 0, 0.2)', fill: false, tension: 0.4 }
            );
        } else {
            // Правильный формат для candlestick в chartjs-chart-financial
            const candleData = labels.map((label, i) => ({
                x: label,
                o: data.data.ticker.open[i],
                h: data.data.ticker.high[i],
                l: data.data.ticker.low[i],
                c: data.data.ticker.close[i],
            }));
            datasets.push({
                type: 'candlestick',
                label: 'Candlestick',
                data: candleData,
            });
        }

        if (data.data.models.arima) {
            datasets.push({
                label: 'ARIMA',
                data: data.data.models.arima,
                borderColor: 'magenta',
                backgroundColor: 'rgba(255, 0, 255, 0.2)',
                fill: false,
                tension: 0.4,
                pointRadius: 0,
            });
        }

        if (data.data.models.sma_5) {
            datasets.push({
                label: 'SMA 5',
                data: data.data.models.sma_5,
                borderColor: 'purple',
                backgroundColor: 'rgba(128, 0, 128, 0.2)',
                fill: false,
                tension: 0.4,
                pointRadius: 0,
            });
        }

        if (data.data.models.sma_12 && data.data.models.sma_12.length > 0) {
            datasets.push({
                label: 'SMA 12',
                data: data.data.models.sma_12,
                borderColor: 'orange',
                backgroundColor: 'rgba(255, 165, 0, 0.2)',
                fill: false,
                tension: 0.4,
                pointRadius: 0,
            });
        }

        if (data.data.models.garch) {
            datasets.push({
                label: 'GARCH Upper',
                data: data.data.models.garch.upper,
                borderColor: 'lime',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                fill: false,
                tension: 0.4,
                pointRadius: 0,
            });
            datasets.push({
                label: 'GARCH Lower',
                data: data.data.models.garch.lower,
                borderColor: 'maroon',
                backgroundColor: 'rgba(128, 0, 0, 0.1)',
                fill: false,
                tension: 0.4,
                pointRadius: 0,
            });
        }

        setChartData({ labels, datasets });

        // Вычисляем информацию для верхней панели
        const length = data.data.ticker.close.length;
        if (length > 1) {
            const lastClose = data.data.ticker.close[length - 1];
            const prevClose = data.data.ticker.close[length - 2];
            const priceChange = lastClose - prevClose;
            const priceChangePercent = (priceChange / prevClose) * 100;

            setStockInfo({
                lastClose,
                lastOpen: data.data.ticker.open[length - 1],
                lastHigh: data.data.ticker.high[length - 1],
                lastLow: data.data.ticker.low[length - 1],
                lastVolume: data.data.ticker.volume[length - 1],
                priceChange,
                priceChangePercent,
            });
        }
    }, [data, graphType]);

    const hasData = chartData.datasets.length > 0 && chartData.labels.length > 0;

    return (
        <div className={styles.securitiesPage}>
            <div className={styles.chartWrapper}>
                <div className={styles.securitiesHeader}>
                    <div className={styles.headerInfo}>
                        <div className={styles.searchContainer}>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Search stock..."
                                className={styles.securitiesInput}
                            />
                            <button onClick={handleSearch} className={styles.securitiesBtn}>Search</button>
                        </div>
                        {tickerInfo && hasData && stockInfo && (
                            <div className={styles.stockInfo}>
                                <span className={styles.stockName}>{tickerInfo.company_name}</span>
                                <span className={styles.stockPrice}>{stockInfo.lastClose.toFixed(2)} RUB</span>
                                <span className={stockInfo.priceChange > 0 ? styles.positiveChange : styles.negativeChange}>
                                    {stockInfo.priceChange.toFixed(2)} ({stockInfo.priceChangePercent.toFixed(2)}%)
                                </span>
                                <span className={styles.stockDetail}>Open: {stockInfo.lastOpen.toFixed(2)}</span>
                                <span className={styles.stockDetail}>High: {stockInfo.lastHigh.toFixed(2)}</span>
                                <span className={styles.stockDetail}>Low: {stockInfo.lastLow.toFixed(2)}</span>
                                <span className={styles.stockDetail}>Vol: {stockInfo.lastVolume}</span>
                            </div>
                        )}
                        {tickerInfo && (
                            <div className={styles.filtersContainer}>
                                <label className={styles.securitiesLabel}>
                                    From:
                                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={styles.securitiesInput} />
                                </label>
                                <label className={styles.securitiesLabel}>
                                    Till:
                                    <input type="date" value={dateTill} onChange={(e) => setDateTill(e.target.value)} className={styles.securitiesInput} />
                                </label>
                                <label className={styles.securitiesLabel}>
                                    Interval:
                                    <select value={interval} onChange={(e) => setInterval(e.target.value)} className={styles.securitiesSelect}>
                                        <option value="1">1 min</option>
                                        <option value="10">10 min</option>
                                        <option value="60">1 hour</option>
                                        <option value="24">1 day</option>
                                        <option value="7">1 week</option>
                                        <option value="31">1 month</option>
                                        <option value="4">1 quarter</option>
                                    </select>
                                </label>
                                <button onClick={handleFetch} className={styles.securitiesBtn}>Update</button>
                            </div>
                        )}
                    </div>
                    {error && <p className={styles.securitiesError}>{error}</p>}
                </div>
                <div className={styles.securitiesChartContainer}>
                    {hasData ? (
                        <ChartComponent
                            type="line"
                            data={chartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                interaction: {
                                    mode: 'index',
                                    intersect: false,
                                },
                                plugins: {
                                    legend: { position: 'bottom' as const },
                                    title: {
                                        display: true,
                                        text: tickerInfo?.company_name || 'Stock Analysis Chart',
                                        font: { size: 22, weight: 'bold' },
                                        color: '#ffffff',
                                    },
                                },
                                scales: {
                                    x: {
                                        type: 'time',
                                        time: {
                                            unit: 'day',
                                            displayFormats: {
                                                day: 'dd MMM',
                                            },
                                        },
                                        title: { display: true, text: 'Date', color: '#ffffff', font: { size: 14 } },
                                        ticks: { color: '#cccccc', font: { size: 10 } },
                                        grid: { color: 'rgba(255,255,255,0.1)' },
                                    },
                                    y: {
                                        title: { display: true, text: 'Price (RUB)', color: '#ffffff', font: { size: 14 } },
                                        ticks: { color: '#cccccc', font: { size: 10 } },
                                        grid: { color: 'rgba(255,255,255,0.1)' },
                                    },
                                },
                            }}
                        />
                    ) : (
                        <div className={styles.noDataMessage}>
                            {tickerInfo ? 'Нажмите Update, чтобы загрузить данные' : 'Найдите компанию и загрузите данные'}
                        </div>
                    )}

                    <button
                        onClick={() => setGraphType(graphType === 'normal' ? 'candlestick' : 'normal')}
                        className={styles.graphTypeBtn}
                        title={graphType === 'normal' ? 'Переключить на свечи' : 'Переключить на линии'}
                    >
                        {graphType === 'normal' ? '🕯️' : '📈'}
                    </button>

                    {data && data.prediction && (
                        <div className={styles.predictionWrapper}>
                            <button className={styles.predictionToggle} onClick={() => setShowPrediction(!showPrediction)}>
                                Prediction {showPrediction ? '▼' : '▶'}
                            </button>
                            {showPrediction && (
                                <div className={styles.securitiesPrediction}>
                                    <h3>AI Price Prediction</h3>
                                    <p className={styles.predNext}>Next: <span className={styles.highlight}>{data.prediction.next_price.toFixed(2)} RUB</span></p>
                                    <p className={data.prediction.price_diff > 0 ? styles.up : styles.down}>
                                        Diff: {data.prediction.price_diff.toFixed(2)} RUB
                                        {data.prediction.price_diff > 0 ? ' ↑' : ' ↓'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}