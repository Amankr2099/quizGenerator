
import { GoogleGenerativeAI } from "@google/generative-ai";


// Access your API key (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(${{ vars.API_KEY }});

//declare empty array of questions
const questions = []


//select relevent elements for dom manupulation
const quizDiv = document.getElementById('quiz');
const resultDiv = document.getElementById('result');
const submitButton = document.getElementById('submitBtn')
const startButton = document.getElementById('startBtn')
const reloadButton =  document.getElementById('reloadBtn')

const selectedTime = document.getElementById('selected-time');
const questionNumbers = document.getElementById('selected-question-numbers');
const quizTopic = document.getElementById('selected-quiz-topic');



let timerElement;
let timeLeft =( selectedTime.value)*60;
//
let timerInterval;


//fetch questions from model api
const getQuestion = async () => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `If the word ${quizTopic.value} is a general offensive or meaningless word then response as "Invalid topic".
  Otherwise generate an array of ${questionNumbers.value} JSON objects representing trivia questions, where each question is related to ${quizTopic.value}. Each JSON object should contain the following fields:

  "question": (Provide a trivia question related to the topic.)
  "options": (Provide an array of four multiple-choice options related to the question.)
  "correctAnswer": (Correct answer to the question from given options.)

  Example : Let's say the topic is history then response should look like
  [
    {
      "question": "Which civilization built the Great Pyramids of Giza?",
      "options": ["Mesopotamians", "Greeks", "Egyptians", "Romans"],
      "correctAnswer": "Egyptians"
    },
    {
      "question": "Who was the first emperor of Rome?",
      "options": ["Julius Caesar", "Augustus", "Nero", "Constantine"],
      "correctAnswer": "Augustus"
    },
    {
      "question": "Which ancient empire was known for its legal code, 'Hammurabi's Code'?",
      "options": ["Assyrians", "Babylonians", "Persians", "Sumerians"],
      "correctAnswer": "Babylonians"
    }
  ]
   
     ,`;

   

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  let generatedQuestions;

  try {
  //parse string response into array of json
    generatedQuestions = JSON.parse(text)
  } catch (error) {
    quizDiv.innerHTML = `<div class="text-center fs-2 text-secondary p-4">
                          <p>Unable to fetch questions</p>
                        </div>`
    reloadButton.style.display = 'block'
    return 0;
  }

  generatedQuestions.forEach((object)=>{
    //push each question object into global array
    questions.push(object)
  })
  // console.log(questions);


  showQuizInfo()
  //generate quiz only after questions have been fectched
  generateQuiz()
}



// Function to generate the quiz
const generateQuiz = () => {
  let quizHTML = '';
  questions.forEach((question, index) => {
    quizHTML += `<div class="card mt-3">
                  <div class="card-body">
                    <h5 class="card-title">Question ${index + 1}</h5>
                    <p class="card-text">${question.question}</p>
                    <div class="form-group">`;
    question.options.forEach(option => {
      quizHTML += `<div class="form-check">
                     <input class="form-check-input" type="radio" name="question${index}" value="${option}">
                     <label class="form-check-label">${option}</label>
                   </div>`;
    });
    quizHTML += `</div></div></div>`;
  });
  quizDiv.innerHTML = quizHTML;
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
  submitButton.style.display = 'block'

}

// Function to calculate result
const calculateResult = () => {
  let totalPoints = 0;
  let userAttempts = [];
  questions.forEach((question, index) => {
    const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
    if (selectedOption) {
      const userAnswer = selectedOption.value;
      // console.log(userAnswer);
      userAttempts.push({ question: question.question, answer: userAnswer, correctAnswer: question.correctAnswer });
      if (userAnswer === question.correctAnswer) {
        totalPoints++;
      }
    }
  });
  return { totalPoints, userAttempts };
}

// Function to display result
const displayResult = () => {
  document.getElementById('quiz-info').style.display = 'none'
  quizDiv.style.display = 'none'
  submitButton.style.display = 'none'
  startButton.style.display = 'none'
  const { totalPoints, userAttempts } = calculateResult();
  let resultHTML = `<div class="mt-1 border border-secondary rounded text-center fs-2 p-3">
                    <h3>Your Result</h3>
                    Total Points: ${totalPoints}<br>
                    Time Taken: ${timerElement.innerText}<br>
                    </div>`;
  resultHTML += `<div  class="mt-5 p-3 border border-secondary rounded">
                   <h4 class="text-center" >Attempt History</h4>`
  userAttempts.forEach(attempt => {
    // console.log(attempt);
    resultHTML += `<div class="mt-1 bg-secondary rounded p-3 text-white">
                   <h5>${attempt.question}</h5>
                  <p>Your answer: ${attempt.answer}</p>
                  <p>Correct answer: ${attempt.correctAnswer}</p>
                   </div>`;
  });
  resultHTML += `</div>`
  resultDiv.innerHTML = resultHTML;
  reloadButton.style.display = 'block'

}

// Function to update timer
function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  timerElement.textContent = `${minutes}:${seconds}`;
  if (timeLeft === 0) {
    clearInterval(timerInterval);
    document.getElementById('submitBtn').click();
  }
  timeLeft--;
}

const showQuizInfo = ()=>{
  let quizInfoDiv =  `
        <p>Quiz Topic : ${quizTopic.value} </p>
        <p>Total Question : ${questionNumbers.value} </p>
        <p>Duration : <span id="quiz-time">${selectedTime.value}:00</span> minutes</p>
  `
  document.getElementById('quiz-info').innerHTML = quizInfoDiv
  timerElement = document.getElementById('quiz-time')
}



document.getElementById('start-setting').addEventListener('click',()=>{
  document.getElementById('quiz-setting').style.display = 'block'
})

quizTopic.addEventListener('input',()=>{
  var inputValue = quizTopic.value.trim();
      if (inputValue !== '' && inputValue.length >= 3 ) {
        startButton.classList.remove('d-none');
      } else {
        startButton.classList.add('d-none');
      }
  startButton.style.display = 'block';
})


startButton.addEventListener('click', () => {
  document.getElementById('prologue').style.display = 'none'
  document.getElementById('quiz-info').style.display = 'block'
  document.getElementById('quiz-setting').style.display = 'none'
  startButton.style.display = 'none'
  getQuestion()
  quizDiv.innerHTML =  `<div class = 'text-center p-2'>
  <img src="https://cdn.pixabay.com/animation/2022/07/29/03/42/03-42-07-846_512.gif" alt="this slowpoke moves"  width="250" />
  <h4>Loaing problems...</h4>
                        </div>`
})

// Event listener for submit button
submitButton.addEventListener('click', () => {
  clearInterval(timerInterval);
  displayResult();
});

reloadButton.addEventListener('click',()=>{
  window.location.reload()
})
