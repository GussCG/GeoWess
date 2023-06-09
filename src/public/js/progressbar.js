let progressbar = document.getElementsByClassName('progress-bar-fill');
let progress = document.getElementsByClassName('progress_bar-value');

for (let i = 0; i < progressbar.length; i++) {
        progressbar[i].style.width = progress[i].innerHTML;
}
