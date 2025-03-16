const { queryAsync } = require('../config/dbHelper');
const { v4: uuidv4 } = require("uuid");

exports.getFlashCardsByUser = async (req, res) => {
    try {
        const result = await queryAsync('SELECT * FROM flash_cards', []);
        res.status(200).json({ status: '200', message: 'Retrieve FlashCards Successfully', data: result });
    } catch (err) {
        console.error("[err]", err);
        res.status(500).json({ message: 'Error retrieving flashcards', error: err });
    }
};

exports.createFlashCardsByUser = async (req, res) => {
    const { id, name, questions } = req.body;
    const userId = req.user.id;

    if (!name) return res.status(400).json({ message: "Flashcard name is required" });
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: "At least one question is required" });
    }

    const flashCardId = id && id.trim() !== "" ? id : uuidv4(); // Use existing id or generate a new one

    try {
        if (id && id.trim() !== "") {
            // Update existing flashcard
            await queryAsync(`UPDATE flash_cards SET name = ? WHERE id = ? AND user_id = ?`, [name, id, userId]);

            // Delete old questions before inserting updated ones
            await queryAsync(`DELETE FROM cards WHERE flash_card_id = ?`, [id]);

        } else {
            // Insert new flashcard
            await queryAsync(`INSERT INTO flash_cards (id, name, user_id) VALUES (?, ?, ?)`, [flashCardId, name, userId]);
        }

        // Insert new/updated questions
        const insertQuestions = questions.map(q =>
            queryAsync(`INSERT INTO cards (id, question, answer, type, options, flash_card_id) VALUES (?, ?, ?, ?, ?, ?)`,
                [uuidv4(), q.question, q.answer, q.type, JSON.stringify(q.options), flashCardId]
            )
        );

        await Promise.all(insertQuestions);

        res.status(201).json({
            status: "201",
            message: id ? "FlashCard updated successfully" : "FlashCard created successfully",
            data: { id: flashCardId, name, userId }
        });

    } catch (err) {
        console.error("Error creating/updating flashcard:", err);
        res.status(500).json({ message: "Database error", error: err });
    }
};

exports.getFlashCardsById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await queryAsync(`
            SELECT fc.name AS flashCardName, c.*
            FROM flash_cards fc
            LEFT JOIN cards c ON fc.id = c.flash_card_id
            WHERE fc.id = ?`, [id]
        );

        if (result.length === 0 || !result[0].flashCardName) {
            return res.status(404).json({ message: "No cards found for this flashcard" });
        }

        const flashCardName = result[0].flashCardName;
        const questions = result
            .filter(row => row.id)
            .map(Q => ({ id: Q.id, question: Q.question, answer: Q.answer, type: Q.type, options: Q.options && Q.options.trim() !== "" ? JSON.parse(Q.options) : []}));

        res.status(200).json({
            status: "200",
            message: "Retrieve Cards Successfully",
            data: { flashCardName, questions },
        });

    } catch (err) {
        console.error("Error retrieving cards:", err);
        res.status(500).json({ message: "Error retrieving cards", error: err });
    }
};

exports.postCheckAnswer = async (req, res) => {
    const { id } = req.params;
    const userAnswers = req.body;

    try {
        const result = await queryAsync(`
            SELECT fc.name AS flashCardName, c.id, c.question, c.type, c.options, c.answer
            FROM flash_cards fc
            LEFT JOIN cards c ON fc.id = c.flash_card_id
            WHERE fc.id = ?`, [id]
        );

        if (result.length === 0 || !result[0].flashCardName) {
            return res.status(404).json({ message: "No cards found for this flashcard" });
        }

        const flashCardName = result[0].flashCardName;
        const results = userAnswers.map(userAnswer => {
            const correctAnswer = result.find(q => q.id === userAnswer.id);
            if (!correctAnswer) return { ...userAnswer, isCorrect: false, message: "Question not found" };

            return {
                ...userAnswer,
                isCorrect: userAnswer.answer === correctAnswer.answer,
                correctAnswer: correctAnswer.answer,
            };
        });

        res.status(200).json({
            status: "200",
            message: "Checked Answers Successfully",
            data: { id, flashCardName, results },
        });

    } catch (err) {
        console.error("Error retrieving cards:", err);
        res.status(500).json({ message: "Error retrieving cards", error: err });
    }
};

exports.getLeadersBoard = async (req, res) => {
    try {
        const result = await queryAsync(`
            SELECT lb.id, lb.flash_card_id, fc.name AS name, lb.user_id, lb.score, 
                   (SELECT COUNT(*) FROM cards c WHERE c.flash_card_id = lb.flash_card_id) AS total,
                   RANK() OVER (PARTITION BY lb.flash_card_id ORDER BY lb.score DESC) AS ranking
            FROM leaders_board lb
            JOIN flash_cards fc ON lb.flash_card_id = fc.id
            WHERE lb.user_id = ?`, [req.user.id]
        );

        res.status(200).json({ 
            status: '200', 
            message: 'Retrieve leaderboard successfully', 
            data: result 
        });

    } catch (err) {
        console.error("[err]", err);
        res.status(500).json({ message: 'Error retrieving leaderboard', error: err });
    }
};

exports.getLeadersBoardByFlashCardId = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await queryAsync(`
            SELECT u.username, lb.score, 
                   (SELECT COUNT(*) FROM cards c WHERE c.flash_card_id = ?) AS total
            FROM leaders_board lb
            JOIN users u ON lb.user_id = u.id
            WHERE lb.flash_card_id = ?
            ORDER BY lb.score DESC`, [id, id]
        );

        res.status(200).json({ 
            status: '200', 
            message: 'Retrieve leaderboard successfully', 
            data: result 
        });

    } catch (err) {
        console.error("[err]", err);
        res.status(500).json({ message: 'Error retrieving leaderboard', error: err });
    }
};

exports.postLeadersBoardByFlashcard = async (req, res) => {
    const userId = req.user.id;
    const { flashcardId, score } = req.body;

    if (!flashcardId || score === undefined) {
        return res.status(400).json({ message: "Flashcard ID and score are required" });
    }

    try {
        const existing = await queryAsync(`SELECT id FROM leaders_board WHERE user_id = ? AND flash_card_id = ?`, [userId, flashcardId]);

        if (existing.length > 0) {
            await queryAsync(`UPDATE leaders_board SET score = ? WHERE user_id = ? AND flash_card_id = ?`, [score, userId, flashcardId]);
            return res.status(200).json({ message: "Score updated successfully" });
        }

        const id = uuidv4();
        await queryAsync(`INSERT INTO leaders_board (id, flash_card_id, user_id, score) VALUES (?, ?, ?, ?)`, [id, flashcardId, userId, score]);
        
        res.status(201).json({ message: "Score added successfully", id });

    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ message: "Database error", error: err });
    }
};
