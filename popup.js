var isLoggedIn = false;

$(document).ready(function(){
    chrome.storage.sync.get(function(result){
        console.log(result);
        if(result['loggedInUser']){
            location.href = "list.html?id=" + result['loggedInUser'].id + "&password=" + result['loggedInUser'].password;
        }
    });

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


    $("#login").submit(function(event){
        event.preventDefault();
        var data = {};
        $("#login").serializeArray()
                   .forEach(function(element) {
                        if (data[element.name]) {
                            data[element.name] = [data[element.name]];
                            data[element.name].push(element.value);
                        } else {
                            data[element.name] = element.value;
                        }
                   });
        console.log("Form Data: ", data);
        $.get("https://diktoapi.appspot.com/api/v1/users/"+data.userid+"/"+data.password)
            .then(function(res){
                var response = JSON.parse(res);
                if(response["error"]){
                    console.log(response["error"]);
                    // TODO: add prompt for incorrect password
                } else {
                    chrome.storage.sync.set({[response["id"]]: response, loggedInUser: response}, function(){
                        console.log("User data saved to storage.");
                    });
                    location.href = "list.html?id=" + data.userid + "&password=" + data.password;
                }
                // ko.applyBindings(new AppViewModel(user));
            })
            .catch(function(err){
                console.log(err)
                // chrome.storage.sync.get("user", function(result) {
                //     console.log("User data loaded from storage.");
                //     console.log(result.user);
                //     ko.applyBindings(new AppViewModel(result.user));
                // });
            });
    });

    $("#showSignUp").click(function(){
        console.log("Sign up clicked");
        $("#login").hide();
        $("#signUpButton").hide();
        $("#signup").show();
    });
    

    $("#generate").click(function(e){
        e.preventDefault();
        $.get("https://cors-anywhere.herokuapp.com/https://englishstoryserver.appspot.com/UserIdRegister?os=chrome")
            .then(function(res) {
                var data = JSON.parse(res);
                $("#userId").val(data.userId);
                $("#password").val(data.password);
            })
            .catch(function(err) {
                console.log(err);
            });
    });

    $("#back").click(function(e){
        $("#login").toggle();
        $("#signUpButton").toggle();
        $("#signup").toggle();
    });
});

function getParameterByName( name ){
    var regexS = "[\\?&]"+name+"=([^&#]*)", 
  regex = new RegExp( regexS ),
  results = regex.exec( window.location.search );
  if( results == null ){
    return "";
  } else{
    return decodeURIComponent(results[1].replace(/\+/g, " "));
  }
}