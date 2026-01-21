
/**
 * Formats a timestamp string to IST (Indian Standard Time)
 * Adds 5 hours 30 minutes to the given time if needed, or ensures correct timezone display.
 * 
 * @param timeString - The timestamp string from the server (e.g., "2024-01-20 10:00:00")
 * @returns Formatted time string in IST (e.g., "03:30 PM")
 */
export const formatIST = (timeString: string): string => {
    if (!timeString) return '--:--';

    try {
        // Parse the date. We assume the server sends UTC-like strings without offset, 
        // OR the user specifically asked to "add +5:30". 
        // If the server string is effectively UTC but missing 'Z', we treat it as UTC.
        // Safari/Chrome handle "YYYY-MM-DD HH:MM:SS" differently. 
        // Best approach: replace space with T and append Z to force UTC interpretation, 
        // THEN convert to IST.
        
        let safeTimeStr = timeString.replace(' ', 'T');
        if (!safeTimeStr.endsWith('Z') && !safeTimeStr.includes('+')) {
            safeTimeStr += 'Z'; 
        }

        const date = new Date(safeTimeStr);
        
        // If date is invalid, fallback
        if (isNaN(date.getTime())) {
            return timeString.split(' ')[1] || timeString; // Fallback to raw part
        }

        return date.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        console.error("Time format error", e);
        return timeString;
    }
};

/**
 * Returns true if the date is within the last N seconds
 */
export const isRecent = (timeString: string, seconds: number = 10): boolean => {
    try {
        let safeTimeStr = timeString.replace(' ', 'T');
        if (!safeTimeStr.endsWith('Z') && !safeTimeStr.includes('+')) {
            safeTimeStr += 'Z'; 
        }
        const date = new Date(safeTimeStr);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000;
        return diff < seconds;
    } catch {
        return false;
    }
};
