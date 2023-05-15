let progressbar = document.getElementsByClassName('progress-bar-fill');

let sizes = [];

sizes.push('74%', '10%', '90%', '50%');
let i = 0;

sizes.forEach(element => {
        progressbar[i++].style.width = element;
});
