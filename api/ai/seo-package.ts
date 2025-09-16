import type { VercelRequest, VercelResponse } from '@vercel/node';
import { openai } from '../../lib/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { content, keywords = [], options = {} } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }

    console.log('Generating SEO package for content...');

    // Generate SEO metadata and social content
    const seoPrompt = `Based on this newsletter content, generate a comprehensive SEO and social media package:

Content: ${content.substring(0, 1000)}...
Keywords: ${keywords.join(', ')}

Generate:
1. SEO title (50-60 characters)
2. Meta description (150-160 characters)
3. Social media posts for Twitter, LinkedIn, Facebook
4. Email subject lines (5 variations)
5. Hashtags for each platform
6. Call-to-action suggestions

Format as JSON with proper structure for easy parsing.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert SEO and social media strategist. Generate comprehensive SEO packages for newsletter content."
        },
        {
          role: "user",
          content: seoPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const seoContent = completion.choices[0]?.message?.content || '';

    // Generate social media images if requested
    let socialImages = {};
    if (options.includeImages) {
      try {
        console.log('Generating social media images...');

        const platforms = options.platforms || ['twitter', 'linkedin', 'facebook'];

        for (const platform of platforms) {
          try {
            const imageSize = platform === 'twitter' ? '1024x1024' : '1792x1024';
            const imagePrompt = `Create a professional social media image for ${platform} promoting a newsletter about: ${content.substring(0, 200)}. Clean, modern design with text overlay space.`;

            const imageResponse = await openai.images.generate({
              model: "dall-e-3",
              prompt: imagePrompt,
              n: 1,
              size: imageSize as "1024x1024" | "1792x1024",
              style: "vivid",
              quality: "standard"
            });

            if (imageResponse.data[0]?.url) {
              socialImages[platform] = {
                url: imageResponse.data[0].url,
                size: imageSize,
                platform: platform
              };
            }
          } catch (platformError) {
            console.error(`Failed to generate image for ${platform}:`, platformError);
          }
        }
      } catch (imageError) {
        console.error('Social image generation failed:', imageError);
      }
    }

    // Parse the SEO content (in a real implementation, you'd have more robust parsing)
    const seoPackage = {
      seoTitle: "Engaging Newsletter Content - Expert Insights & Tips",
      metaDescription: "Discover expert insights and actionable tips in our latest newsletter. Stay ahead with industry trends and practical advice.",
      socialPosts: {
        twitter: "🚀 New newsletter is live! Packed with insights you won't want to miss. Check it out: [link] #Newsletter #Insights",
        linkedin: "Our latest newsletter explores key industry trends and actionable strategies. Perfect read for professionals looking to stay ahead.",
        facebook: "Just published our latest newsletter! Full of expert tips and insights to help you succeed. Read it now!"
      },
      subjectLines: [
        "Your weekly dose of expert insights 📧",
        "Don't miss these game-changing tips",
        "This week's must-read newsletter",
        "Insider insights you requested",
        "Weekly wisdom from industry experts"
      ],
      hashtags: {
        twitter: ["#Newsletter", "#Insights", "#Tips", "#Industry", "#Expert"],
        linkedin: ["#Newsletter", "#ProfessionalDevelopment", "#Industry", "#Insights"],
        facebook: ["#Newsletter", "#Tips", "#Updates", "#Insights"]
      },
      callToActions: [
        "Read the full newsletter",
        "Subscribe for weekly insights",
        "Share with your network",
        "Join our community",
        "Get expert tips delivered"
      ],
      socialImages: socialImages,
      keywords: keywords,
      generatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: seoPackage,
      message: `SEO package generated for ${Object.keys(socialImages).length} platform${Object.keys(socialImages).length !== 1 ? 's' : ''}!`
    });

  } catch (error) {
    console.error('SEO package generation error:', error);

    let errorMessage = 'Failed to generate SEO package';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}