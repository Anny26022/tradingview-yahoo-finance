# TradingView Chart with Yahoo Finance Data

This project is a web application that displays TradingView lightweight charts with real-time stock data fetched from Yahoo Finance. The application features an interactive UI built with Flask, SQLAlchemy, and Tailwind CSS with DaisyUI components. Users can view and analyze stock data using technical indicators, manage a watchlist of symbols, and toggle between light and dark themes.

**Note: This is a Python Flask application that does NOT use Node.js or npm. All dependencies are managed through pip and requirements.txt.**

## Features

### Chart Analysis
- Fetch and display real-time stock data from Yahoo Finance using the yfinance library
- View stock data in multiple timeframes (1 minute, 5 minutes, 15 minutes, hourly, daily, weekly, monthly)
- Technical analysis indicators including EMA and RSI
- Auto-update option for real-time data monitoring

### Watchlist Management
- Dynamic watchlist with real-time quotes for multiple symbols
- Add and remove symbols from the watchlist with instant UI updates
- Persistent storage of watchlist symbols in SQLite database
- Smooth animations for symbol addition and removal

### User Interface
- Modern, responsive UI built with Tailwind CSS and DaisyUI components
- Toggle between light and dark themes
- Mobile-friendly design with drawer navigation

## Installation

Follow these steps to set up and run the application:

### Prerequisites

- Python 3.x
- **Note: Node.js and npm are NOT required for this project**

### Steps

1. **Clone the repository:**

   ```sh
   git clone https://github.com/marketcalls/tradingview-yahoo-finance.git
   cd tradingview-yahoo-finance
   ```

2. **Create a virtual environment:**

   Windows:
   ```sh
   python -m venv venv
   venv\Scripts\activate
   ```

   macOS/Linux:
   ```sh
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install the Python dependencies:**

   ```sh
   pip install -r requirements.txt
   ```

4. **Run the Flask application:**

   ```sh
   python app.py
   ```

5. **Open your web browser and visit:**

   ```
   http://127.0.0.1:5000
   ```

## Important Notes

- **This is a Python Flask application** - do not run npm commands
- **No package.json file is needed** - all dependencies are in requirements.txt
- **No build step is required** - the application runs directly with Python
- All frontend assets (CSS/JS) are served directly by Flask

## Project Structure

```
├── app.py                 # Main Flask application
├── models.py              # SQLAlchemy database models
├── symbols.txt            # Default symbols file
├── templates/
│   └── index.html         # Main HTML template
├── static/
│   └── main.js            # JavaScript for chart handling and UI
├── requirements.txt       # Python dependencies (NOT package.json)
├── .gitignore             # Git ignore file
└── README.md              # Project documentation
```

## Technologies Used

- **Backend**: Flask, SQLAlchemy, SQLite
- **Data**: Yahoo Finance API (via yfinance)
- **Frontend**: JavaScript, Tailwind CSS, DaisyUI (served via CDN)
- **Charting**: Lightweight-charts.js (served via CDN)
- **Language**: Python (NOT Node.js)

## License

This project is licensed under the MIT License.