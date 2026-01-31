# road-rater
Spartahack project

Goal: Promote safe driving since drivers wont want their insurace rates to go up from poor drivig. 

Input:
user uploads a video of driving dashcarm footage

Our algorith:
analyzes teh video frame by frame to count instances of poor driving, specifically crossing solid paint lane lines.

Output: 
A score on how safe of a driver is and verdict on whether to charge them a standard drivers inurance rate or increased of decreased quantified by %s. 

Front end:
- Use react
- Allow users to upload videos 
- loading screen while our algorithm assesses the videos
- video player feature where the useer can play the video after its been analysed and view each point in the video that a flag for poor driving went off.
- The user can remove flags or add them if they disagree with the UI. 
- Then the user confirms the results and sees a summary screen with the score and rate sugggustion
