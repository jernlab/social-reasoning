/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

// All pages to be loaded
var pages = [
	"instructions/instruct-1.html",
	// "instructions/instruct-2.html",
	// "instructions/instruct-3.html",
	// "instructions/instruct-ready.html",
	"stage.html",
	"postquestionnaire.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // add as a list as many pages as you like
	"instructions/instruct-1.html",
	// "instructions/instruct-2.html",
	// "instructions/instruct-3.html",
	// "instructions/instruct-ready.html"
];


/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested 
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and 
* insert them into the document.
*
********************/

/********************
* STROOP TEST       *
********************/
var InteractionsExperiment = function() {

	var wordon, // time word is presented
	    listening = false;

	var names = _.shuffle(['Jacob', 'David', 'Luke', 'Rebecca', 'Matt', 'Jack', 'Frank', 'Geoff', 'Robert', 'Emily', 'Zoe', 'Maria']);

	var pd = [[8, 8],[0, 12],[12, 0],[4,4]]
	var threat = [[12, 6],[6, 12],[6, 0],[0,6]]
	var disjunctive = [[12,12], [12,12], [12,12], [0,0]]
	var coordination = [[12,12], [0,0], [0,0], [12,12]]
	var singleControl = [[6,6], [0,6], [6,6], [0,6]]

	var rowChoices = [0,1,2,3,4]
	var playerChoices = ["A","B"]

	var buildTableString = function(game, players, selected){
		tablestr = "<table border=\"1\" class=\"gameTable\">"
		tablestr += "<tr>" +
				"<th>" + players[0] + "'s Choice</th>" +
				"<th>" + players[1] + "'s Choice</th>" +
				"<th>Reward for " + players[0] + "</th>" +
				"<th>Reward for " + players[1] + "</th>" +
			"</tr>" 
		for(i = 0; i < 4; i++){
			tablestr += "<tr>" +
				"<td>" + playerChoices[Math.floor(i/2)] + "</td>" +
				"<td>" + playerChoices[(i%2)] + "</td>" +
				"<td>" + game[i][0] + "</td>" +
				"<td>" + game[i][1] + "</td>" +
			"</tr>" 
		}

		tablestr += "</table>";

		return tablestr;
	};



	attention = Math.floor(Math.random() * (5 - 1) + 1);
	console.log(attention)
	stims = _.shuffle(rowChoices);
	games = _.shuffle([pd, threat, disjunctive, coordination, singleControl])
	counter = 1
	var next = function() {
		d3.select("#trialn").html("Situation " + counter)
		counter++;
		chosenNames = [names.shift(),names.shift()]

		if (games.length == 0) {
			finish();
		} else if (games.length == attention) {
			// finish();
			d3.select('#names').html("Please set all of the sliders to 0, and leave the text box blank, so that we know you are still paying attention.");
			d3.select("#table").html(buildTableString(pd, chosenNames, row));
			console.log("attention check")
			attention = 500
		} else {
			game = games.shift();
			// show_word( stim[0], stim[1] );
			wordon = new Date().getTime();
			// listening = true;
			row = 1
			d3.select('#names').html(chosenNames[0] + " chose option A and "+ chosenNames[1] +" chose option B. This resulted in "+chosenNames[0]+" receiving $" + game[row][0] + ", and "+chosenNames[1]+" receiving $"+game[row][1] +".");
			d3.select("#table").html(buildTableString(game, chosenNames, row));
			// d3.select("#nextbutton").on("click", function(){console.log("wow!")})
		}
	};

	
	var response_handler = function(e) {
		if (!listening) return;

		var keyCode = e.keyCode,
			response;

		switch (keyCode) {
			case 82:
				// "R"
				response="red";
				break;
			case 71:
				// "G"
				response="green";
				break;
			case 66:
				// "B"
				response="blue";
				break;
			default:
				response = "";
				break;
		}
		if (response.length>0) {
			listening = false;
			var hit = response == stim[1];
			var rt = new Date().getTime() - wordon;

			psiTurk.recordTrialData({'phase':"TEST",
                                     'word':stim[0],
                                     'color':stim[1],
                                     'relation':stim[2],
                                     'response':response,
                                     'hit':hit,
                                     'rt':rt}
                                   );
			remove_word();
			next();
		}
	};

	var finish = function() {
	    $("body").unbind("keydown", response_handler); // Unbind keys
	    currentview = new Questionnaire();
	};
	
	var show_word = function(text, color) {
		d3.select("#stim")
			.append("div")
			.attr("id","word")
			.style("color",color)
			.style("text-align","center")
			.style("font-size","150px")
			.style("font-weight","400")
			.style("margin","20px")
			.text(text);
	};

	var remove_word = function() {
		d3.select("#word").remove();
	};

	
	// Load the stage.html snippet into the body of the page
	psiTurk.showPage('stage.html');

	// Register the response handler that is defined above to handle any
	// key down events.
	$("body").focus().keydown(response_handler); 
	$("#next").click(function () {
		remove_word();
		next();
	});

	// Start the test
	next();
};


/****************
* Questionnaire *
****************/

var Questionnaire = function(data) {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});

	};

	prompt_resubmit = function() {
		document.body.innerHTML = error_message;
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		document.body.innerHTML = "<h1>Trying to resubmit...</h1>";
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: function() {
			    clearInterval(reprompt); 
                psiTurk.computeBonus('compute_bonus', function(){finish()}); 
			}, 
			error: prompt_resubmit
		});
	};

	// Load the questionnaire snippet 
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});
	
	$("#next").click(function () {
	    record_responses();
	    psiTurk.saveData({
            success: function(){
                psiTurk.computeBonus('compute_bonus', function() { 
                	psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                }); 
            }, 
            error: prompt_resubmit});
	});
    
	
};

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
    	instructionPages, // a list of pages you want to display in sequence
    	function() { currentview = new InteractionsExperiment(); } // what you want to do when you are done with instructions
    );
});
