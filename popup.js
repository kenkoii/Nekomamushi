var isLoggedIn = false;

$(document).ready(function(){
    $("#submit").click(function(){
        console.log("Tidert");
        var userid = $("#userid").val();
        var password = $("#password").val();
        if(userid !== '' && password !== ''){
            checkAPI(userid, password).then(function(res){
                if(res === '1'){
                    isLoggedIn = !isLoggedIn;
                    console.log("Correct Password");
                } else {
                    console.log("Incorrect Password");
                }
            });
        }
    });

    function checkAPI(userid, password) {
        var apiURL = "https://cors-anywhere.herokuapp.com/https://englishstoryserver.appspot.com/ConfirmPassword"
        var reqURL = apiURL + "?userId=" + userid + "&password=" + password
        return $.get(reqURL,function(){
                console.log('Called API');
            });
    }
});