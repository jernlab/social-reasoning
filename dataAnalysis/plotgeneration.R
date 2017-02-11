
library(ggplot2)
library(tidyr)
library(dplyr)


# Clear workspace
rm(list=ls())


# Conditions
# 
# Game					Cell
# ------------------------------
# prisoner's dilemma	0
# prisoner's dilemma	1
# prisoner's dilemma	3
# threat				0
# threat				1
# threat				2
# threat				3
# disjunctive			0
# disjunctive			3
# coordination			0
# coordination			1
# singleControl			0
# singleControl			1

# 
# ======= Layout of each game =====================
#
# - The bottom left number in each cell is the reward for the row player
# - The top right number in each cell is the reward for the column player
# - The top left number in parentheses indicates the ID for that cell
#		(used in the list of conditions above)
#
#  ---------------
# |(0) 12 |(1) 12 |
# | 12    | 12    |
# |---------------|
# |(2) 12 |(3) 0  |
# | 12    | 0     |
#  ---------------
#
# ======== Payouts for each game ===================
#
# Prisoner's dilemma
#  ---------------
# |(0) 8  |(1) 12 |
# | 8     | 0     |
# |---------------|
# |(2) 0  |(3) 4  |
# | 12    | 4     |
#  ---------------
#
# Threat
#  ---------------
# |(0) 6  |(1) 12 |
# | 12    | 6     |
# |---------------|
# |(2) 0  |(3) 6  |
# | 6     | 0     |
#  ---------------
#
# Disjunctive
#  ---------------
# |(0) 12 |(1) 12 |
# | 12    | 12    |
# |---------------|
# |(2) 12 |(3) 0  |
# | 12    | 0     |
#  ---------------
#
# Coordination
#  ---------------
# |(0) 12 |(1) 0  |
# | 12    | 0     |
# |---------------|
# |(2) 0  |(3) 12 |
# | 0     | 12    |
#  ---------------
#
# Single control
#  ---------------
# |(0) 6  |(1) 6  |
# | 6     | 0     |
# |---------------|
# |(2) 6  |(3) 6  |
# | 6     | 0     |
#  ---------------

# Constants / parameters
CI <- 1.96 # 95% confidence interval
nConditions <- 13
games <- c("pd0","pd1","pd3",
           "threat0","threat1","threat2","threat3",
           "disjunctive0","disjunctive3",
           "coordination0","coordination1",
           "singleControl0","singleControl1")

# Load the data into dataframes
alldata <- read.csv("reformattedData.csv")
dataMeans <- read.csv("dataMeansReformatted.csv")

# Only include participants who passed the attention check
passed <- filter(alldata, condition=="attentioncheck", rating==1)$subject
filtered <- filter(alldata, subject %in% passed, condition != "attentioncheck") %>%
            rename(game = condition)

# Recursive model predictions
recursiveModelPreds <- read.csv("modelPredictionsReformatted.csv") %>%
                       rename(recursiveModel = rating)
# Generate renormalized model predictions without strangers
recursiveModelPreds.noStrangers <- recursiveModelPreds %>%
                                   spread(relationship, recursiveModel) %>%
                                   select(game,enemies,friends)
                                   
sums <- recursiveModelPreds.noStrangers$enemies +
            recursiveModelPreds.noStrangers$friends
recursiveModelPreds.noStrangers$enemies <- recursiveModelPreds.noStrangers$enemies / sums
recursiveModelPreds.noStrangers$friends <- recursiveModelPreds.noStrangers$friends / sums
recursiveModelPreds.noStrangers <- recursiveModelPreds.noStrangers %>%
                                   gather("relationship","recursiveModel",
                                          c(enemies,friends))

# Independent DM model predictions
independentDmModelPreds <- read.csv("SoftHeuristic.csv") %>%
                           rename(independentModel = rating)
# Generate renormalized model predictions without strangers
independentDmModelPreds.noStrangers <- independentDmModelPreds %>%
                                   spread(relationship, independentModel) %>%
                                   select(game,enemies,friends)
                                
sums <- independentDmModelPreds.noStrangers$enemies +
            independentDmModelPreds.noStrangers$friends
independentDmModelPreds.noStrangers$enemies <- independentDmModelPreds.noStrangers$enemies / sums
independentDmModelPreds.noStrangers$friends <- independentDmModelPreds.noStrangers$friends / sums
independentDmModelPreds.noStrangers <- independentDmModelPreds.noStrangers %>%
                                   gather("relationship","independentModel",
                                          c(enemies,friends))

# Heuristic model predictions
heuristicModelPreds = read.csv("heuristicModelReformatted2.csv") %>%
                      rename(heuristicModel = rating)
