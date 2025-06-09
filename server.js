// Upload work photos endpoint
app.post('/api/auth/upload-work-photos', upload.array('workPhotos', 10), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process uploaded files
    const workPhotos = req.files.map(file => ({
      path: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    // Find user and update work photos
    let user;
    if (USE_MONGODB) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Add new work photos to existing ones
      if (!user.workPhotos) {
        user.workPhotos = [];
      }
      user.workPhotos.push(...workPhotos);
      await user.save();
    } else {
      // In-memory storage
      user = users[userId];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.workPhotos) {
        user.workPhotos = [];
      }
      user.workPhotos.push(...workPhotos);
    }

    res.json({
      message: 'Work photos uploaded successfully',
      workPhotos: user.workPhotos,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        workPhotos: user.workPhotos,
        certificates: user.certificates
      }
    });
  } catch (error) {
    console.error('Error uploading work photos:', error);
    res.status(500).json({ error: 'Failed to upload work photos' });
  }
});

// Upload certificates endpoint
app.post('/api/auth/upload-certificates', upload.array('certificates', 10), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process uploaded files
    const certificates = req.files.map(file => ({
      path: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    // Find user and update certificates
    let user;
    if (USE_MONGODB) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Add new certificates to existing ones
      if (!user.certificates) {
        user.certificates = [];
      }
      user.certificates.push(...certificates);
      await user.save();
    } else {
      // In-memory storage
      user = users[userId];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.certificates) {
        user.certificates = [];
      }
      user.certificates.push(...certificates);
    }

    res.json({
      message: 'Certificates uploaded successfully',
      certificates: user.certificates,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        workPhotos: user.workPhotos,
        certificates: user.certificates
      }
    });
  } catch (error) {
    console.error('Error uploading certificates:', error);
    res.status(500).json({ error: 'Failed to upload certificates' });
  }
});