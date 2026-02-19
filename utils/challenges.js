// utils/challengeHelpers.js

// Gibt "YYYY-MM-DD" für Berlin zurück (z.B. "2026-02-19")
function berlinTodayString() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
}

// 1) Check: ist Challenge completed?
function isChallengeCompleted(progress, challenge) {
    const daysTotal = Number(challenge.days) || 0;
    if (daysTotal <= 0) return false;

    // Wir vergleichen nur Datum (YYYY-MM-DD)
    const startDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" })
        .format(new Date(progress.startedAt));

    const today = berlinTodayString();

    const diffDays = (new Date(today) - new Date(startDate)) / (1000 * 60 * 60 * 24);

    return diffDays >= daysTotal;
}

// 2) Daily Reset: wenn neuer Tag -> dailyCompletedTasks leeren
// Rückgabe: true wenn etwas geändert wurde, sonst false
function resetDailyIfNewDay(progress) {
    const today = berlinTodayString();

    if (progress.lastDailyResetDate !== today) {
        progress.dailyCompletedTasks = [];
        progress.lastDailyResetDate = today;
        return true;
    }

    return false;
}

module.exports = {
    isChallengeCompleted,
    resetDailyIfNewDay,
};