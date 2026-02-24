// utils/challengeHelpers.js

// Gibt "YYYY-MM-DD" für Berlin zurück (z.B. "2026-02-19")
function berlinTodayString() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
}


function prevDay(dateStr) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);

    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" })
        .format(d);
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

function updateLog(progress, taskId, completed) {
    const today = berlinTodayString();

    // Heutigen Tag finden
    let entry = progress.streakLog.find((e) => e.date === today);

    if (completed) {
        // Wenn Tag nicht existiert: anlegen
        if (!entry) {
            progress.streakLog.push({ date: today, taskIds: [taskId] });
            return;
        }
        // ID hinzufügen (falls nicht drin)
        if (!entry.taskIds.includes(taskId)) {
            entry.taskIds.push(taskId);
        }
    } else {
        // Undo: wenn Tag nicht existiert, fertig
        if (!entry) return;

        // ID entfernen
        entry.taskIds = entry.taskIds.filter((id) => id !== taskId);

        // Wenn Tag leer: Tag löschen
        if (entry.taskIds.length === 0) {
            progress.streakLog = progress.streakLog.filter((e) => e.date !== today);
        }
    }
}

// 2) Streak aus Log berechnen: zählt nur Tage (heute, gestern, vorgestern...)
function recomputeStreak(progress) {
    const today = berlinTodayString();
    const daySet = new Set(progress.streakLog.map((e) => e.date));

    let streak = 0;
    let d = today;

    while (daySet.has(d)) {
        streak++;
        d = prevDay(d);
    }

    progress.currentStreak = streak;
    if (streak > progress.highestStreak) progress.highestStreak = streak;
}

function checkStreakGet(p) {
    const today = berlinTodayString();
    const yesterday = prevDay(today);

    const dates = p.streakLog.map((e) => e.date);

    const hasToday = dates.includes(today);
    const hasYesterday = dates.includes(yesterday);

    if (!hasToday && !hasYesterday) {
        p.currentStreak = 0;
        return true; // changed
    }

    return false;
}

module.exports = {
    isChallengeCompleted,
    resetDailyIfNewDay,
    updateLog,
    recomputeStreak,
    checkStreakGet,
};