let arrow = document.getElementById('arrow');
let menu = document.getElementById('menu-icons');
let navbar = document.getElementById('nav-bar');

arrow.style.transform = 'rotate(90deg)';

arrow.addEventListener('click', () => {
    navbar.classList.toggle('nav-bar-pill');
    menu.classList.toggle('menu-hide');
    arrow.style.transform = arrow.style.transform === 'rotate(90deg)' ? 'rotate(270deg)' : 'rotate(90deg)';
    }
);
