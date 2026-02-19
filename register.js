const password = document.getElementById("password");

    function genPassword(){
        var chars = "0123456789abcdefghijklmnopqrstuv!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        var passLength = 10;
        var password = "";
        for(var i = 0; i < passLength; i++){
            var randomNumber = Math.floor(Math.random()* chars.length);
            password += chars.substring(randomNumber, randomNumber + 1)
        }
        document.getElementById("password").value = password;
    }

function logOut() {
    // Clear user session but keep the expenses (or clear everything if you prefer)
    localStorage.removeItem('loggedInUser');
    window.location.href = "index.html"; 
}        