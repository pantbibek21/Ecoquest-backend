const express = require("express");
const app = express();

app.use(express.json());

const categories = [
  { id: 1, name: "Water Conservation" },
  { id: 2, name: "Energy Efficiency" },
  { id: 3, name: "Waste Reduction" },
  { id: 4, name: "Mobility" },
];

const challenges = [
  {
    id: 1,
    categoryId: 1,
    title: "7-Day Home Water Efficiency Challenge",
    description:
      "This challenge focuses on building simple habits that help reduce daily household water use. Many homes unknowingly waste water through leaks, long showers, or unnecessary tap use. Over the next seven days, you’ll practice mindful water- saving actions that are easy to adopt and highly effective in protecting freshwater resources.The goal is to help you become more conscious of your usage and identify areas for improvement.",
    toDo: [
      { id: 1, text: "Limit your shower to 5 minutes." },
      { id: 2, text: "Turn off the tap while brushing or shaving." },
      { id: 3, text: "Reuse greywater from rinsing vegetables." },
      { id: 4, text: "Wash dishes using a bowl instead of running tap water." },
      { id: 5, text: "Only run full laundry loads." },
      { id: 6, text: "Check faucets for small leaks or drips." },
      { id: 7, text: "Record one water-saving action you completed." },
    ],
  },
  {
    id: 2,
    categoryId: 2,
    title: "7-Day Low Energy Living Challenge",
    description:
      "Energy use contributes significantly to household emissions, and reducing it can be easier than expected. This challenge guides you in adopting energy-saving habits that lower electricity demand and cut costs. Even small changes like unplugging idle devices or maximizing natural light can make a noticeable difference.",
    toDo: [
      { id: 1, text: "Turn off lights when not in use." },
      { id: 2, text: "Unplug one unused device daily." },
      { id: 3, text: "Use natural daylight instead of electric lighting." },
      { id: 4, text: "Avoid overnight charging of electronics." },
      { id: 5, text: "Reduce fan or AC usage when possible." },
      { id: 6, text: "Air-dry clothes instead of using a dryer." },
      { id: 7, text: "Spend one hour without electronic screens." },
    ],
  },
];

const userChallenges = [];

app.post("/challenges/:id/enroll", (req, res) => {
  const challengeId = Number(req.params.id);
  const { userId } = req.body; // der User sendet seine ID

  // prüfen, ob Challenge existiert
  const challenge = challenges.find((c) => c.id === challengeId);
  if (!challenge) {
    return res.status(404).json({ message: "Challenge not found" });
  }

  // prüfen, ob User schon teilnimmt
  const alreadyParticipating = userChallenges.some(
    (uc) => uc.userId === userId && uc.challengeId === challengeId
  );

  if (!alreadyParticipating) {
    userChallenges.push({ userId, challengeId, active: true });
  }

  console.log(userId);
  res.json({
    message: `User ${userId} is now participating in challenge ${challengeId}`,
    userChallenges,
  });
});

app.get("/challenges/:id", (req, res) => {
  const id = Number(req.params.id);
  const challenge = challenges.find((q) => q.id === id);
  res.json(challenge);
  console.log(challenge);
});

app.get("/challenges", (req, res) => {
  const allChallanges = challenges;
  res.json(allChallanges);
  console.log(allChallanges);
});

// app.get('/challenges/short', (req, res) => {
//     const allChallanges = challenges;
//     res.json(allChallanges);
//     console.log(allChallanges);
// });

app.get("/categories/:id", (req, res) => {
  const id = Number(req.params.id);
  const category = categories.find((c) => c.id === id);
  res.json(category);
  console.log(category);
});

app.get("/categories", (req, res) => {
  const allCategories = categories;
  res.json(allCategories);
  console.log(allCategories);
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});

app.get("/", (req, res) => {
  res.send("Server is working");
});
