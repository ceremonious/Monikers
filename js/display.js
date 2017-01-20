var defaultHtml = '<h1>Welcome to Monikers!</h1> <div> <p class="numCards">Choose how many cards you would like to use: </p> <input class="numCards" type="number" id="numCardsInput" value="40"/> </div> <div> <p class="numCards">Team 1 Name: </p> <input class="numCards" type="text" id="team1Input"/> </div> <div> <p class="numCards">Team 2 Name: </p> <input class="numCards" type="text" id="team2Input"/> </div> <button type="button" onClick="startTurn()" id="startButton"><p>Start Round</p></button>'
var aboutToStartTurnHtml = "<p>%roundname%</p><p>Choose someone from %nextteam%</p><p>Cards Gussed: %guessedCount%</p><p>Cards Passed: %passedCount%</p><p>Cards Left In Deck: %deckCount%</p>"
var roundOverHtml = "<p>Round %roundnum% is over!</p><p>%winningmsg%</p><p>%team1%: %1teampoints%</p><p>%team2%: %2teampoints%</p><br><p>%roundname%</p><p>Cards in Deck: %deckCount%</p><p>Choose someone from %nextteam%</p>"
var aboutToStartGameHtml = "<p>%roundname%</p><p>Cards in Deck: %deckCount%</p><p>Choose someone from %nextteam%</p>"
var gameOverHtml = "<p>Game Over!</p><p>%winningmsg%</p><p>%team1%: %1teampoints%</p><p>%team2%: %2teampoints%</p>"
var button = '<button type="button" onClick="startTurn()" id="startButton"><p>Start Round</p></button>'
var restartbutton = '<button type="button" onClick="restart()" id="startButton"><p>Restart</p></button>'
var roundNames = ["Round 1: No Restrictions", "Round 2: One Word", "Round 3: Only Gestures"];

var game;
var timer;
var timeWhenTurnEnded;

$('document').ready(function(){
	if(localStorage.getItem("deck") != null) {
		game = new Game(parseInt(localStorage.getItem("cardNum")), 3, localStorage.getItem("blueName"), localStorage.getItem("redName"));
		game.restoreState();
		if(localStorage.getItem("currentPhase") == "newround")
			roundOver(true);
		else if(localStorage.getItem("currentPhase") == "newgame")
			gameAboutToStart();
		else
			turnAboutToStart();	
	}
});

function newGame(numCards, team1Name, team2Name) {
	game = new Game(numCards, 3, team1Name, team2Name);
	game.init();
}

function correct() {
	if(game.correct()) {
		var next = game.nextCard();
		if(next == -1) {
			roundOver();
		}
		else {
			document.getElementById("card").src = cardToImg(next);
		}
	}
}

function pass() {
	if(game.pass()) {
		var next = game.nextCard();
		if(next == -1)
			roundOver();
		else 
			document.getElementById("card").src = cardToImg(next);
	}
}

function undo() {
	if(game.undo())
		document.getElementById("card").src = cardToImg(game.currentCard);
}

//When this is clicked, it is either because the turn is being started or being the settings have been entered and the game is about to start
function startTurn() {
	if(game == null) {
		var numcards = $("#numCardsInput").val();
		var team1 = $("#team1Input").val();
		var team2 = $("#team2Input").val();
		if(numcards > 5 && team1 != "" && team2 != "" && team1 != team2) {
			newGame(numcards, team1, team2);
			gameAboutToStart();
		}
	}
	else {
		//If 2000 milliseconds has not passed since the turn ended, the next turn cannot be started
		if(new Date().getTime() - timeWhenTurnEnded < 2000)
			return;

		$("#cardContainer").empty();
		$("#cardContainer").html('<img id="card" src="' + cardToImg(game.nextCard()) + '"/>');
		$("#cardContainer").prepend('<div id="timer"></div>');
		$("#cardContainer").height("75%");
		$("#buttonContainer").show();
		var height = 5;
		timer = $("#timer").countdown360({
	  		radius      : 28,
	  		seconds     : 60,
	  		strokeWidth : 15,
	  		fillStyle   : '#0276FD',
	  		strokeStyle : '#003F87',
	  		fontSize    : 25,
	  		label: ["", ""],
	  		fontColor   : '#FFFFFF',
	  		autostart: false,
	  		smooth: true,
	  		onComplete: function(){turnAboutToStart()}
		})
		game.startTurn();
		timer.start();
	}
}

