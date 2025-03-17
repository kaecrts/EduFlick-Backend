
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { 
    getFlashCardsByUser, 
    createFlashCardsByUser, 
    getFlashCardsById,
    postCheckAnswer, 
    getLeadersBoard, 
    postLeadersBoardByFlashcard,
    getLeadersBoardByFlashCardId,
    deleteFlashCardsById
} = require('../controllers/cardController');

const router = express.Router();

router.get('', authMiddleware, getFlashCardsByUser);
router.post('', authMiddleware, createFlashCardsByUser);
router.get('/leaders', authMiddleware, getLeadersBoard)
router.post('/leaders', authMiddleware, postLeadersBoardByFlashcard)
router.get('/leaders/:id', authMiddleware, getLeadersBoardByFlashCardId)
router.get('/:id', authMiddleware, getFlashCardsById);
router.delete('/:id', authMiddleware, deleteFlashCardsById)
router.post('/test/:id', authMiddleware, postCheckAnswer);

module.exports = router;
