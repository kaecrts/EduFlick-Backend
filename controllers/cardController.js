const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require("uuid");
const { options } = require('../routes/cardsRoutes');

exports.getFlashCardsByUser = (req, res) => {
    const query = 'SELECT * FROM flash_cards';
    db.query(query, (err, result) => {
      if (err) {
          console.log("[err]", err);
          
          return res.status(500).json({ message: 'Error retrieving flashcards' });
      }
      res.status(201).json({ status: '200', message: 'Retrieve FlashCards Successfully', data: result });
    });
};

exports.getFlashCardsById = (req, res) => {
  const { id } = req.params; // Get `id` from URL
  console.log("FlashCard ID:", id);

  const query = `
        SELECT fc.name AS flashCardName, c.*
        FROM flash_cards fc
        LEFT JOIN cards c ON fc.id = c.flash_card_id
        WHERE fc.id = ?;
    `;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error retrieving cards:", err);
            return res.status(500).json({ message: "Error retrieving cards" });
        }

        if (result.length === 0 || !result[0].flashCardName) {
            return res.status(404).json({ message: "No cards found for this flashcard" });
        }

        // Extract flashcard name and related cards
        const flashCardName = result[0].flashCardName;
        const questions = result
            .filter(row => row.id) // Remove rows where `cards.id` is null (in case no cards exist)
            .map((Q) => ({id: Q.id, question:Q.question, type: Q.type, options: Q.options})); // Keep only card details

        res.status(200).json({
            status: "200",
            message: "Retrieve Cards Successfully",
            data: {
                flashCardName,  // Changed from cardName to flashCardName
                questions,
            },
        });
    });
}

exports.postCheckAnswer = (req, res) => {
  const { id } = req.params; // Get `flash_cards.id` from URL
  const userAnswers = req.body; // Array of user-submitted answers
  console.log("FlashCard ID:", id, userAnswers);

  const query = `
      SELECT fc.name AS flashCardName, c.id, c.question, c.type, c.options, c.answer
      FROM flash_cards fc
      LEFT JOIN cards c ON fc.id = c.flash_card_id
      WHERE fc.id = ?;
  `;

  db.query(query, [id], (err, result) => {
      if (err) {
          console.error("Error retrieving cards:", err);
          return res.status(500).json({ message: "Error retrieving cards" });
      }

      if (result.length === 0 || !result[0].flashCardName) {
          return res.status(404).json({ message: "No cards found for this flashcard" });
      }

      // Extract flashcard name
      const flashCardName = result[0].flashCardName;

      // Compare user answers with actual answers
      const results = userAnswers.map((userAnswer) => {
          const correctAnswer = result.find((q) => q.id === userAnswer.id);

          if (!correctAnswer) {
              return { ...userAnswer, isCorrect: false, message: "Question not found" };
          }

          return {
              ...userAnswer,
              isCorrect: userAnswer.answer === correctAnswer.answer,
              correctAnswer: correctAnswer.answer,
          };
      });

      res.status(200).json({
          status: "200",
          message: "Checked Answers Successfully",
          data: {
              id,
              flashCardName,
              results,
          },
      });
  });
};

exports.getLeadersBoard = (req, res) => {
    console.log("[zzzzz]", req.user);

    const query = `
        SELECT lb.id, lb.flash_card_id, fc.name AS name, lb.user_id, lb.score, 
               (SELECT COUNT(*) FROM cards c WHERE c.flash_card_id = lb.flash_card_id) AS total,
               RANK() OVER (PARTITION BY lb.flash_card_id ORDER BY lb.score DESC) AS ranking
        FROM leaders_board lb
        JOIN flash_cards fc ON lb.flash_card_id = fc.id
        WHERE lb.user_id = ?`;

    db.query(query, [req.user.id], (err, result) => {
        if (err) {
            console.log("[err]", err);
            return res.status(500).json({ message: 'Error retrieving leaderboard' });
        }

        console.log("[x]", result);

        res.status(200).json({ 
            status: '200', 
            message: 'Retrieve leaderboard successfully', 
            data: result 
        });
    });
};

exports.getLeadersBoardByFlashCardId = (req, res) => {
    const { id } = req.params; // Get flash_card_id from URL

    const query = `
        SELECT u.username, lb.score, 
               (SELECT COUNT(*) FROM cards c WHERE c.flash_card_id = ?) AS total
        FROM leaders_board lb
        JOIN users u ON lb.user_id = u.id
        WHERE lb.flash_card_id = ?
        ORDER BY lb.score DESC`;

    db.query(query, [id, id], (err, result) => {
        if (err) {
            console.log("[err]", err);
            return res.status(500).json({ message: 'Error retrieving leaderboard' });
        }

        console.log("[x]", result);

        res.status(200).json({ 
            status: '200', 
            message: 'Retrieve leaderboard successfully', 
            data: result 
        });
    });
};






exports.postLeadersBoardByFlashcard = (req, res) => {
    const userId = req.user.id; // Assuming user authentication is implemented
    const { flashcardId, score } = req.body; // Get flashcardId and score from request body

    if (!flashcardId || score === undefined) {
        return res.status(400).json({ message: "Flashcard ID and score are required" });
    }

    // Check if the user already has a score for this flashcard
    const checkSql = `SELECT id FROM leaders_board WHERE user_id = ? AND flash_card_id = ?`;
    db.query(checkSql, [userId, flashcardId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        if (results.length > 0) {
            // Update existing record
            const updateSql = `UPDATE leaders_board SET score = ? WHERE user_id = ? AND flash_card_id = ?`;
            db.query(updateSql, [score, userId, flashcardId], (err, updateResult) => {
                if (err) {
                    console.error("Error updating score:", err);
                    return res.status(500).json({ message: "Database error", error: err });
                }
                return res.status(200).json({ message: "Score updated successfully" });
            });
        } else {
            // Insert new record
            const id = uuidv4(); // Generate a unique ID
            const insertSql = `INSERT INTO leaders_board (id, flash_card_id, user_id, score) VALUES (?, ?, ?, ?)`;
            db.query(insertSql, [id, flashcardId, userId, score], (err, insertResult) => {
                if (err) {
                    console.error("Error inserting data:", err);
                    return res.status(500).json({ message: "Database error", error: err });
                }
                res.status(201).json({ message: "Score added successfully", id });
            });
        }
    });
};


