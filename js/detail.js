const MICROSOFT_SUBSCRIPTION_KEY = '07657cb89d4c4136b5165509a16c469a';
const MICROSOFT_TOKEN_ENDPOINT = 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken?Subscription-Key=';
const MICROSOFT_TRANSLATE_ENDPOINT = 'https://api.microsofttranslator.com/v2/http.svc/Translate?appid=Bearer%20';
const MICROSOFT_REQUEST_HEADER = {  'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin' : '*',
                                    'Accept': 'application/jwt' };

var getUrl = window.location;
var baseUrl = 'https://diktoapi.appspot.com/'
const API_URL = baseUrl + 'api/v1/';


function AppViewModel(data) {
    var self = this;
    self.wordObj = ko.observable(data.word);
    self.user = ko.observable(data.user || null);

    if(self.wordObj().translation === '') {
        getTranslation(self.wordObj().text);
    }

    self.isPromptFave = ko.observable(false);
    self.isFavorited = ko.computed(function(){
        console.log(self.user());
        if(self.user()){
            if(self.user().favorites) {
                var list = self.user().favorites.filter((favorite) => {
                    return favorite.word == self.wordObj().text;
                });
                return list.length > 0;                   
            }
        }
        return false;
    });

    self.isMastered = ko.computed(function(favorite){
        if(self.user()){
            self.user().favorites = self.user().favorites || [];
            var list = self.user().favorites.filter((favorite) => {
                return favorite.word == self.wordObj().text;
            });
            if(list[0]) {
                return list[0].status == 'mastered';
            }
        }
        return false;
    });

    // Computed data
    self.formattedPronunciation = ko.computed(function() {
        console.log(self.wordObj().text );
        var pronunciation = '';
        if(self.wordObj().pronunciation) {
            pronunciation = self.wordObj().pronunciation[0].IPA || '';
        }
        return '(' + pronunciation + ')';
    });

    self.toggleStatus = function() {
        toggleAudio.play();
        if(self.user()){
            self.user().favorites = self.user().favorites || [];
            console.log("Toggle Status pressed");
            var favorites = self.user().favorites.map(function(favorite){
                if(favorite && favorite.word === self.wordObj().text){
                    if(favorite.status === 'studying') {
                        favorite.status = 'mastered';
                    } else {
                        favorite.status = 'studying';
                    }
                }
                return favorite;
            });
            console.log("ToggleStatus: ",favorites);
            self.user().favorites = favorites;
            self.updateUser().then(()=>{
                self.user(self.user());
            })
        }
    }

    self.toggleFavorite = function() {
        clickAudio.play();
        if(self.user()){
            self.user().favorites = self.user().favorites || [];
            if(self.isFavorited()) {
                self.removeFavorite(self.wordObj().text).then(() => {
                    var favorites = self.user().favorites.filter((favorite) => {
                        return favorite.word != self.wordObj().text;
                    });
                    console.log(favorites);
                    self.user().favorites = favorites;
                    self.user(self.user());
                    console.log(self.user());
                });
            } else {
                self.addFavorite(self.wordObj().text).then((favorite) => {
                    self.user().favorites.push(favorite);
                    console.log("Favorite added:", favorite);
                    console.log(self.user().favorites);
                    self.user(self.user());
                    console.log(self.user());
                });
            }

        }
    }

    self.unfavoriteWord = function() {
        self.toggleFavorite();
        self.isPromptFave(false);
    }

    self.togglePromptFave = function() {
        var isPrompt = self.isPromptFave();
        if(isPrompt) {
            clickAudio.play();
        } else {
            promptAudio.play();
        }
        self.isPromptFave(!isPrompt);
    }

    self.goToWordList = function() {
        backAudio.play();
        var id = getParameterByName('id');
        var password = getParameterByName('password');
        if(self.user()){
            if(!self.user().error) {
                var getUrl = window.location;
                var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[0];
                // var url = baseUrl + 'list/' + self.user().id + '/' + self.user().password;
                var url = baseUrl + "list.html?id=" + id + "&password=" + password;
                console.log('link: ', url)
                window.location.href = url;
            }
        } else {
            // window.location.href = 'uniwebview://close';
            window.close();
        }
    };


    self.addFavorite = function(word) {
        
        const params = JSON.stringify({
                id: word,
                userid: self.user().id + "",
                password: self.user().password + ""
            });
        console.log(params);
        return $.ajax({
            url: API_URL + 'favorite/frontend',
            type: 'POST',
            data: params,
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function(result) {
                // self.user(result);
                console.log("Ajax Done!");
                return result;
            }
        });
    }

    self.removeFavorite = function(word) {
        const params = JSON.stringify({
                id: word,
                userid: self.user().id + "",
                password: self.user().password + ""
            });
        console.log(params);
        return $.ajax({
            url: API_URL + 'favorite/frontend/remove',
            type: 'POST',
            data: params,
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function(result) {
                // self.user(result);
                console.log("Ajax Done!");
                return result;
            }
        });
    }

    self.updateUser = function() {
        console.log("User Object: ", self.user());
        return $.ajax({
            url: API_URL + 'users/' + self.user().id,
            type: 'PUT',
            data: JSON.stringify(self.user()),
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function(result) {
                console.log(result);
                return result;
            },
            error: function(err){
                console.log(err);
            }
        });
    }

    function updateWord(word) {
        return $.ajax({
            url: API_URL + 'words/' + word,
            type: 'put',
            data: JSON.stringify(self.wordObj()),
            headers: MICROSOFT_REQUEST_HEADER,
            success: function(data){
                console.log(data);
            }
        });
    }

    function getTranslation(word) {
        const jwt = JWT.get();
        if(jwt === null) {
            getMicrosoftAccessToken().then(()=>{
                getMicrosoftTranslation(word);
            });
        } else {
            if(JWT.validate(jwt)){
                console.log(jwt);
                getMicrosoftTranslation(word);
            } else {
                getMicrosoftAccessToken().then(()=>{
                    getMicrosoftTranslation(word);
                });
            }
        }
    }

    function getMicrosoftTranslation(word) {
        const request = MICROSOFT_TRANSLATE_ENDPOINT + JWT.get() + '&text=' + word + '&to=' + 'ja';
        return $.get(request, function(data) {
            console.log(data);
            const parser = new DOMParser();
            const xmlData = parser.parseFromString(data, 'application/xml');
            console.log(xmlData);
            self.wordObj().translation = data.getElementsByTagName('string')[0].innerHTML;
            self.wordObj(self.wordObj());
            updateWord(self.wordObj().text);
            return data;
        });
    }

    function getMicrosoftAccessToken() {
        return $.ajax({
            url: MICROSOFT_TOKEN_ENDPOINT + MICROSOFT_SUBSCRIPTION_KEY,
            type: 'post',
            data: {},
            headers: MICROSOFT_REQUEST_HEADER,
            success: function(data){
                var jwtValue = data;
                JWT.keep(jwtValue);
                console.log(data);
            }
        });
    }
}

