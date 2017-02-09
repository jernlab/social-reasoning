library(gdata)
library(tidyr)
library(dplyr)

# Load the data into dataframes for easy use with dplyr
alldata = read.csv("reformattedData.csv")
modelPredictions = read.csv("modelPredictionsReformatted.csv")
dataMeans = read.csv("dataMeansReformatted.csv")
heuristicModelPredictions = read.csv("heuristicModelReformatted.csv")
heuristicModelSoft = read.csv("SoftHeuristic.csv")


# Only include participants who passed the attention check
passed = filter(alldata, condition=="attentioncheck", rating==1)$subject
filtered = filter(alldata, subject %in% passed)

models <- list(modelPredictions, heuristicModelPredictions, heuristicModelSoft)
n = length(passed) * length(models)

# Find the MSE and correlation coefficient between all people and each model
# The ignore strangers argument will factor out the ratings about strangers for the
# model predictions and people's responses
extractCorrelation <- function(includeStrangers = FALSE){
  extracted <- data.frame(id = numeric(n),model = numeric(n), mse = numeric(n), correlation = numeric(n) )
  for(indexi in 1:length(passed)){
    for(modeli in 1:length(models)){
      index = passed[indexi]
      model = models[modeli][[1]]
      
      if(includeStrangers){
        model = filter(model, relationship != "strangers")
        friendratings = filter(model, relationship == "friends")$rating
        enemyratings = filter(model, relationship == "enemies")$rating
        thesums = friendratings + enemyratings
        theratings = c(rbind(friendratings / thesums, enemyratings / thesums))
        model$ratings = theratings
      }
      
      i = length(models) * (indexi - 1) + modeli #compute the index for our final dataframe
      person = filter(filtered, subject == index, condition != "attentioncheck")
      
      if(includeStrangers){
        person = filter(person, relationship != "strangers")
        friendratings = filter(person, relationship == "friends")$rating
        enemyratings = filter(person, relationship == "enemies")$rating
        thesums = friendratings + enemyratings
        theratings = c(rbind(friendratings / thesums, enemyratings / thesums))
        person$ratings = theratings
      }
      
      # Compute MSE , Correlation Coefficient between a person and model
      extracted$id[i] <- index
      extracted$model[i] = modeli
      extracted$mse[i] <- sum((person$rating - model$rating)^2)/nrow(person)
      extracted$correlation[i] <- cor(person$rating, model$rating)
    }
  }
  extracted
}

makePlots <- function(extractedData){
  # Get sorted list of mse, correlation coefficients
  best = order(extractedData$correlation)
  sorted = extractedData$correlation[best]
  
  # Plot person and their best ranked model
  grouped <- group_by(extractedData, id)
  rankings <- summarise(grouped, maxes = max(correlation), model = which(correlation == max(correlation)), mse = max(mse))
  
  confidenceInterval = 1.96 * sd(extractedData$correlation)/sqrt(length(extractedData$correlation))
  print(confidenceInterval)
  # Count the number of people that have maximum correspondence to each model
  count(group_by(rankings, model))
  plot(rankings$model, rankings$id)
  plot(rankings$model, rankings$maxes)
  
  for(m in 1:3){
    meanmse = mean(filter(extractedData, model == m)$mse)
    meancorr = mean(filter(extractedData, model == m)$correlation)
  }
  
  for(m in 1:3){
    meanmse = mean(filter(rankings, model == m)$mse)
    meancorr = mean(filter(rankings, model == m)$maxes)
  }
}

extractedWithStrangers = extractCorrelation(FALSE)
extractedWithoutStrangers = extractCorrelation(TRUE)

makePlots(extractedWithStrangers)
makePlots(extractedWithoutStrangers)
