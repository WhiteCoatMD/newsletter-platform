import express from 'express';
import SimplifiedAIService from '../services/simplifiedAIService';
import { protect } from '../middleware/auth';

let aiService: SimplifiedAIService;

function getAIService() {
  if (!aiService) {
    aiService = new SimplifiedAIService();
  }
  return aiService;
}

const router = express.Router();

// @desc    Generate modular newsletter content
// @route   POST /api/ai/generate-content
// @access  Private
router.post('/generate-content', protect, async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    const result = await getAIService().generateContent(prompt, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Generate content error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Generate optimized subject lines
// @route   POST /api/ai/generate-subjects
// @access  Private
router.post('/generate-subjects', protect, async (req, res) => {
  try {
    const { content, options = {} } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const result = await getAIService().generateSubjectLines(content, options.count || 5);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Generate subjects error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Improve existing content
// @route   POST /api/ai/improve-content
// @access  Private
router.post('/improve-content', protect, async (req, res) => {
  try {
    const { content, improvementType = 'general' } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const result = await getAIService().improveContent(content, improvementType);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Improve content error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Generate content outline
// @route   POST /api/ai/generate-outline
// @access  Private
router.post('/generate-outline', protect, async (req, res) => {
  try {
    const { topic, options = {} } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    const result = await getAIService().generateOutline(topic, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Generate outline error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Generate section content
// @route   POST /api/ai/generate-section
// @access  Private
router.post('/generate-section', protect, async (req, res) => {
  try {
    const { sectionTitle, points, contentType = 'text' } = req.body;

    if (!sectionTitle || !points) {
      return res.status(400).json({
        success: false,
        message: 'Section title and points are required'
      });
    }

    const result = await getAIService().generateSectionContent(sectionTitle, points, contentType);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Generate section error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Analyze content
// @route   POST /api/ai/analyze-content
// @access  Private
router.post('/analyze-content', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const result = await getAIService().analyzeContent(content);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Analyze content error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Multi-pass content improvement
// @route   POST /api/ai/improve-multipass
// @access  Private
router.post('/improve-multipass', protect, async (req, res) => {
  try {
    const { content, options = {} } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const result = await getAIService().improveContent(content, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Multi-pass improvement error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Generate personalized content
// @route   POST /api/ai/personalize
// @access  Private
router.post('/personalize', protect, async (req, res) => {
  try {
    const { content, subscriberProfiles } = req.body;

    if (!content || !subscriberProfiles) {
      return res.status(400).json({
        success: false,
        message: 'Content and subscriber profiles are required'
      });
    }

    const result = await getAIService().generatePersonalizedContent(content, subscriberProfiles);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Personalization error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Create audio newsletter
// @route   POST /api/ai/create-audio
// @access  Private
router.post('/create-audio', protect, async (req, res) => {
  try {
    const { content, options = {} } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const result = await getAIService().createAudioNewsletter(content, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    // In a real implementation, you'd save the audio buffer to a file storage service
    // and return a URL instead of the raw buffer
    res.json({
      success: true,
      data: {
        audioUrl: '/api/ai/audio/' + Date.now() + '.mp3', // Placeholder URL
        duration: result.data?.duration || 0,
        voice: result.data?.voice || 'alloy',
        wordCount: result.data?.wordCount || 0
      }
    });

  } catch (error) {
    console.error('Audio creation error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Transcribe audio to newsletter
// @route   POST /api/ai/transcribe
// @access  Private
router.post('/transcribe', protect, async (req, res) => {
  try {
    const { audioFile, options = {} } = req.body;

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    // In a real implementation, you'd handle file upload properly
    const audioBuffer = Buffer.from(audioFile, 'base64');
    const result = await getAIService().transcribeToNewsletter(audioBuffer, 'mp3', options);

    if (!result.success || !result.data) {
      return res.status(500).json({
        success: false,
        message: 'success' in result && !result.success && 'error' in result ? result.error : 'Transcription failed'
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Generate SEO and social package
// @route   POST /api/ai/seo-package
// @access  Private
router.post('/seo-package', protect, async (req, res) => {
  try {
    const { content, keywords = [], options = {} } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const result = await getAIService().generateSEOPackage(content, keywords, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('SEO package error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Get AI system health
// @route   GET /api/ai/health
// @access  Private
router.get('/health', protect, async (req, res) => {
  try {
    const health = getAIService().getSystemHealth();

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('AI health check error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;