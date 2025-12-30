import { type JSX, useState, useEffect, useCallback, useRef } from 'react';
import { Chart as ChartComponent } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler,
    type ChartOptions
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import styles from './SecuritiesData.module.css';
import type { FindCompanyResponse, TickerApiResponse } from '../../api/stockData/types.ts';
import type { StockDataService } from '../../api/stockData/module.ts';
import { ApiServiceFactory } from '../../api/connection.ts';
import { Footer } from '../../components/Footer/Footer.tsx';
import { UserUtils } from '../../utils/user.ts';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler,
    BarElement,
    CandlestickController,
    CandlestickElement,
    zoomPlugin
);

export function SecuritiesData(): JSX.Element {
    const [companyName, setCompanyName] = useState<string>('');
    const [tickerInfo, setTickerInfo] = useState<FindCompanyResponse | null>(null);
    const [error, setError] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTill, setDateTill] = useState<string>('');
    const [interval, setInterval] = useState<string>('24');
    const [data, setData] = useState<TickerApiResponse | null>(null);
    const [graphType, setGraphType] = useState<'candlestick' | 'line'>('candlestick');
    const [showOnlyGarch, setShowOnlyGarch] = useState<boolean>(false);
    const [showPrediction, setShowPrediction] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const userUtils = new UserUtils();
    const [chartDataMain, setChartDataMain] = useState<any>({ datasets: [] });
    const [chartDataVolume, setChartDataVolume] = useState<any>({ datasets: [] });
    const [yScale, setYScale] = useState<{ min?: number; max?: number; step?: number }>({});
    const [stockInfo, setStockInfo] = useState<any>(null);
    const mainChartRef = useRef<any>(null);

    const stockServiceRef = useCallback((): StockDataService => ApiServiceFactory.stockService(userUtils.getToken()), [userUtils]);

    async function handleSearch() {
        setError('');
        setTickerInfo(null);
        setData(null);
        setStockInfo(null);
        const res = await stockServiceRef().findByCompanyName(companyName);
        if ('error' in res) {
            setError((res as { error: string }).error);
        } else {
            setTickerInfo(res as FindCompanyResponse);
        }
    }

    async function handleFetch() {
        if (!tickerInfo) return;
        setError('');
        setLoading(true);
        try {
            const intInterval = parseInt(interval || '24', 10);
            const res = await stockServiceRef().getTickerData(tickerInfo.ticker, dateFrom || '', dateTill || '', intInterval);
            if ('error' in res) {
                setError((res as { error: string }).error);
                setData(null);
            } else {
                setData(res as TickerApiResponse);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (tickerInfo) {
            handleFetch().catch(e => console.error(e));
        }
    }, [tickerInfo, dateFrom, dateTill, interval]);

    useEffect(() => {
        const refreshInterval = window.setInterval(() => {
            if (tickerInfo) {
                handleFetch().catch(e => console.error(e));
            }
        }, 60000);

        return () => window.clearInterval(refreshInterval);
    }, [tickerInfo, dateFrom, dateTill, interval]);

    useEffect(() => {
        if (mainChartRef.current && chartDataMain.datasets.length > 0) {
            requestAnimationFrame(() => {
                mainChartRef.current?.resize();
            });
        }
    }, [chartDataMain, graphType, showOnlyGarch]);

    useEffect(() => {
        if (!data || !data.data || !data.data.ticker || !Array.isArray(data.data.ticker.begin) || data.data.ticker.begin.length === 0) {
            setChartDataMain({ datasets: [] });
            setChartDataVolume({ datasets: [] });
            setStockInfo(null);
            setYScale({});
            return;
        }

        const begins = data.data.ticker.begin;
        const timestamps = begins.map((b: any) => {
            const ms = Date.parse(String(b));
            return Number.isFinite(ms) ? ms : b;
        });

        const n = timestamps.length;
        const open = data.data.ticker.open.map(Number);
        const close = data.data.ticker.close.map(Number);
        const high = data.data.ticker.high.map(Number);
        const low = data.data.ticker.low.map(Number);
        const volume = Array.isArray(data.data.ticker.volume) ? data.data.ticker.volume.map(Number) : [];
        const models = data.data.models || {};

        const mainDatasets: any[] = [];

        if (showOnlyGarch) {
            if (models.garch?.upper && models.garch.upper.length > 0) {
                const upper = models.garch.upper.map((v: number, j: number) => ({ x: timestamps[j], y: Number(v) }));
                mainDatasets.push({
                    type: 'line',
                    label: 'GARCH Upper',
                    data: upper,
                    borderColor: '#6fe3ff',
                    backgroundColor: 'rgba(111,227,255,0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y'
                });
            }

            if (models.garch?.lower && models.garch.lower.length > 0) {
                const lower = models.garch.lower.map((v: number, j: number) => ({ x: timestamps[j], y: Number(v) }));
                mainDatasets.push({
                    type: 'line',
                    label: 'GARCH Lower',
                    data: lower,
                    borderColor: '#ff8b8b',
                    backgroundColor: 'rgba(255,139,139,0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y'
                });
            }
        } else {
            if (graphType === 'candlestick') {
                const candleData = timestamps.map((t, i) => ({
                    x: t,
                    o: open[i],
                    h: high[i],
                    l: low[i],
                    c: close[i]
                }));

                mainDatasets.push({
                    type: 'candlestick',
                    label: 'Price',
                    data: candleData,
                    borderWidth: 2,
                    barPercentage: 0.92,
                    categoryPercentage: 0.78,
                    maxBarThickness: 60,
                    wickColor: 'rgba(255,255,255,0.6)',
                    color: {
                        up: '#26a69a',
                        down: '#ef5350',
                        unchanged: '#999'
                    },
                    borderColor: {
                        up: '#0f7a64',
                        down: '#b43a36'
                    },
                    yAxisID: 'y'
                });

                if (Array.isArray(models.sma_5) && models.sma_5.length > 0) {
                    const offset = 5;
                    const sma5data = models.sma_5.map((v: number, j: number) => ({
                        x: timestamps[j + offset - 1],
                        y: Number(v)
                    })).filter((_, idx) => idx + offset - 1 < n);
                    mainDatasets.push({
                        type: 'line',
                        label: 'SMA 5',
                        data: sma5data,
                        borderColor: '#8bd3ff',
                        borderWidth: 1.8,
                        pointRadius: 0,
                        spanGaps: true,
                        yAxisID: 'y'
                    });
                }

                if (Array.isArray(models.sma_12) && models.sma_12.length > 0) {
                    const offset = 12;
                    const sma12data = models.sma_12.map((v: number, j: number) => ({
                        x: timestamps[j + offset - 1],
                        y: Number(v)
                    })).filter((_, idx) => idx + offset - 1 < n);
                    mainDatasets.push({
                        type: 'line',
                        label: 'SMA 12',
                        data: sma12data,
                        borderColor: '#ffd166',
                        borderWidth: 1.8,
                        pointRadius: 0,
                        spanGaps: true,
                        yAxisID: 'y'
                    });
                }

                if (Array.isArray(models.arima) && models.arima.length > 0) {
                    const arimaData = models.arima.map((v: number, j: number) => ({ x: timestamps[j], y: Number(v) }));
                    mainDatasets.push({
                        type: 'line',
                        label: 'ARIMA',
                        data: arimaData,
                        borderColor: '#c77dff',
                        borderDash: [4, 4],
                        borderWidth: 1.4,
                        pointRadius: 0,
                        yAxisID: 'y'
                    });
                }

                if (models.garch?.upper && models.garch.upper.length > 0) {
                    const upper = models.garch.upper.map((v: number, j: number) => ({ x: timestamps[j], y: Number(v) }));
                    mainDatasets.push({
                        type: 'line',
                        label: 'GARCH Upper',
                        data: upper,
                        borderColor: '#6fe3ff',
                        borderWidth: 1,
                        pointRadius: 0,
                        yAxisID: 'y1'
                    });
                }

                if (models.garch?.lower && models.garch.lower.length > 0) {
                    const lower = models.garch.lower.map((v: number, j: number) => ({ x: timestamps[j], y: Number(v) }));
                    mainDatasets.push({
                        type: 'line',
                        label: 'GARCH Lower',
                        data: lower,
                        borderColor: '#ff8b8b',
                        borderWidth: 1,
                        pointRadius: 0,
                        yAxisID: 'y1'
                    });
                }
            } else {
                mainDatasets.push(
                    { type: 'line', label: 'Open', data: timestamps.map((t, i) => ({ x: t, y: open[i] })), borderColor: '#00ffff', borderWidth: 1.6, pointRadius: 0, yAxisID: 'y' },
                    { type: 'line', label: 'Close', data: timestamps.map((t, i) => ({ x: t, y: close[i] })), borderColor: '#6fe3ff', borderWidth: 1.6, pointRadius: 0, yAxisID: 'y' },
                    { type: 'line', label: 'High', data: timestamps.map((t, i) => ({ x: t, y: high[i] })), borderColor: '#7bd389', borderWidth: 1.2, pointRadius: 0, yAxisID: 'y' },
                    { type: 'line', label: 'Low', data: timestamps.map((t, i) => ({ x: t, y: low[i] })), borderColor: '#ff8b8b', borderWidth: 1.2, pointRadius: 0, yAxisID: 'y' }
                );
            }
        }

        setChartDataMain({ datasets: mainDatasets });

        if (volume.length === n) {
            setChartDataVolume({
                datasets: [{
                    type: 'bar',
                    label: 'Volume',
                    data: timestamps.map((t, i) => ({ x: t, y: volume[i] })),
                    backgroundColor: 'rgba(139,0,0,0.96)',
                    borderWidth: 0,
                    barPercentage: 1.0,
                    categoryPercentage: 1.0
                }]
            });
        } else {
            setChartDataVolume({ datasets: [] });
        }

        let allYs = [...high, ...low, ...open, ...close];
        if (!showOnlyGarch) {
            if (Array.isArray(models.sma_5)) allYs.push(...models.sma_5.map(Number));
            if (Array.isArray(models.sma_12)) allYs.push(...models.sma_12.map(Number));
            if (Array.isArray(models.arima)) allYs.push(...models.arima.map(Number));
        } else {
            if (models.garch?.upper) allYs.push(...models.garch.upper.map(Number));
            if (models.garch?.lower) allYs.push(...models.garch.lower.map(Number));
        }

        const finite = allYs.filter(Number.isFinite);
        if (finite.length > 0) {
            let min = Math.min(...finite);
            let max = Math.max(...finite);
            const rawRange = Math.abs(max - min) || Math.abs(max) * 0.001 || 0.01;
            let padding;
            if (rawRange < 0.2) padding = Math.max(0.25, rawRange * 1.2);
            else if (rawRange < 1) padding = Math.max(0.5, rawRange * 0.8);
            else padding = rawRange * 0.12;
            const minY = +(min - padding).toFixed(6);
            const maxY = +(max + padding).toFixed(6);
            let step = +(((maxY - minY) / 6).toFixed(2));
            if (!isFinite(step) || step <= 0) step = 0.01;
            if (step < 0.01) step = 0.01;
            setYScale({ min: minY, max: maxY, step });
        } else {
            setYScale({});
        }

        if (close.length > 0) {
            const last = close.length - 1;
            const lastClose = close[last];
            const prevClose = close[Math.max(0, last - 1)];
            const change = lastClose - prevClose;
            const changePct = prevClose ? (change / prevClose) * 100 : 0;
            setStockInfo({
                lastClose,
                lastOpen: open[last],
                lastHigh: high[last],
                lastLow: low[last],
                lastVolume: volume[last] || 0,
                priceChange: change,
                priceChangePercent: changePct
            });
        } else {
            setStockInfo(null);
        }
    }, [data, graphType, showOnlyGarch]);

    const hasMain = chartDataMain.datasets.length > 0;
    const hasVolume = chartDataVolume.datasets.length > 0;
    const hasGarch = data?.data?.models?.garch?.upper || data?.data?.models?.garch?.lower;

    const optionsMain: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.92)' } },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => {
                        if (ctx.dataset.type === 'candlestick' && ctx.raw) {
                            const r = ctx.raw;
                            return `O: ${r.o.toFixed(2)} H: ${r.h.toFixed(2)} L: ${r.l.toFixed(2)} C: ${r.c.toFixed(2)}`;
                        }
                        return `${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(2)}`;
                    }
                }
            },
            title: {
                display: !!tickerInfo,
                text: tickerInfo?.company_name || '',
                color: '#ffffff',
                font: { size: 18, weight: 600 }
            },
            zoom: {
                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, drag: { enabled: true }, mode: 'xy' },
                pan: { enabled: true, mode: 'xy' }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: { tooltipFormat: 'dd MMM yyyy', unit: 'day' },
                ticks: { color: 'rgba(255,255,255,0.82)' },
                grid: { color: 'rgba(255,255,255,0.02)' }
            },
            y: {
                position: 'left',
                min: yScale.min,
                max: yScale.max,
                ticks: {
                    color: 'rgba(255,255,255,0.9)',
                    callback: v => Number(v).toFixed(2),
                    stepSize: yScale.step,
                    maxTicksLimit: 12
                },
                grid: { color: 'rgba(255,255,255,0.02)' },
                title: {
                    display: true,
                    text: showOnlyGarch ? 'GARCH Bounds' : 'Price (RUB)',
                    color: 'rgba(255,255,255,0.88)'
                }
            },
            y1: {
                position: 'right',
                display: !showOnlyGarch,
                ticks: {
                    color: 'rgba(255,255,255,0.6)',
                    callback: v => Number(v).toFixed(2),
                    maxTicksLimit: 12
                },
                grid: { display: false },
                title: { display: true, text: 'GARCH', color: 'rgba(255,255,255,0.6)' }
            }
        }
    };

    const optionsVolume: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { type: 'time', grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.72)' } },
            y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.72)', callback: v => Number(v).toLocaleString() }, title: { display: true, text: 'Volume', color: 'rgba(255,255,255,0.78)' } }
        }
    };

    return (
        <div className={styles.securitiesPage}>
            <div className={styles.topStats}>
                <div className={styles.leftStats}>
                    <div className={styles.brand}>Market Panel</div>
                    <div className={styles.controlsRow}>
                        <div className={styles.searchContainer}>
                            <input
                                type="text"
                                value={companyName}
                                onChange={e => setCompanyName(e.target.value)}
                                placeholder="Search stock..."
                                className={styles.securitiesInput}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                            <button onClick={handleSearch} className={styles.securitiesBtn}>Search</button>
                        </div>
                        <div className={styles.smallControls}>
                            <select value={interval} onChange={e => setInterval(e.target.value)} className={styles.securitiesSelect}>
                                <option value="1">1m</option>
                                <option value="10">10m</option>
                                <option value="60">1h</option>
                                <option value="24">1d</option>
                                <option value="7">1w</option>
                                <option value="31">1M</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.centerStats}>
                    <div className={styles.bigValue}>{stockInfo ? stockInfo.lastClose.toFixed(2) : '—'}</div>
                    <div className={styles.smallMeta}>
                        <span className={stockInfo && stockInfo.priceChange > 0 ? styles.positiveChange : styles.negativeChange}>
                            {stockInfo ? `${stockInfo.priceChange.toFixed(2)} (${stockInfo.priceChangePercent.toFixed(2)}%)` : ''}
                        </span>
                        <span className={styles.metaTiny}>{tickerInfo?.ticker || ''}</span>
                    </div>
                </div>

                <div className={styles.rightStats}>
                    {tickerInfo && stockInfo && (
                        <div className={styles.stockInfoCompact}>
                            <div className={styles.stockName}>{tickerInfo.company_name}</div>
                            <div className={styles.stockNumbers}>
                                <div>Open {stockInfo.lastOpen.toFixed(2)}</div>
                                <div>High {stockInfo.lastHigh.toFixed(2)}</div>
                                <div>Low {stockInfo.lastLow.toFixed(2)}</div>
                                <div>Vol {stockInfo.lastVolume}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.chartWrapper}>
                <div className={styles.securitiesHeader}>
                    <div className={styles.filtersRow}>
                        <div className={styles.formDate}>
                            <label className={styles.securitiesLabel}>
                                From
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={styles.dateInput} />
                            </label>
                            <label className={styles.securitiesLabel}>
                                To
                                <input type="date" value={dateTill} onChange={e => setDateTill(e.target.value)} className={styles.dateInput} />
                            </label>
                        </div>
                        <div className={styles.rightControls}>
                            <button
                                onClick={() => setGraphType(prev => prev === 'candlestick' ? 'line' : 'candlestick')}
                                className={styles.viewToggle}
                                title={graphType === 'candlestick' ? 'Switch to Lines' : 'Switch to Candles'}
                            >
                                {graphType === 'candlestick' ? '🕯️' : '📈'}
                            </button>
                            {hasGarch && (
                                <button
                                    onClick={() => setShowOnlyGarch(prev => !prev)}
                                    className={`${styles.viewToggle} ${showOnlyGarch ? styles.activeToggle : ''}`}
                                    title="Show only GARCH"
                                >
                                    G
                                </button>
                            )}
                            <button
                                onClick={() => mainChartRef.current?.resetZoom()}
                                className={styles.viewToggle}
                                title="Reset zoom"
                            >
                                🔄
                            </button>
                        </div>
                    </div>
                    {error && <p className={styles.securitiesError}>{error}</p>}
                </div>

                <div className={styles.securitiesChartContainer}>
                    {loading && (
                        <div className={styles.loaderOverlay}>
                            <div className={styles.spinner} />
                        </div>
                    )}

                    {hasMain ? (
                        <div className={styles.chartGrid}>
                            <div className={styles.mainChart}>
                                <ChartComponent
                                    ref={mainChartRef}
                                    type={graphType === 'candlestick' && !showOnlyGarch ? 'candlestick' : 'line'}
                                    data={chartDataMain}
                                    options={optionsMain}
                                />
                            </div>

                            {hasVolume && (
                                <div className={styles.volumeChart}>
                                    <ChartComponent
                                        type="bar"
                                        data={chartDataVolume}
                                        options={optionsVolume}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.noDataMessage}>
                            {tickerInfo ? 'No data for selected period' : 'Search for a company and press Search'}
                        </div>
                    )}

                    <div className={styles.predictionWrapper}>
                        <button className={styles.predictionToggle} onClick={() => setShowPrediction(prev => !prev)}>
                            Price Prediction {showPrediction ? '▾' : '▸'}
                        </button>
                        {showPrediction && data?.prediction && (
                            <div className={styles.securitiesPrediction}>
                                <div className={styles.predHead}>Price Prediction</div>
                                <div className={styles.predBody}>
                                    <div className={styles.predRow}>
                                        <div>Next</div>
                                        <div className={styles.predValue}>{data.prediction.next_price.toFixed(2)} RUB</div>
                                    </div>
                                    <div className={data.prediction.price_diff > 0 ? styles.up : styles.down}>
                                        {data.prediction.price_diff > 0 ? '▲' : '▼'} {Math.abs(data.prediction.price_diff).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
