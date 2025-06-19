const Poll = require('../models/Poll');

// @desc    Create a new poll
// @route   POST /api/polls
// @access  Private
exports.createPoll = async (req, res) => {
  try {
    // Add user to req.body
    req.body.creator = req.user.id;
    
    const poll = await Poll.create(req.body);

    res.status(201).json({
      success: true,
      data: poll
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get all polls
// @route   GET /api/polls
// @access  Public
exports.getPolls = async (req, res) => {
  try {
    const polls = await Poll.find().sort('-createdAt').populate('creator', 'name');

    res.status(200).json({
      success: true,
      count: polls.length,
      data: polls
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single poll
// @route   GET /api/polls/:id
// @access  Public
exports.getPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).populate('creator', 'name');

    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }

    res.status(200).json({
      success: true,
      data: poll
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update poll
// @route   PUT /api/polls/:id
// @access  Private
exports.updatePoll = async (req, res) => {
  try {
    let poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }

    // Make sure user is poll creator
    if (poll.creator.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this poll'
      });
    }

    // Cannot update once people have voted
    if (poll.voters.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update a poll once voting has begun'
      });
    }

    poll = await Poll.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: poll
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete poll
// @route   DELETE /api/polls/:id
// @access  Private
exports.deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }

    // Make sure user is poll creator
    if (poll.creator.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this poll'
      });
    }

    await Poll.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Delete poll error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Vote on a poll
// @route   POST /api/polls/:id/vote
// @access  Private
exports.votePoll = async (req, res) => {
  try {
    const { optionId } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }

    // Check if poll is expired
    if (new Date() > new Date(poll.expiresAt)) {
      return res.status(400).json({
        success: false,
        error: 'This poll has expired'
      });
    }

    // Check if user has already voted
    if (poll.voters.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'You have already voted on this poll'
      });
    }

    // Find the option and increment votes
    const option = poll.options.find(option => option._id.toString() === optionId);
    
    if (!option) {
      return res.status(404).json({
        success: false,
        error: 'Option not found'
      });
    }

    option.votes += 1;
    poll.voters.push(req.user.id);

    await poll.save();

    res.status(200).json({
      success: true,
      data: poll
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}; 