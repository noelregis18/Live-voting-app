const express = require('express');
const { 
  createPoll, 
  getPolls, 
  getPoll, 
  updatePoll, 
  deletePoll, 
  votePoll 
} = require('../controllers/polls');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
  .get(getPolls)
  .post(protect, createPoll);

router.route('/:id')
  .get(getPoll)
  .put(protect, updatePoll)
  .delete(protect, deletePoll);

router.route('/:id/vote')
  .post(protect, votePoll);

module.exports = router; 