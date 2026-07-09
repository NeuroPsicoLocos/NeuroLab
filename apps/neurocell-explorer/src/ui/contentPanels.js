const topicNames = {
  anatomy: "Anatomía",
  connectivity: "Conectividad",
  function: "Función",
  clinic: "Clínica"
};

export function updateInfoPanel({ cellKey, activeTopic, scienceContent }) {
  const title = document.querySelector("#infoTitle");
  const body = document.querySelector("#infoBody");

  title.textContent = topicNames[activeTopic];
  body.textContent = scienceContent[cellKey][activeTopic];
  document.querySelectorAll(".info-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.topic === activeTopic);
  });
}

export function mountQuizPanel(cellKey, quiz) {
  const currentQuiz = quiz[cellKey] ?? quiz.default;
  document.querySelector("#quizQuestion").textContent = currentQuiz.question;
  const answerHost = document.querySelector("#quizAnswers");
  const feedback = document.querySelector("#quizFeedback");
  answerHost.replaceChildren();
  feedback.textContent = "";
  currentQuiz.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer.text;
    button.addEventListener("click", () => {
      answerHost.querySelectorAll("button").forEach((item) => {
        item.classList.remove("is-correct", "is-wrong");
      });
      button.classList.add(answer.correct ? "is-correct" : "is-wrong");
      feedback.textContent = answer.correct ? currentQuiz.correctFeedback : currentQuiz.incorrectFeedback;
    });
    answerHost.appendChild(button);
  });
}
