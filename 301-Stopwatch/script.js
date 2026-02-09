const stopwatch = () => {
    const toggleBtn = document.querySelector(".toggle-btn");
    const resetBtn = document.querySelector(".reset-btn");
    const lapBtn = document.querySelector(".lap-btn");
    const lapsTitle = document.querySelector(".laps-title");

    const [minutes, seconds, milliseconds] = [
        ".minutes",
        ".seconds",
        ".milliseconds"
    ].map((sel) => document.querySelector(sel));

    const lapsList = document.querySelector(".laps");

    let rafId = null;
    let startTime = 0;
    let isRunning = false;

    const data = {
        elapsedTime: 0,
        laps: []
    };

    const formatElapsedTime = (ms) => {
        const pad = (n) => String(n).padStart(2, "0");
        const total = Math.floor(ms);

        return {
            minutes: pad(Math.floor(total / 60000)),
            seconds: pad(Math.floor((total % 60000) / 1000)),
            milliseconds: pad(Math.floor((total % 1000) / 10))
        };
    };

    const updateTimeDisplay = () => {
        const t = formatElapsedTime(data.elapsedTime);
        minutes.textContent = t.minutes;
        seconds.textContent = t.seconds;
        milliseconds.textContent = t.milliseconds;
    };

    const updateElapsedTime = () => {
        if (!isRunning) return;
        data.elapsedTime = performance.now() - startTime;
        updateTimeDisplay();
        rafId = requestAnimationFrame(updateElapsedTime);
    };

    const updateLaptime = () => {
        const hasLaps = data.laps.length > 0;

        lapsTitle.classList.toggle("is-muted", !hasLaps);

        if (!hasLaps) {
            lapsList.replaceChildren();
            return;
        }

        const time = data.laps.at(-1);
        const { minutes, seconds, milliseconds } = formatElapsedTime(time);

        const li = document.createElement("li");
        li.className = "lap-item is-new";
        li.innerHTML = `
            <span class="lap-label">Lap ${data.laps.length}</span>
            <span class="lap-time">${minutes}:${seconds}.${milliseconds}</span>
        `;

        lapsList.append(li);
    };

    const updateButtonStates = () => {
        toggleBtn.textContent = isRunning ? "Pause" : "Start";
        toggleBtn.setAttribute("aria-pressed", String(isRunning));

        lapBtn.disabled = !isRunning;
        resetBtn.disabled = isRunning || data.elapsedTime === 0;
    };

    const toggleStopwatch = () => {
        isRunning = !isRunning;

        if (isRunning) {
            startTime = performance.now() - data.elapsedTime;
            rafId = requestAnimationFrame(updateElapsedTime);
        } else {
            cancelAnimationFrame(rafId);
        }

        updateButtonStates();
    };

    const addNewLap = () => {
        if (!isRunning) return;
        data.laps.push(data.elapsedTime);
        updateLaptime();
    };

    const reset = () => {
        if (isRunning) return;

        data.elapsedTime = 0;
        data.laps = [];
        updateTimeDisplay();
        updateLaptime();
        updateButtonStates();
    };

    toggleBtn.addEventListener("click", toggleStopwatch);
    lapBtn.addEventListener("click", addNewLap);
    resetBtn.addEventListener("click", reset);

    updateTimeDisplay();
    updateLaptime();
    updateButtonStates();
};

stopwatch();