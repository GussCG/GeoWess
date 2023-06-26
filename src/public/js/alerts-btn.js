const close = document.getElementById('close');
const alert = document.getElementById('alert');

close.addEventListener('click', () => {
    alert.style.display = 'none';
    fadeinout(alert, 500);
});

function fadeinout(element, time) {
    var intervalID = setInterval(function () {
        var opacity = Number(window.getComputedStyle(element).getPropertyValue("opacity"));
        if (opacity > 0) {
            opacity = opacity - 0.1;
            element.style.opacity = opacity;
        } else {
            clearInterval(intervalID);
        }
    }, time / 10);
}