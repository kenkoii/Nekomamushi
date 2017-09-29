
const MICROSOFT_SUBSCRIPTION_KEY = '07657cb89d4c4136b5165509a16c469a';
const MICROSOFT_TOKEN_ENDPOINT = 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken?Subscription-Key=';
const MICROSOFT_TRANSLATE_ENDPOINT = 'https://api.microsofttranslator.com/v2/http.svc/Translate?appid=Bearer%20';
const MICROSOFT_REQUEST_HEADER = {  'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin' : '*',
                                    'Accept': 'application/jwt' };
// var getUrl = window.location;
// var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[0];
var baseUrl = 'https://diktoapi.appspot.com/'
const API_URL = baseUrl + 'api/v1/';
var internetStatus = 'online';


function AppViewModel(data) { 
    var self = this;
    self.user = ko.observable(data);
    self.activeTab = ko.observable("studying");
    self.studying = ko.observableArray([]);
    self.mastered = ko.observableArray([]);
    self.studyingBuffer = ko.observableArray([]);
    self.masteredBuffer = ko.observableArray([]);
    self.selected = ko.observable("favorites");
    self.isPromptFave = ko.observable(false);
    self.selectedWord = ko.observable({});
    self.connection = ko.observable(internetStatus);
    checkUser();

    self.user.subscribe((user) => {
        console.log("Change Detected");
        chrome.storage.sync.set({"user": user}, function(){
            console.log("User data saved to storage.");
        });
        self.updateUser();
    });

    self.setActiveTab = function(tab) {
        if(self.activeTab() != tab){
            tabsAudio.play();
            self.activeTab(tab);
        }
        console.log(self.activeTab());
    }

    self.isActive = function(tab) {
        return self.activeTab() == tab ? true : false;
    }

    self.removeFavorite = function(favorite) {
        // console.log(favorite);
        self.removeFavoriteAjax(favorite.word).then(() => {
            console.log(favorite);
            if(favorite.status === 'studying') {
                self.studying.remove(favorite);
            } else {
                self.mastered.remove(favorite);
            }
            self.selectedWord({})
        })
    }


    self.unfavoriteWord = function() {
        self.removeFavorite(self.selectedWord());
        self.isPromptFave(false);
    }

    self.togglePromptFave = function() {
        var isPrompt = self.isPromptFave();
        self.isPromptFave(!isPrompt);
        self.selectedWord(this);
    }


    self.toggleFavorite = function(favorite) {
        console.log("Toggle Favorite WordViewModel: ", favorite);
        if(favorite.status === 'studying') {
            favorite.status = 'mastered';
            self.studying.remove(favorite)
            self.mastered.push(favorite);
        } else {
            favorite.status = 'studying';
            self.mastered.remove(favorite);
            self.studying.push(favorite);
        }
        self.user().favorites.map(function(fav){
            if(fav.word === favorite.word) {
                fav.status = fav.status === 'studying' ? 'mastered' : 'studying';
            }
            return fav;
        });
        self.user(self.user());
        self.masteredBuffer(self.mastered())
        self.studyingBuffer(self.studying())
        console.log('Studying: ', self.studying());
        console.log('Mastered: ', self.mastered());
        console.log('User: ', self.user());
    }

    self.toggleSort = function() {
        toggleAudio.play();
        self.user().settings.sortAZ = !self.user().settings.sortAZ;
        self.user(self.user());
        console.log("ToggleSort pressed: ", self.user().settings.sortAZ);
    }

    self.togglePronunciation = function() {
        toggleAudio.play();
        self.user().settings.showPronunciation = !self.user().settings.showPronunciation;
        self.user(self.user());
        console.log("togglePronunciation pressed: ", self.user().settings.showPronunciation);
    }

    self.toggleTranslation = function() {
        toggleAudio.play();
        self.user().settings.showTranslation = !self.user().settings.showTranslation;
        self.user(self.user());
        console.log("toggleTranslation pressed: ", self.user().settings.showTranslation);
    }

    self.toggleTime = function() {
        toggleAudio.play();
        self.user().settings.showTime = !self.user().settings.showTime;
        self.user(self.user());
        console.log("toggleTime pressed: ", self.user().settings.showTime);
    }

    self.close = function() {
        backAudio.play();
        // location.href = 'uniwebview://close';
        window.close();
    }

    self.logout = function() {
        chrome.storage.sync.remove("loggedInUser", function(){
            location.href = "popup.html";
        });
    }

    self.switchWindow = function() {
        clickAudio.play();
        if(self.selected() == 'settings'){
            self.selected('favorites');
        } else {
            self.selected('settings');
        }
    }

    self.onStudyingScroll = function(data, event) {

        // Fetch variables
        var scrollTop = event.target.scrollTop;
        var windowHeight = $('#studying').height();
        var bodyHeight = $(document).height() - windowHeight;
        var scrollPercentage = (scrollTop / bodyHeight);

        // if the scroll is more than 90% from the top, load more content.
        if(scrollPercentage > 0.7) {    
            console.log('Scrolled!!!\n');
            for (let i = 0; i < 1 && self.studyingBuffer().length < self.studying().length; i++) {
                console.log('Added: \n', self.studying()[self.studyingBuffer().length + i])
                self.studyingBuffer.push(self.studying()[self.studyingBuffer().length + i]);
            }
        }
    }

    self.onMasteredScroll = function(data, event) {

        // Fetch variables
        var scrollTop = event.target.scrollTop;
        var windowHeight = $('#mastered').height();
        var bodyHeight = $(document).height() - windowHeight;
        var scrollPercentage = (scrollTop / bodyHeight);

        // if the scroll is more than 90% from the top, load more content.
        if(scrollPercentage > 0.7) {    
            console.log('Scrolled!!!\n');
            for (let i = 0; i < 1 && self.masteredBuffer().length < self.mastered().length; i++) {
                console.log('Added: \n', self.mastered()[self.masteredBuffer().length + i])
                self.studyingBuffer.push(self.mastered()[self.masteredBuffer().length + i]);
            }
        }
    }

    self.removeFavoriteAjax = function(word) {
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
                console.log("Ajax Result: ", result);
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

    function checkUser() {
        self.studying(getStudying(self.user().favorites));
        self.mastered(getMastered(self.user().favorites));
        for (let i = 0; i < 10; i++) {
            if (self.studying()[i]) {
                self.studyingBuffer.push(self.studying()[i]);
            }
            if (self.mastered()[i]) {
                self.masteredBuffer.push(self.mastered()[i]);
            }
        }
    }

        function getStudying(favorites) {
        favorites = favorites || [];
        return favorites.filter(function(favorite) {
            return favorite.status == 'studying';
        }).map(function(favorite) {
            return new WordViewModel(favorite, self);
        });
    }

    function getMastered(favorites) {
        favorites = favorites || [];
        return favorites.filter(function(favorite) {
            return favorite.status == 'mastered';
        }).map(function(favorite) {
            return new WordViewModel(favorite, self);
        });
    }
}

function WordViewModel(favorite, parent) {
    var self = this;


    // Hammer JS variables
    self.alpha = ko.observable(1);
    self.x = ko.observable(0);
    self.actX = ko.observable(0);
    self.startX = ko.observable(0);

    
    self.word = favorite.word;
    self.status = favorite.status;
    self.created = favorite.created;

    self.timeCreated = moment(self.created).fromNow();

    self.el = ko.observable({});

    self.wordObj = ko.observable({});
    
    getWord(self.word)
        .then(function(data) {
            console.log(data);
            if(data.translation === ''){
                getTranslation(data.text);
            }
            chrome.storage.local.set({ [self.word] : data});
            self.wordObj(data);
        })
        .catch(function(err){
            console.log(err);
            chrome.storage.local.get(self.word, function(result){
                // result
                console.log(result[self.word]);
                self.wordObj(result[self.word]);
            });
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

    self.goToWord = function() {
        // clickAudio.addEventListener('play', () => {
            
        // }, false)
        clickAudio.play();
        // var getUrl = window.location;
        //     var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[0];
        // var params = '?id=' + parent.user().id + '&password=' + parent.user().password;
        var params = '&id=' + parent.user().id + '&password=' + parent.user().password;
        var url = baseUrl + 'word/' + self.wordObj().text + params;
        console.log('link: ', url)
        // window.location.href = url;
        window.location.href = 'detail.html' + '?word='+ self.wordObj().text + params;
    };


    self.playAudio = function() {
        console.log(self.wordObj().text);
        const src = self.wordObj().audio.replace(/^http:\/\//i, 'https://');
        if (self.wordObj) {
            var audio = new Audio();
            audio.src = src || '';
            audio.addEventListener('play', () => {
                console.info("Audio Played! \nAudio source: ", src);
            })
            audio.load();

            // Determine load status from readyState. 
            if(audio.readyState === 4)  { 
                audio.play();
            } else { 
                // Set the event notification of when it becomes playable state if it is not renewable state 
                audio.addEventListener('canplaythrough', function(e){ 
                    audio.removeEventListener('canplaythrough', arguments.callee); 
                    audio.play();
                }); 
            }
        }

        
    }

    self.onPan = function(data, event) {
        event.preventDefault();
        //PROBLEM : for some reason, offsetWidth 
        element = self.el();
        // element = event;
        // console.log(element.offsetWidth);
        // console.log(self);
        const transferPoint = 207;
        // const transferPoint = element.offsetWidth * .6;

        if (self.status === 'mastered') {
            // console.log("deltaX:" + event.deltaX)
            // console.log("Mastered")
            if (event.deltaX <= 0) {
                self.x(self.startX() + event.deltaX)
                self.actX(self.x() * -1);
                self.alpha(self.alpha() - 0.01);
                // console.log(self.x() + " : " + (transferPoint * -1));
            }
        } else {
            // console.log("deltaX:" + event.deltaX)
            // console.log("Studying")
            if (event.deltaX >= 0) {
                self.x(self.startX() + event.deltaX);
                self.actX(self.x() * -1);
                self.alpha(self.alpha() - 0.01);
                // console.log(self.x() + " : " + (transferPoint));
            }
        }

        if (self.x() >= transferPoint) {
            // console.log('success transfering to master');
            self.toggleStatus(favorite, event);
            slideAudio.play();
        } else if (self.x() <= (transferPoint * -1)) {
            self.toggleStatus(favorite, event);
            slideAudio.play();
            // console.log('transfered to Studying');
        }   
    }

    self.onPanEnd = function(data, event) {
        resetVariables();
        // this.isDragged = false
        self.alpha(1);
    }

    function resetVariables() {
        self.actX(0);
        self.x(0);
        self.startX(0);
    }
    
    self.toggleStatus = function(favorite, event) {
        var context = ko.contextFor(event.target);
        if(context) {
            // context.$parent.toggleStatus(favorite);
            context.$parent.toggleFavorite(self);
        }
    }

    function getWord(word) {
        // TODO: custom request(only request for needed info)
        return $.ajax({
            url: API_URL + 'words/' + word,
            method: 'get',
            dataType: 'json'
        });
        
        // $.getJSON(API_URL + 'words/' + word, function(data) {
        //     console.log(data);
        //     if(data.translation === ''){
        //         getTranslation(word);
        //     }
        //     self.wordObj(data);
        // });
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


( function( window, ko ) {
    console.log("Hammer loaded");
    var touchEvents = [ 'tap', 'pan', 'panright', 'panleft', 'panmove', 'panend'
    ];

    var makeMobileBindings = function( touchEventName ) {
        ko.bindingHandlers[ touchEventName ] = {
            init: function( element, valueAccessor, allBindingsAccessor, viewModel, bindingContext ) {
                var handler = valueAccessor(),
                    allBindings = allBindingsAccessor();
                Hammer( element ).on( touchEventName, function( e ) {
                    handler( viewModel, e );
                } );
            }
        };
    };

    ko.bindingHandlers.element = {
        init: function(element, valueAccessor) {
            var target = valueAccessor();
            target(element);
        }
    };

    ( function() {
        for ( i in touchEvents ) {
            var eventName = touchEvents[ i ];
            makeMobileBindings( eventName );
        }
    } )();

    var id = getParameterByName('id');
    var password = getParameterByName('password');

    // Activates knockout.js
    $.get("https://diktoapi.appspot.com/api/v1/users/"+ id +"/" + password)
        .then(function(res){
            var user = JSON.parse(res);
            chrome.storage.sync.set({[id]: user}, function(){
                console.log("User data saved to storage.");
            })
            ko.applyBindings(new AppViewModel(user));
        })
        .catch(function(err){
            console.log(err)
            chrome.storage.sync.get([id], function(result) {
                console.log("User data loaded from storage.");
                console.log(result[id]);
                ko.applyBindings(new AppViewModel(result[id]));
            });
        });
}( this, ko ) );

function logStatusOnline(){
    console.log("Online!");
    internetStatus = 'online';
}

function logStatusOffline(){
    console.log("Offline");
    internetStatus = 'offline';
}

window.addEventListener('online', logStatusOnline);
window.addEventListener('offline', logStatusOffline);


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