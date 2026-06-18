document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releases = [];
    let activeCategory = 'all';
    let searchQuery = '';
    let selectedRelease = null;

    // DOM Elements
    const timelineContainer = document.getElementById('releases-timeline');
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const emptyState = document.getElementById('empty-state');
    
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    const retryBtn = document.getElementById('retry-btn');
    
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    
    const lastUpdatedSpan = document.getElementById('last-updated');
    const releasesCountSpan = document.getElementById('releases-count');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    // Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCountSpan = document.getElementById('char-count');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const submitTweetBtn = document.getElementById('submit-tweet-btn');
    
    // Toast Element
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Initialize Lucide Icons
    lucide.createIcons();

    // Fetch releases from backend API
    async function loadReleases(forceRefresh = false) {
        setLoadingState(true);
        try {
            const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                releases = data.releases;
                updateLastUpdatedTime(data.timestamp);
                renderReleases();
            } else {
                throw new Error(data.message || 'Unknown server error');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showErrorState(error.message);
        } finally {
            setLoadingState(false);
        }
    }

    // Set UI Loading State
    function setLoadingState(isLoading) {
        if (isLoading) {
            loadingSkeleton.style.display = 'block';
            timelineContainer.style.display = 'none';
            errorState.style.display = 'none';
            emptyState.style.display = 'none';
            refreshIcon.classList.add('spin');
            refreshBtn.disabled = true;
        } else {
            loadingSkeleton.style.display = 'none';
            refreshIcon.classList.remove('spin');
            refreshBtn.disabled = false;
        }
    }

    // Show Error State
    function showErrorState(messageText) {
        timelineContainer.style.display = 'none';
        errorState.style.display = 'flex';
        errorMessage.textContent = messageText || 'Could not fetch BigQuery release notes.';
    }

    // Format updated timestamp
    function updateLastUpdatedTime(timestamp) {
        const date = new Date(timestamp * 1000);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        lastUpdatedSpan.textContent = `Last updated: ${hours}:${minutes}:${seconds}`;
    }

    // Filter and Render release cards
    function renderReleases() {
        // Clear timeline
        timelineContainer.innerHTML = '';
        
        // Filter based on activeCategory and searchQuery using helper
        const filtered = getFilteredReleases();

        // Update counts
        releasesCountSpan.textContent = `${filtered.length} Updates`;
        
        if (filtered.length === 0) {
            emptyState.style.display = 'flex';
            timelineContainer.style.display = 'none';
            return;
        }
        
        emptyState.style.display = 'none';
        timelineContainer.style.display = 'flex';

        // Render card elements
        filtered.forEach((item, index) => {
            const card = document.createElement('article');
            card.className = 'timeline-card';
            card.style.animationDelay = `${index * 0.05}s`;
            
            const categoryClass = item.category.toLowerCase();
            
            // Generate clean safe HTML template
            card.innerHTML = `
                <div class="card-header">
                    <div class="date-badge">
                        <i data-lucide="calendar"></i>
                        <span>${item.title}</span>
                    </div>
                    <span class="category-tag ${categoryClass}">${item.category}</span>
                </div>
                <div class="card-content">
                    ${item.content}
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary btn-sm copy-text-btn" data-index="${releases.indexOf(item)}">
                        <i data-lucide="copy" class="btn-icon"></i>
                        <span>Copy Text</span>
                    </button>
                    <button class="btn btn-secondary btn-sm copy-link-btn" data-link="${item.link}">
                        <i data-lucide="link" class="btn-icon"></i>
                        <span>Copy Link</span>
                    </button>
                    <button class="btn btn-primary btn-sm tweet-btn" data-index="${releases.indexOf(item)}">
                        <i data-lucide="twitter" class="btn-icon"></i>
                        <span>Tweet</span>
                    </button>
                </div>
            `;
            
            timelineContainer.appendChild(card);
        });

        // Re-run Lucide icons
        lucide.createIcons();
        attachCardListeners();
    }

    // Attach Event Listeners to rendered cards
    function attachCardListeners() {
        // Copy Text Action
        document.querySelectorAll('.copy-text-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                const item = releases[idx];
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.content;
                const plainText = tempDiv.textContent || tempDiv.innerText || '';
                
                const textToCopy = `BigQuery Release Note - ${item.title} (${item.category})\n\n${plainText.trim()}\n\nRead more: ${item.link}`;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast('Release text copied!');
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                });
            });
        });

        // Copy Link Action
        document.querySelectorAll('.copy-link-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const link = btn.getAttribute('data-link');
                navigator.clipboard.writeText(link).then(() => {
                    showToast('Link copied to clipboard!');
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                });
            });
        });

        // Tweet Modal Opening Action
        document.querySelectorAll('.tweet-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                selectedRelease = releases[idx];
                openTweetComposer(selectedRelease);
            });
        });
    }

    // Open Tweet Composer modal with formatted tweet
    function openTweetComposer(item) {
        // Strip HTML tags for tweet representation
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.content;
        let plainText = tempDiv.textContent || tempDiv.innerText || '';
        
        // Truncate plainText if it is too long to fit in 280 chars along with the prefix and hashtag
        const prefix = `BigQuery Update [${item.title}] (${item.category}): `;
        const suffix = `\n\n#GCP #BigQuery ${item.link}`;
        
        // Character Math
        const reservedLen = prefix.length + suffix.length;
        const maxTextLen = 280 - reservedLen;
        
        if (plainText.length > maxTextLen) {
            plainText = plainText.substring(0, maxTextLen - 3) + '...';
        }
        
        const initialTweetText = `${prefix}${plainText}${suffix}`;
        
        // Set values and show modal
        tweetTextarea.value = initialTweetText;
        updateCharCount();
        
        tweetModal.style.display = 'flex';
        tweetTextarea.focus();
    }

    // Update character count
    function updateCharCount() {
        const len = tweetTextarea.value.length;
        charCountSpan.textContent = len;
        
        // Color coding
        const counter = document.querySelector('.tweet-char-counter');
        counter.className = 'tweet-char-counter';
        
        if (len > 280) {
            counter.classList.add('danger');
            submitTweetBtn.disabled = true;
        } else if (len > 250) {
            counter.classList.add('warning');
            submitTweetBtn.disabled = false;
        } else {
            submitTweetBtn.disabled = false;
        }
    }

    // Show Custom Toast
    function showToast(message) {
        toastMessage.textContent = message;
        toast.style.display = 'flex';
        // Force reflow
        toast.offsetHeight;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.style.display = 'none';
            }, 300);
        }, 2500);
    }

    // Event Listeners for Filters
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeCategory = tab.getAttribute('data-category');
            renderReleases();
        });
    });

    // Search input handlers
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchQuery.trim() !== '') {
            clearSearchBtn.style.display = 'flex';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        renderReleases();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderReleases();
        searchInput.focus();
    });

    // Refresh handlers
    refreshBtn.addEventListener('click', () => {
        loadReleases(true);
    });
    
    retryBtn.addEventListener('click', () => {
        loadReleases(true);
    });

    // Modal close handlers
    const closeModal = () => {
        tweetModal.style.display = 'none';
        selectedRelease = null;
    };

    closeModalBtn.addEventListener('click', closeModal);
    cancelTweetBtn.addEventListener('click', closeModal);
    
    // Clicking outside modal content closes it
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeModal();
        }
    });

    // Modal Character Counting
    tweetTextarea.addEventListener('input', updateCharCount);

    // Submit Tweet (Open Twitter Web Intent)
    submitTweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        if (text.length <= 280) {
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            window.open(twitterUrl, '_blank');
            closeModal();
            showToast('Opening Twitter X Composer...');
        }
    });

    // Helper function to get filtered releases
    function getFilteredReleases() {
        return releases.filter(item => {
            const matchesCategory = activeCategory === 'all' || item.category.toLowerCase() === activeCategory.toLowerCase();
            
            let matchesSearch = true;
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                const titleMatch = item.title.toLowerCase().includes(query);
                const contentMatch = item.content.toLowerCase().includes(query);
                const catMatch = item.category.toLowerCase().includes(query);
                matchesSearch = titleMatch || contentMatch || catMatch;
            }
            
            return matchesCategory && matchesSearch;
        });
    }

    // Initialize Theme from LocalStorage
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.setAttribute('data-lucide', 'moon');
        lucide.createIcons();
    }

    // Theme Toggle Listener
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        
        if (isLight) {
            themeIcon.setAttribute('data-lucide', 'moon');
            localStorage.setItem('theme', 'light');
        } else {
            themeIcon.setAttribute('data-lucide', 'sun');
            localStorage.setItem('theme', 'dark');
        }
        lucide.createIcons();
    });

    // CSV Export Listener
    exportCsvBtn.addEventListener('click', () => {
        const filtered = getFilteredReleases();
        if (filtered.length === 0) {
            showToast('No releases to export!');
            return;
        }

        const escapeCsv = (str) => {
            if (!str) return '""';
            return '"' + str.replace(/"/g, '""').replace(/\n/g, ' ') + '"';
        };

        let csvLines = ['"Date","Category","Content","Link"'];
        
        filtered.forEach(item => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = item.content;
            const plainText = tempDiv.textContent || tempDiv.innerText || '';
            
            const line = [
                escapeCsv(item.title),
                escapeCsv(item.category),
                escapeCsv(plainText.trim()),
                escapeCsv(item.link)
            ].join(',');
            
            csvLines.push(line);
        });

        const csvString = csvLines.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bigquery_releases_${activeCategory}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('CSV Exported successfully!');
    });

    // First load
    loadReleases();
});
