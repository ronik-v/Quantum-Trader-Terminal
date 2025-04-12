# Quantum Trader Terminal

A trading terminal with the capability to connect trading bots and visualize portfolio data.

## Technologies

### Backend
- Java + Spring Boot
- WebSockets
- PostgreSQL

### Frontend
- ReactJS

##  Interface

### View 1: Overall Chart and Trade Summary
- **Portfolio value chart** for the selected period (zoom-in/zoom-out)
- **Trade markers** (color-coded: green — profit, red — loss)
- **Sidebar with tickers**: current indicators, volumes, bot status

### View 2: Transaction History
- Table with columns: `date`, `ticker`, `type`, `quantity`, `price`, `result`
- Filtering: by date, ticker, operation type
- Pagination

### View 3: Trading Bot Selection
- List of strategies with a brief description
- Upon selection — a window with:
    - parameters
    - indicators
    - performance history
- Bot launch button

###  View 4: Settings
- Input field for Tinkoff API token, connection test button
- Theme switch (dark/light)
- Data refresh rate, notification settings, etc.

---

## Navigation Diagram

```mermaid
flowchart TD

%% --- MAIN NAVIGATION ---
subgraph Application Navigation
    Start["🔒 Main Menu"] --> Portfolio["📈 Overall Chart and Trade Summary"]
    Start --> History["📜 Transaction History"]
    Start --> Bots["🤖 Trading Bot Selection"]
    Start --> Settings["⚙️ Settings"]

    Portfolio --> Chart["📊 Portfolio Value Chart"]
    Portfolio --> Markers["📍 Trade Markers on Chart"]
    Portfolio --> Tickers["🗂️ Sidebar with Tickers"]

    History --> Table["📑 Transaction Table"]
    History --> Filters["🔎 Filters by Date/Ticker"]
    History --> Pages["📄 Pagination"]

    Bots --> BotCards["🧠 List of Strategies"]
    BotCards --> BotDetails["📃 Detailed Strategy Description"]
    BotDetails --> BotLaunch["🚀 Launch Button"]

    Settings --> Token["🔐 Input Tinkoff API Token"]
    Settings --> UITheme["🎨 Choose Interface Theme"]
    Settings --> GeneralSettings["🛠️ General Settings"]
end

%% Styles
classDef main fill:#eef,stroke:#333,stroke-width:2px;
class Start,Portfolio,History,Bots,Settings main
