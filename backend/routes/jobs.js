const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const mongoService = require('../services/mongoService');
const Job = require('../models/Job');

// GET /api/jobs - Get all jobs with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    const jobs = await mongoService.searchJobs(filters);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id - Get a specific job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /api/jobs - Create a new job
router.post('/', authenticateToken, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      ownerId: req.user.userId,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const job = await mongoService.createJob(jobData);
    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job', details: error.message });
  }
});

// PUT /api/jobs/:id - Update a job
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if the user is the owner of the job
    if (job.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// DELETE /api/jobs/:id - Delete a job
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if the user is the owner of the job
    if (job.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// GET /api/jobs/owner/:ownerId - Get jobs by owner
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const jobs = await mongoService.getJobsByOwner(req.params.ownerId);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs by owner:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// POST /api/jobs/:id/apply - Apply to a job
router.post('/:id/apply', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user already applied
    const existingApplication = job.applications?.find(
      app => app.workerId.toString() === req.user.userId
    );

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied to this job' });
    }

    // Add application
    const application = {
      workerId: req.user.userId,
      appliedAt: new Date(),
      status: 'pending',
      ...req.body
    };

    job.applications = job.applications || [];
    job.applications.push(application);
    await job.save();

    res.json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Error applying to job:', error);
    res.status(500).json({ error: 'Failed to apply to job' });
  }
});

// GET /api/jobs/:id/applications - Get applications for a job
router.get('/:id/applications', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('applications.workerId', 'fullName email profilePhoto');
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if the user is the owner of the job
    if (job.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to view applications' });
    }

    res.json(job.applications || []);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

module.exports = router;