# Generate renormalized model predictions without strangers
heuristicModelPreds.noStrangers <- heuristicModelPreds %>%
                                   spread(relationship, heuristicModel) %>%
                                   select(game,enemies,friends)
                                   
sums <- heuristicModelPreds.noStrangers$enemies +
            heuristicModelPreds.noStrangers$friends
heuristicModelPreds.noStrangers$enemies <- heuristicModelPreds.noStrangers$enemies / sums
heuristicModelPreds.noStrangers$friends <- heuristicModelPreds.noStrangers$friends / sums
heuristicModelPreds.noStrangers <- heuristicModelPreds.noStrangers %>%
                                   gather("relationship","heuristicModel",
                                          c(enemies,friends))
# This procudure sometimes results in NaN results, b/c the heuristic model
# had assigned p=1 to strangers. In this cases, we will assume that p=0.5 for
# friend and enemies.
allRatings <- heuristicModelPreds.noStrangers$heuristicModel
heuristicModelPreds.noStrangers$heuristicModel <-
    replace(allRatings, is.nan(allRatings), 0.5)


# Put all the predictions together into a single data frame
modelPredictions <- inner_join(recursiveModelPreds, independentDmModelPreds) %>%
                    inner_join(heuristicModelPreds)
modelPredictions.noStrangers <- inner_join(recursiveModelPreds.noStrangers,
                                           independentDmModelPreds.noStrangers) %>%
                                         inner_join(heuristicModelPreds.noStrangers)




# models <- list(modelPredictions, heuristicModelPredictions, heuristicModelSoft)
#n = length(passed) * length(models)
n = length(passed)

renormalizePredictions <- function(preds) {
    
    for (g in games) {
        # Select out the predictions for each game
        gPreds <- filter(preds, game==g)
        
        # Then renormalize each column
        gPreds$recursiveModel <- gPreds$recursiveModel / sum(gPreds$recursiveModel)
        gPreds
    }

}


# Find the MSE and correlation coefficient between all people and each model
# predictions: model predictions
# d: subject data
# includeStrangers: whether or not to include strangers in calculations
extractCorrelation <- function(predictions, d, includeStrangers = FALSE) {

  extracted.corr <- data.frame(subject = numeric(n), recursive = numeric(n),
                               independent = numeric(n), heuristic = numeric(n))
  extracted.mse <- data.frame(subject = numeric(n), recursive = numeric(n),
                               independent = numeric(n), heuristic = numeric(n))
  
  for(indexi in 1:length(passed)) {
      index = passed[indexi]
	  
      if(includeStrangers == FALSE) {
        predictions <- filter(predictions, relationship != "strangers")
      }
      predictions <- arrange(predictions, game, relationship)
      
      person = filter(d, subject == index)
      if(includeStrangers == FALSE){
        person = filter(person, relationship != "strangers")
      }
      person <- arrange(person, game, relationship)
      
      # Compute correlation coefficient between a person and models
	  extracted.corr$subject[indexi] <- index
	  extracted.corr$recursive[indexi] <- cor(predictions$recursiveModel, person$rating)
	  extracted.corr$independent[indexi] <- cor(predictions$independentModel, person$rating)
	  extracted.corr$heuristic[indexi] <- cor(predictions$heuristicModel, person$rating)
	  
	  # Compute MSE between a person and models
	  extracted.mse$subject[indexi] <- index
	  extracted.mse$recursive[indexi] <- sum((person$rating - predictions$recurisveModel)^2) / nrow(person)
	  extracted.mse$independent[indexi] <- sum((person$rating - predictions$independentModel)^2) / nrow(person)
	  extracted.mse$heuristic[indexi] <- sum((person$rating - predictions$heuristicModel)^2) / nrow(person)

  }
  
  return(list(extracted.corr, extracted.mse))
}



# Make correlation plot
# means: data frame of means
# fulldata: data frame of all subject's means
# t: title of plot
# fileName: name of file to save
# saveFile: set to TRUE to save a copy of the plot
makeCorrPlot <- function(means, fulldata, t, fileName, saveFile = FALSE) {
	print(ggplot(data=means, aes(x=model)) +
		  geom_point(aes(y=mean), stat="identity") +
		  geom_errorbar(aes(ymin=mean-ci95, ymax=mean+ci95), width=0.2) +
		  geom_jitter(data=fulldata, aes(x=model, y=r),
					  alpha=0.1,  width=0.1, size=0.5) +
		  scale_y_continuous(name="Correlation", limits=c(-0.5,1)) +
		  scale_x_discrete(name="Model") +
		  theme(legend.position="none",
		        axis.text.x=element_text(size=6, angle=30, hjust=1),
		        axis.title.x=element_text(size=8),
		        axis.title.y=element_text(size=8),
		        axis.text.y=element_text(size=7),
		        axis.ticks=element_line(size=0.5),
		        plot.title=element_text(size=10)) +
				#axis.title.y = element_text(angle=0, vjust=0.5, hjust=0.5)) +
		  scale_color_brewer(palette = "Set2") +
		  ggtitle(t))

	if (saveFile) {
		dev.copy(pdf, fileName, width=1.5, height=2.2)
		dev.off()
	}
}

