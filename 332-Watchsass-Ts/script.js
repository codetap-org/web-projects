"use strict";
const setCSSVariable = (variableName, newValue) => {
    document.documentElement.style.setProperty(`--${variableName}`, newValue);
};
const displayedHours = 12;
const displayedMinutes = 60;
const oneTickInDeg = 360 / 60;
const oneHourDeg = 360 / displayedHours;
const getAngles = (time = new Date()) => {
    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    const hours = time.getHours();
    const secondsAngle = seconds * oneTickInDeg;
    const minutesAngle = (minutes + seconds / 60) * oneTickInDeg;
    const hoursAngle = (hours % displayedHours + minutes / 60) * oneHourDeg;
    return { secondsAngle, minutesAngle, hoursAngle };
};
const setTimeState = () => {
    const { secondsAngle, minutesAngle, hoursAngle } = getAngles();
    setCSSVariable('seconds-needle-angle', `${secondsAngle}deg`);
    setCSSVariable('minutes-needle-angle', `${minutesAngle}deg`);
    setCSSVariable('hours-needle-angle', `${hoursAngle}deg`);
    requestAnimationFrame(setTimeState);
};
setTimeState();
/**
* Create Watch numbers and graduations
**************************************/
const hours = [...Array(displayedHours).keys()].map((i) => i + 1);
const minutes = [...Array(displayedMinutes).keys()].map((i) => i + 1);
const createNumberElement = (hour) => {
    const div = document.createElement('div');
    div.classList.add('numbers', `number-${hour}`);
    div.style.transform = `rotateZ(${hour * oneHourDeg}deg)`;
    div.innerText = `${hour}`;
    return div;
};
const createMinutesElement = (minute) => {
    const div = document.createElement('div');
    div.classList.add('graduation');
    if (minute % 5 === 0)
        div.classList.add('big');
    div.style.transform = `rotateZ(${minute * oneTickInDeg}deg)`;
    return div;
};
const watchElements = Array.from(document.querySelectorAll('.watch'));
watchElements.forEach((watchElement) => {
    hours.forEach((hour) => watchElement.appendChild(createNumberElement(hour)));
    minutes.forEach((minute) => watchElement.appendChild(createMinutesElement(minute)));
});