# Label Application Review
## Setup Instructions:
1. Clone the repository
2. Run `pnpm install` to install the dependencies
3. Run `pnpm dev` to start the development server
4. Copy `.env.example` to `.env` and add your API keys: `cp .env.example .env`
5. Open the browser and navigate to `http://localhost:3000`
6. Upload a PDF file containing a label and an application (one is provided in the root of the repository)
7. The application will process the file and display the results in the browser
8. The production URL to test this application is: https://v0-treasury-takehome.vercel.app/

## Assumptions:
- Our user (Treasury Agents) want something simple and intuitive. At the same time I wanted to build a fast program that is transparent with the results it provides.

- Due to firewall restrictions, we will need to host our model on Azure for inference.

- There will be times where a user will upload 1000 applications or more.

- The label review is nuanced but tedious

## Tech Stack:
- Next.js , React , AI SDK, Azure SDK, V0 / Shadcn, Zod , Typescript
  

## Approach:
First I read through the problem and paid close attention to bold lines from stakeholders. I realized it would be important to have quick but smart inference , an intuitive UX and a way to view results. 

I was considering just parsing the labels themselves but then realized the actual value is in not only 
the label itself but cross referencing it with the application.

I determined Claude Haiku 4.5 was the best model for this use case. It is a good balance of speed and accuracy. Due to not having the right subscription / tier on Azure I wasn't able to use it for the production environment, but added comments on the API route to set up Claude Haiku on Azure in a few lines of code.

For building the UI and UX I used V0 which I really like because of its tight integration in my Github development workflow and for its quality of output. 

For coding within my IDE I used Cursor switching between their composer 1.5 model and Sonnet 4.6 for more complicated tasks.

I also had Bugbot running on my repo to help me catch bugs and errors.


## Future improvements:
### AI & Accuracy
 -  I would A/B test different prompts, maybe even different models to improve label extraction, and detection accuracy.
  - I think the bulk of improvements surrounds the actual model used and prompts to extract data from the label and the application. 
 - Future experiments I would run include running an OCR model to extract the text from the label and the application and then using an LLM to extract the data from the text.

### User Experience
 - For UX I would add a real time progress bar (how many applications have been processed out of total applications).
 - I would also add a search bar to filter results by a brand name, or application number. This would be useful for when a user is looking for a specific application or brand.
-  For UX I would add a real time progress bar (how many applications have been processed out of total applications).

### Security
 - I would also add authentication and authorization to the application to prevent unauthorized access.

### Data Persistence
 - If compliant I would also persist the results in a database for future reference.

### Analytics
 - I would also add a analytics dashboard internally to track common failure patterns, processing times and accuracy metrics (evals). 