# Exclude strangers and generate plots
e = extractCorrelation(modelPredictions.noStrangers, filtered, FALSE)
rs <- e[[1]] # correlation coefficients
mses <- e[[2]] # MSEs

# Generate plots of correlation coefficients
rs.tidy <- gather(rs, "model", "r", 
                  c(recursive, independent, heuristic))
rs.tidy.grouped <- group_by(rs.tidy, subject) %>%
						    mutate(bestModel = which(r==max(r)))
groupCounts <- rs.tidy.grouped %>% select(subject, bestModel) %>%
               distinct(.keep_all = TRUE) %>%
               group_by(bestModel) %>%
               count()

count(rs.tidy.grouped)
print("Group counts:")
print(groupCounts)

means.group1 <- rs.tidy.grouped %>%
                filter(bestModel==1) %>%
				group_by(model) %>%
				summarize(mean = mean(r),
				          sd = sd(r),
						  ci95 = CI*sd(r)/sqrt(groupCounts$n[1]))
makeCorrPlot(means.group1, filter(rs.tidy.grouped, bestModel==1), "Group 1","group1_corr.pdf", saveFile=FALSE)
print("Group 1 mean rs:")
print(means.group1)
						  
means.group2 <- rs.tidy.grouped %>%
                filter(bestModel==2) %>%
				group_by(model) %>%
				summarize(mean = mean(r),
				          sd = sd(r),
						  ci95 = CI*sd(r)/sqrt(groupCounts$n[2]))
makeCorrPlot(means.group2, filter(rs.tidy.grouped, bestModel==2),  "Group 2", "group2_corr.pdf", saveFile=FALSE)
print("Group 2 mean rs:")
print(means.group2)
						  
means.group3 <- rs.tidy.grouped %>%
                filter(bestModel==3) %>%
				group_by(model) %>%
				summarize(mean = mean(r),
				          sd = sd(r),
						  ci95 = CI*sd(r)/sqrt(groupCounts$n[3]))
makeCorrPlot(means.group3, filter(rs.tidy.grouped, bestModel==3),  "Group 3", "group3_corr.pdf", saveFile=FALSE)
print("Group 3 mean rs:")
print(means.group3)

# Generate plots of ratings

# Make plot of all data
# d: data
# rel: string of the name of the relationship to plot
# t: title of plot
# fileName: name of file to save
# saveFile: set to TRUE to save a copy of the plot
makeDataScatterPlot <- function(d, rel, t, fileName, saveFile = FALSE) {
    
    relData <- filter(d, relationship==rel)

	print(ggplot() +
        geom_jitter(data=relData, aes(x=game, y=rating), alpha=0.4, size=0.5) +
        scale_y_continuous(name="Rating") +
		scale_x_discrete(name="Condition") +
		theme(axis.text.x=element_blank(),
		      axis.title.x=element_text(size=8),
		      axis.title.y=element_text(size=8),
		      axis.text.y=element_text(size=7),
		      axis.ticks=element_line(size=0.5),
		      plot.title=element_text(size=10)) +
	    ggtitle(t))

	if (saveFile) {
		dev.copy(pdf, fileName, width=2.2, height=1.5)
		dev.off()
	}
}

# Sort the data by the mean rating for friends
sortedData <- arrange(inner_join(filtered, rename(dataMeans, meanRating = rating)), meanRating)
dataMeanFriends <- filter(dataMeans, relationship=="friends")
sortedData$game <- factor(sortedData$game, levels=dataMeanFriends$game[order(dataMeanFriends$rating)])

# Make plots for the three relationship types
makeDataScatterPlot(sortedData, "friends", "Friends", "friends.pdf", saveFile = FALSE)
makeDataScatterPlot(sortedData, "strangers", "Strangers", "strangers.pdf", saveFile = FALSE)
makeDataScatterPlot(sortedData, "enemies", "Enemies", "enemies.pdf", saveFile = FALSE)

						  

