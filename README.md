# BigQuery Release Notes Explorer 🚀

A modern, high-fidelity web application built using **Python Flask** and **Vanilla HTML, JavaScript, and CSS** to fetch, parse, search, filter, and share Google Cloud BigQuery release notes.

The interface is styled with a premium dark mode, glassmorphism UI elements, micro-animations, and dynamic filters, presenting release updates in an elegant, interactive timeline.

---

## 🌟 Features

* **Real-time XML Fetching:** Connects directly to the official Google Cloud BigQuery release notes Atom feed.
* **Category Auto-Tagging:** Automatically parses and labels updates (e.g., `Feature`, `Announcement`, `Deprecation`, `Issue`) using regex-based extraction from the feed HTML.
* **Efficient In-Memory Caching:** Caches the parsed XML data locally for 5 minutes (`300 seconds`) to avoid spamming Google's servers and ensure fast load times.
* **Interactive Live Search:** Allows instant, client-side keyword filtering matching titles, category tags, or descriptions.
* **Category Filters:** Quick navigation tabs to filter by update types (Features, Announcements, Deprecations, etc.).
* **Custom Twitter/X Composer Modal:** An interactive pop-up composer mimicking the X posting UI that auto-formats tweets with the update details, hashtags (`#GCP #BigQuery`), and character limits (280 max).
* **Direct Clipboard Links:** Clickable buttons to copy release anchors directly to the clipboard with sliding toast alerts.

---

## 📂 Project Structure

```
agy-cli-projects/
├── venv/                   # Python virtual environment
├── app.py                  # Flask backend & RSS feed parser
├── templates/
│   └── index.html          # Main HTML structure, modal layout, and skeletons
├── static/
│   ├── css/
│   │   └── styles.css      # Custom HSL dark-theme styling & layout transitions
│   └── js/
│       └── app.js          # Client-side API fetch, search, filters & X Web Intent
├── .gitignore              # Git ignore rules for build, environment, and OS files
└── README.md               # Project documentation (this file)
```

---

## 🛠️ Tech Stack

* **Backend:** Python 3, Flask, XML ElementTree, Urllib
* **Frontend:** Vanilla HTML5, Vanilla CSS3 (Custom variables, HSL, Glassmorphism), Vanilla JavaScript (ES6+ Fetch API)
* **Icons:** Lucide Icons (SVG vector pack loaded via CDN)
* **Fonts:** Inter (loaded via Google Fonts)

---

## 🚀 Getting Started

### Prerequisites
* Python 3.3+ (includes the built-in `venv` module)
* Internet access (to retrieve the live Google Cloud feed and load CDNs)

### 1. Set Up and Run the Application

Navigate to the project directory, activate the virtual environment, install dependencies, and start the server:

```bash
# Clone or navigate to the project directory
cd agy-cli-projects

# Create a virtual environment (if not already created)
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install Flask and Requests
pip install flask requests

# Start the Flask web application
python3 app.py
```

### 2. Access the Web UI
Open your favorite browser and go to:
👉 **`http://localhost:5001`**

---

## 🔄 Request-Response Flow

1. **User Request:** The client triggers a reload (or loads the page).
2. **Server Check:** The backend routes to `/api/releases`. It checks the local cache. If fresh, it returns the cached updates. If expired (or forced refresh is true), it calls `fetch_and_parse_feed()`.
3. **Feed Retrieval & Parse:** The server pulls the XML Atom feed, extracts entries, strips title dates, uses regex to isolate categories, and updates the local cache.
4. **Client Render:** The client receives the JSON payload, dynamically generates the timeline cards, loads Lucide SVG icons, and attaches event listeners.
