let eye = document.getElementById('eye')
let eye2 = document.getElementById('eye2')
let pass = document.getElementById('login-password')
let repass = document.getElementById('login-repassword')

eye.onclick = function() {
    if(pass.type == 'password') {
        pass.type = 'text'
        eye.src = '../images/eye.png'
    } else {
        pass.type = 'password'
        eye.src = '../images/close-eye.png'
    }
}

eye2.onclick = function() {
    if (repass.type == 'password') {
        repass.type = 'text'
        eye2.src = '../images/eye.png'
    } else {
        repass.type = 'password'
        eye2.src = '../images/close-eye.png'
    }
}