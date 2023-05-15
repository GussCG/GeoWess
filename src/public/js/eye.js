let eye = document.getElementById('eye')
let pass = document.getElementById('login-password')

eye.onclick = function() {
    if(pass.type == 'password') {
        pass.type = 'text'
        eye.src = '../images/eye.png'
    } else {
        pass.type = 'password'
        eye.src = '../images/close-eye.png'
    }
}