function gameAboutToStart() {
	var container = $("#cardContainer");
	container.empty();
	timeWhenTurnEnded = new Date().getTime();
	var html = aboutToStartGameHtml;
	html = html.replace("%roundname%", roundNames[0]);
	html = html.replace("%deckCount%", game.cardNum.toString());
	html = html.replace("%nextteam%", game.getNextTeam());
	container.html(html);
	container.append(button);
	container.height("95%");
	game.storeState("newgame");
}

//This sets up the screen that happens before the start of each turn. This is when the device is passed to the next person.
function turnAboutToStart() {
	$("#buttonContainer").hide();
	game.endTurn();
	timeWhenTurnEnded = new Date().getTime();
	var container = $("#cardContainer");
	container.empty();
	var html = aboutToStartTurnHtml;
	html = html.replace("%roundname%", roundNames[game.currentRound - 1]);
	html = html.replace("%deckCount%", game.deck.length.toString());
	html = html.replace("%nextteam%", game.getNextTeam());
	html = html.replace("%guessedCount%", game.cardsJustGotten.toString());
	html = html.replace("%passedCount%", game.cardsJustPassed.toString());
	container.html(html);
	container.append(button);
	container.height("95%");
	game.storeState("newturn");
}

//Restoring is false usually, however if the screen is being restored from a refresh/disconnect then timer/game is not manipulated.
function roundOver(restoring = false) {
	$("#buttonContainer").hide();
	timeWhenTurnEnded = new Date().getTime();
	if(!restoring) {
		game.endTurn();
		timer.stop();
	}
	if(!restoring && game.currentRound == 3) {
		gameOver();
	}
	else {
		if(!restoring)
			game.nextRound();
		var container = $("#cardContainer");
		container.empty();
		var html = roundOverHtml;
		html = html.replace("%roundnum%", (game.currentRound - 1).toString());
		html = html.replace("%winningmsg%", game.getGameStatus());
		html = html.replace("%team1%", game.blueName);
		html = html.replace("%1teampoints%", game.bluePoints.toString());
		html = html.replace("%team2%", game.redName);
		html = html.replace("%2teampoints%", game.redPoints.toString());
		html = html.replace("%roundname%", roundNames[game.currentRound - 1]);
		html = html.replace("%deckCount%", game.deck.length.toString());
		html = html.replace("%nextteam%", game.getNextTeam());
		container.html(html);
		container.append(button);
		container.height("95%");
		game.storeState("newround");
	}
}

function gameOver() {
	game.nextRound();
	var container = $("#cardContainer");
	container.empty();
	var html = gameOverHtml;
	html = html.replace("%winningmsg%", game.getFinalGameStatus());
	html = html.replace("%team1%", game.blueName);
	html = html.replace("%1teampoints%", game.bluePoints.toString());
	html = html.replace("%team2%", game.redName);
	html = html.replace("%2teampoints%", game.redPoints.toString());
	container.html(html);
	container.append(restartbutton);
	container.height("95%");
	game.clearState();
}

function cardToImg(card) {
	return "res/card" + card + ".png"
}

function pause() {
	timer.stop()
	var elapsed = timer.getElapsedTime()
	alert("The game is paused.")
	timer.start()
	timer.extendTimer(-1 * elapsed)
}

function restart() {
	var yes = confirm("Are you sure you want to restart?")
	if(yes) {
		game = null;
		localStorage.clear()
		$("#buttonContainer").hide()
		$("#cardContainer").html(defaultHtml)
		$("#cardContainer").height("95%")
	}
}