class ClockManager {
    constructor() {
        this.timezones = this.loadTimezones();
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderClocks();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    }
    
    setupEventListeners() {
        document.getElementById('addBtn').addEventListener('click', () => this.addTimezone());
        document.getElementById('timezoneInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTimezone();
        });
        
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tz = e.target.getAttribute('data-tz');
                this.addTimezoneToList(tz);
            });
        });
    }
    
    loadTimezones() {
        const saved = localStorage.getItem('timezones');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveTimezones() {
        localStorage.setItem('timezones', JSON.stringify(this.timezones));
    }
    
    addTimezone() {
        const input = document.getElementById('timezoneInput');
        const tz = input.value.trim();
        
        if (!tz) {
            alert('Please enter a timezone');
            return;
        }
        
        this.addTimezoneToList(tz);
        input.value = '';
    }
    
    addTimezoneToList(tz) {
        // Validate timezone
        try {
            new Intl.DateTimeFormat('en-US', { timeZone: tz });
        } catch (e) {
            alert(`Invalid timezone: ${tz}. Please enter a valid timezone name.`);
            return;
        }
        
        if (this.timezones.includes(tz)) {
            alert(`${tz} is already added`);
            return;
        }
        
        this.timezones.push(tz);
        this.saveTimezones();
        this.renderClocks();
    }
    
    removeTimezone(tz) {
        this.timezones = this.timezones.filter(t => t !== tz);
        this.saveTimezones();
        this.renderClocks();
    }
    
    renderClocks() {
        const container = document.getElementById('clocksContainer');
        container.innerHTML = '';
        
        if (this.timezones.length === 0) {
            container.innerHTML = '<div class="empty-state">No timezones added yet. Add one to get started!</div>';
            return;
        }
        
        this.timezones.forEach(tz => {
            const card = document.createElement('div');
            card.className = 'clock-card';
            card.id = `clock-${tz}`;
            card.innerHTML = `
                <div class="timezone-name">
                    <span>${this.getDisplayName(tz)}</span>
                    <button class="remove-btn" data-tz="${tz}">Remove</button>
                </div>
                <div class="digital-time" data-tz="${tz}">00:00:00</div>
                <div class="timezone-offset" data-tz="${tz}">UTC±0</div>
                <div class="date-info" data-tz="${tz}">--</div>
            `;
            container.appendChild(card);
            
            // Add remove button listener
            card.querySelector('.remove-btn').addEventListener('click', () => {
                this.removeTimezone(tz);
            });
        });
    }
    
    getDisplayName(tz) {
        return tz.replace(/_/g, ' ').split('/').pop();
    }
    
    updateTime() {
        // Update local time
        this.updateClockDisplay('local', new Date());
        
        // Update timezone clocks
        this.timezones.forEach(tz => {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            const date = new Date();
            const parts = formatter.formatToParts(date);
            const time = `${this.pad(parts[0].value)}:${this.pad(parts[2].value)}:${this.pad(parts[4].value)}`;
            
            const timeElement = document.querySelector(`[data-tz="${tz}"][class="digital-time"]`);
            if (timeElement) {
                timeElement.textContent = time;
            }
            
            // Update offset
            this.updateOffset(tz, date);
            
            // Update date
            this.updateDateInfo(tz, date);
        });
    }
    
    updateClockDisplay(id, date) {
        const time = date.toLocaleTimeString('en-US', { hour12: false });
        const timeElement = document.getElementById(`${id}Time`);
        if (timeElement) {
            timeElement.textContent = time;
        }
        
        if (id === 'local') {
            this.updateLocalOffset(date);
        }
    }
    
    updateLocalOffset(date) {
        const offset = -date.getTimezoneOffset() / 60;
        const sign = offset >= 0 ? '+' : '';
        const offsetElement = document.getElementById('localOffset');
        if (offsetElement) {
            offsetElement.textContent = `UTC${sign}${offset}`;
        }
    }
    
    updateOffset(tz, date) {
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            const parts = formatter.formatToParts(date);
            const tzDate = new Date(
                parseInt(parts[4].value),
                parseInt(parts[0].value) - 1,
                parseInt(parts[2].value),
                parseInt(parts[6].value),
                parseInt(parts[8].value),
                parseInt(parts[10].value)
            );
            
            const diff = Math.round((date - tzDate) / 36e5);
            const offsetElement = document.querySelector(`[data-tz="${tz}"][class="timezone-offset"]`);
            if (offsetElement) {
                const sign = diff >= 0 ? '+' : '';
                offsetElement.textContent = `UTC${sign}${diff}`;
            }
        } catch (e) {
            console.error('Error calculating offset for', tz, e);
        }
    }
    
    updateDateInfo(tz, date) {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const dateStr = formatter.format(date);
        const dateElement = document.querySelector(`[data-tz="${tz}"][class="date-info"]`);
        if (dateElement) {
            dateElement.textContent = dateStr;
        }
    }
    
    pad(num) {
        return String(num).padStart(2, '0');
    }
}

// Initialize the clock manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ClockManager();
});