$(document).ready(function(){
    var id = getParameterByName('id');
    var password = getParameterByName('password');
    var word = getParameterByName('word');

    $.when(
        $.ajax(API_URL + 'words/'+ word),
        $.ajax(API_URL + 'users/' + id + '/' + password)
    ).then(function(word, user){
        var wordObject = JSON.parse(word[0]);
        var userObject = JSON.parse(user[0]);
        console.log(wordObject)
        console.log(userObject)
        chrome.storage.sync.set({"user": userObject}, function(){
            console.log("User data saved to storage.");
        })
        chrome.storage.sync.set({[word]: wordObject}, function(){
            console.log("Word data saved to storage.");
        })
        ko.applyBindings(new AppViewModel({word: wordObject, 
                                           user: userObject}));
    }).catch(function(err,err){
        chrome.storage.sync.get(function(result) {
            console.log("User data loaded from storage.");
            console.log(result.user);
            console.log(result[word]);
            ko.applyBindings(new AppViewModel({word: result[word], 
                user: result.user}));
        });
    });
    // $.ajax(API_URL + 'words/'+ word)
    //     .then(function(res){
    //         console.log(res);
    //         // Activates knockout.js
    //         ko.applyBindings(new AppViewModel({"word": JSON.parse(res)}));
    //     })
    //     .catch(function(err){
    //         console.log(err);
    //     });
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