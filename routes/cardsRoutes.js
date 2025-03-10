
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { 
    getFlashCardsByUser, 
    getFlashCardsById,
    postCheckAnswer, 
    getLeadersBoard, 
    postLeadersBoardByFlashcard,
    getLeadersBoardByFlashCardId
} = require('../controllers/cardController');

const router = express.Router();

router.get('', authMiddleware, getFlashCardsByUser);
router.get('/leaders', authMiddleware, getLeadersBoard)
router.post('/leaders', authMiddleware, postLeadersBoardByFlashcard)
router.get('/leaders/:id', authMiddleware, getLeadersBoardByFlashCardId)
router.get('/:id', authMiddleware, getFlashCardsById);
router.post('/test/:id', authMiddleware, postCheckAnswer);

module.exports = router;
