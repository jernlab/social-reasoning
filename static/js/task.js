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
	"instructions/instruct-review.html",
	// "instructions/instruct-3.html",
	// "instructions/instruct-ready.html",
	"stage.html",
	"postquestionnaire.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // add as a list as many pages as you like
	"instructions/instruct-1.html",
];
var returnInstructions = [ // add as a list as many pages as you like
  "instructions/instruct-review.html",

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

	var availableNames = _.shuffle(['Jacob', 'David', 'Luke', 'Rebecca', 'Matt', 'Jack', 'Frank', 'Geoff', 'Robert', 'Emily', 'Zoe', 'Maria', 'Austin', 'Hannah', "Matthew", 'Gavin', 'William', "Logan", 'Ryan', 'Sydney', 'Lauren', 'Kate', 'Megan', 'Kaylee', 'Olivia', 'Daniel', 'Richmond', 'Gerald', 'Sally']);
       
       var attentionGame = {gameString:"attentionGame", game:[[8, 8],[12, 0],[0, 12],[4,4]], choices:_.shuffle([1])}       //???
	var pd = {gameString:"pd", game:[[8, 8],[0, 12],[12, 0],[4,4]], choices:_.shuffle([0 ,1, 3])}                            // 0 1 3
	var threat = {gameString:"threat", game:[[12, 6],[6, 12],[6, 0],[0,6]], choices:_.shuffle([ 0, 1, 2, 3])}                      //  0 1 2 3
	var disjunctive = {gameString:"disjunctive", game:[[12,12], [12,12], [12,12], [0,0]], choices:_.shuffle([0, 3])}      //  0 3
	var coordination = {gameString:"coordination", game:[[12,12], [0,0], [0,0], [12,12]], choices:_.shuffle([ 0, 1])}       //  0 1
	var singleControl = {gameString:"singleControl", game:[[6,6], [0,6], [6,6], [0,6]], choices:_.shuffle([0, 1])}              //  0 1

	var rowChoices = [0,1,2,3,4]
	var playerChoices = ["<span style=\"color:#FF0000\">A</span>","<span style=\"color:#0000FF\">B</span>"]

      var results = {}

	var buildTableString = function(game, players, selected){
		tablestr = "<table border=\"1\" class=\"gameTable\"><colgroup>" +
    "<col class=\"grey\" />" +
    "<col class=\"red\" span=\"2\" />" +
    "<col class=\"blue\" />" +
    "</colgroup>"
		tablestr += "<tr>" +
				"<th>" + players[0] + "'s Choice</th>" +
				"<th>" + players[1] + "'s Choice</th>" +
				"<th>Reward for " + players[0] + "</th>" +
				"<th>Reward for " + players[1] + "</th>" +
			"</tr>" 
		for(i = 0; i < 4; i++){
                    bgcolor = "bgcolor=\"#FFFFFF\""
                    if(selected == i){
                       bgcolor = "bgcolor=\"#FFFFAA\""

                    }
			tablestr += "<tr " + bgcolor + " >" +
				"<td>" + playerChoices[Math.floor(i/2)] + "</td>" +
				"<td>" + playerChoices[(i%2)] + "</td>" +
				"<td>$" + game.game[i][0] + "</td>" +
				"<td>$" + game.game[i][1] + "</td>" +
			"</tr>" 
		}

		tablestr += "</table>";

		return tablestr;
	};

      friendsAnswered = false 
      strangersAnswered = false 
      enemiesAnswered = false 
      justificationAnswered = false


      var gamesetup = function(names) {
        friendsAnswered = false 
        strangersAnswered = false 
        enemiesAnswered = false 
        justificationAnswered = false
          $("#friends").click(function(){friendsAnswered = true; $("#friendsdiv").css('background-color', "white")}) ;
          $("#strangers").click(function(){strangersAnswered = true; $("#strangersdiv").css('background-color', "white")}) ;
          $("#enemies").click(function(){enemiesAnswered = true; $("#enemiesdiv").css('background-color', "white")}) ;
          $("#judgements").click(function(){justificationAnswered = true; $("#judgements").css('background-color', "white")}) ;
          $("#instructionButton").off( 'click.someNamespace')
          $("#instructionButton").on( 'click.someNamespace', function(){
            console.log("Setting up new trial");
            state = $('body').html()
            psiTurk.doInstructions(
              returnInstructions, // a list of pages you want to display in sequence
              function() { $('body').html(state);
              gamesetup(names)} // what you want to do when you are done with instructions
            );
          // psiTurk.showPage("instructions/instruct-1.html")
          })


          console.log(game.choice)
          d3.select('#attention').html("");
          d3.select('#names').html(names[0] + " chose option " + playerChoices[Math.floor(game.choice/2)]  + " and "+ names[1] +" chose option " + playerChoices[(game.choice%2)] + ". This resulted in "+names[0]+" receiving $" + game.game[game.choice][0] + ", and "+names[1]+" receiving $"+game.game[game.choice][1] +".");
          d3.select("#table").html(buildTableString(game, names, game.choice));
          d3.select("#friends").property('value',50)
          d3.select("#strangers").property('value',50)
          d3.select("#enemies").property('value',50)
          d3.select("#judgements").property('value','')
          $("#nextbutton").off('click.someSpace');
          $("#nextbutton").on('click.someSpace', function () {
        // friendsAnswered = false 
        //   strangersAnswered = false 
        //   enemiesAnswered = false 
        //   justificationAnswered = false
          tocontinue = true
          if(!friendsAnswered){
            console.log("A question was left unanswered.")
            $("#friendsdiv").css('background-color', "#ffe0e0")
            tocontinue = false
          }
          if(!strangersAnswered){
            console.log("A question was left unanswered.")
            $("#strangersdiv").css('background-color', "#ffe0e0")
            tocontinue = false
          }
          if(!enemiesAnswered){
            console.log("A question was left unanswered.")
            $("#enemiesdiv").css('background-color', "#ffe0e0")
            tocontinue = false
          }
          if(!justificationAnswered){
            console.log("A question was left unanswered.")
            $("#judgements").css('background-color', "#ffe0e0")
            tocontinue = false
          }

          if(!tocontinue){
            // alert("Please answer for all of the fields")
            return
          }

 //           psiTurk.recordTrialData({'phase':"TEST",
 //                                            'word':stim[0],
 //                                            'color':stim[1],
 //                                            'relation':stim[2],
 //                                            'response':response,
 //                                            'hit':hit,
 //                                            'rt':rt}
 //                                          );\

            friendProb = d3.select("#friends")[0][0].value
            strangerProb = d3.select("#strangers")[0][0].value
            enemyProb = d3.select("#enemies")[0][0].value
            judgements = d3.select("#judgements")[0][0].value
            results[[game.gameString,row]] = {'game':game.gameString,
                'friendProb':friendProb,
                'strangerProb':strangerProb,
                'enemyProb':enemyProb,
                'judgements':judgements
            }


    next();
  });
      }
       

      chosenNames = [0,0]
        nTrials = 12

	stims = _.shuffle(rowChoices);
	games = _.shuffle([pd, threat, disjunctive, coordination, singleControl])
      trials = []
      i=0
      for(i in games){
        console.log(games[i])
        for(j in games[i].choices){
          trials.push({gameString:games[i].gameString,
            game:games[i].game,
            choice :games[i].choices[j]
          })
        }
      }
      games = trials
      attention = Math.floor(Math.random() * (trials.length - 2) + 2);
      console.log(attention)
      console.log(trials)
	counter = 0
      game = null
      nTrials = trials.length + 1
	var next = function() {
              window.scrollTo(0,0);
              counter++;
		d3.select("#trialNumber").html("Case "+counter+" of "+(nTrials))
		chosenNames = [availableNames.shift(),availableNames.shift()]
              row = Math.floor(Math.random() * 4 );

              // Reset all the forms
              d3.select("#friends").property('value',50)
              d3.select("#strangers").property('value',50)
              d3.select("#enemies").property('value',50)
              $("#friendsdiv").css('background-color', "white")
              $("#strangersdiv").css('background-color', "white")
              $("#enemiesdiv").css('background-color', "white")
              $("#judgements").css('background-color', "white")



		if (games.length == 0) {
			finish();
		} else if (games.length == attention) {
			// finish();
                    game=attentionGame
			d3.select('#names').html("");
                    d3.select('#attention').html("Please enter just a \"0\" in the text box, so that we know you are still paying attention.");
			
                    d3.select("#table").html(buildTableString(game, chosenNames, row));
			console.log("attention check")
			attention = 500
		} else {
			game = games.shift();
			// show_word( stim[0], stim[1] );
			wordon = new Date().getTime();
			// listening = true;
                    gamesetup(chosenNames)
			

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
	    strings = {attentionGame:"attentionGame", pd:"pd", threat:"threat", disjunctive:"disjunctive", coordination:"coordination", singleControl:"singleControl"}
          var rt = new Date().getTime() - wordon;    
          // items = [attentionGame, pd, threat, disjunctive, coordination, singleControl]
          // trials = []
          //       i=0
          //       for(i in games){
          //         console.log(games[i])
          //         for(j in games[i].choices){
          //           trials.push({game:games[i].game,
          //             choice :games[i].choices[j]
          //           })
          //         }
          //       }

          console.log(results)
          for(item in results){
            console.log("item")
            console.log(results[item[0]])
            // psiTurk.recordTrialData({'game':strings[items[item]],
            //                          'friendProb':results[items[item]]["friendProb"],
            //                          'strangerProb':results[items[item]]["strangerProb"],
            //                          'enemyProb':results[items[item]]["enemyProb"],
            //                          'judgements':results[items[item]]["judgements"],
            //                          //'hit':hit,
            //                          'rt':rt}
            //                        );

          }

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
	
	// Load the stage.html snippet into the body of the page
	psiTurk.showPage('stage.html');

	// Register the response handler that is defined above to handle 
	// $("#next").click(function () {
 //        // friendsAnswered = false 
 //        //   strangersAnswered = false 
 //        //   enemiesAnswered = false 
 //        //   justificationAnswered = false
 //          tocontinue = true
 //          if(!friendsAnswered){
 //            console.log("YOU DIDNT ANSWER IT")
 //            $("#friendsdiv").css('background-color', "#ffe0e0")
 //            tocontinue = false
 //          }
 //          if(!strangersAnswered){
 //            console.log("YOU DIDNT ANSWER IT")
 //            $("#strangersdiv").css('background-color', "#ffe0e0")
 //            tocontinue = false
 //          }
 //          if(!enemiesAnswered){
 //            console.log("YOU DIDNT ANSWER IT")
 //            $("#enemiesdiv").css('background-color', "#ffe0e0")
 //            tocontinue = false
 //          }
 //          if(!justificationAnswered){
 //            console.log("YOU DIDNT ANSWER IT")
 //            $("#judgements").css('background-color', "#ffe0e0")
 //            tocontinue = false
 //          }

 //          if(!tocontinue){
 //            alert("Please answer for all of the fields")
 //            return
 //          }

 // //           psiTurk.recordTrialData({'phase':"TEST",
 // //                                            'word':stim[0],
 // //                                            'color':stim[1],
 // //                                            'relation':stim[2],
 // //                                            'response':response,
 // //                                            'hit':hit,
 // //                                            'rt':rt}
 // //                                          );\
 //            friendProb = d3.select("#friends")[0][0].value
 //            strangerProb = d3.select("#strangers")[0][0].value
 //            enemyProb = d3.select("#enemies")[0][0].value
 //            judgements = d3.select("#judgements")[0][0].value
 //            results[game] = {'friendProb':friendProb,
 //                'strangerProb':strangerProb,
 //                'enemyProb':enemyProb,
 //                'judgements':judgements
 //            }


	// 	next();
	// });

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
window.resizeTo(1024,900)
// experiment = new InteractionsExperiment();
$(window).load( function(){
    psiTurk.doInstructions(
    	instructionPages, // a list of pages you want to display in sequence
    	function() { currentview = new InteractionsExperiment(); } // what you want to do when you are done with instructions
    );
});
