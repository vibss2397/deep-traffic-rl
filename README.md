# Deep Traffic

In this project, I hope to increase my understanding of reinforcement learning more by creating a program that hopefully trains an agent(car) in a path which constantly keeps on generating traffic(environment) using policy gradients method.

The game is created in p5.js and is mostly inspired by the coding challenges by daniel shiffman found [here](https://github.com/CodingTrain/website/tree/master/CodingChallenges/CC_31_FlappyBird_p5.js) .

To learn more about rl and policy gradients first i recreated the pong from pixels script by [andrej karpathy](https://karpathy.github.io/2016/05/31/rl/).

Hopefully the same process can be replicated for this game.

Tasks done till now :-
1. Generated models for our car, enemies and road signs
2. enemy generation works but is not progressive
3. Car collision system works(partially)
4. frameCount function is the score as of now.

Tasks Remaining :-
1. controlling speed of enemy cars so that they dont collide with each other.
2. writing api/script for getting the environment variables such as reward,done etc.(similar to open ai gym)
3. Screen grabbing script which consecutively takes screenshots

Longshots(2-3 weeks) :- 
1. See how to use the trained weights on browser.
2. convert into a game others can play.
3. host.
