import { getOpenAIClient, DEFAULT_MODEL } from '../openai.js';
import { AI_CONFIG, FEEDBACK_TONES, getScoreCategory, getEncouragementMessage } from './config.js';
import { extractQualityScore, extractWordDetails } from '../speechace.js';

/**
 * Generate AI-powered pronunciation feedback
 * 
 * @param {Object} analysisData - SpeechAce analysis result
 * @param {Object} options - Feedback options
 * @param {string} options.targetText - Text that was spoken
 * @param {string} options.tone - Feedback tone (encouraging, neutral, detailed, brief)
 * @param {string} options.language - Language being learned
 * @param {number} options.maxTokens - Maximum tokens for AI response
 * @returns {Promise<Object>} Feedback object
 */
export async function generateFeedback(analysisData, options = {}) {
  const {
    targetText = '',
    tone = FEEDBACK_TONES.ENCOURAGING,
    language = 'French',
    maxTokens
  } = options;

  const score = extractQualityScore(analysisData);
  const category = getScoreCategory(score);
  const encouragement = getEncouragementMessage(score);

  // Determine token limit based on tone
  const tokenLimit = maxTokens || AI_CONFIG.maxTokens[
    tone === FEEDBACK_TONES.BRIEF ? 'brief' :
    tone === FEEDBACK_TONES.DETAILED ? 'detailed' :
    'standard'
  ];

  const systemPrompt = getSystemPrompt(tone, language);
  const userPrompt = getUserPrompt(targetText, score, category, analysisData);

  const openai = getOpenAIClient();
  
  const aiResponse = await openai.chat.completions.create({
    model: AI_CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: AI_CONFIG.temperature,
    max_tokens: tokenLimit
  });

  const aiFeedback = aiResponse.choices[0].message.content;

  return {
    feedback: aiFeedback,
    encouragement: encouragement,
    score: score,
    category: category,
    wordCount: extractWordDetails(analysisData).length
  };
}

/**
 * Generate detailed pronunciation report
 * 
 * @param {Object} analysisData - SpeechAce analysis result
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Detailed report
 */
export async function generateDetailedReport(analysisData, options = {}) {
  const feedback = await generateFeedback(analysisData, {
    ...options,
    tone: FEEDBACK_TONES.DETAILED
  });

  const wordDetails = extractWordDetails(analysisData);
  const score = extractQualityScore(analysisData);

  return {
    ...feedback,
    overallScore: score,
    wordAnalysis: wordDetails.map(word => ({
      word: word.word,
      score: word.quality_score || 0,
      phonemes: word.phones || []
    })),
    strengths: identifyStrengths(wordDetails),
    areasForImprovement: identifyWeaknesses(wordDetails),
    rawAnalysis: analysisData
  };
}

/**
 * Get system prompt based on tone
 * @private
 */
function getSystemPrompt(tone, language) {
  const prompts = {
    [FEEDBACK_TONES.ENCOURAGING]: `You are an encouraging ${language} pronunciation coach. Provide warm, supportive feedback that motivates learners while offering specific, actionable tips for improvement.`,
    
    [FEEDBACK_TONES.NEUTRAL]: `You are a ${language} pronunciation coach. Provide objective, factual feedback on pronunciation performance with specific areas for improvement.`,
    
    [FEEDBACK_TONES.DETAILED]: `You are an expert ${language} pronunciation coach. Provide comprehensive analysis of pronunciation performance, including phonetic details, specific sounds to work on, and practice strategies.`,
    
    [FEEDBACK_TONES.BRIEF]: `You are a ${language} pronunciation coach. Provide concise, focused feedback with 1-2 key improvement tips.`
  };

  return prompts[tone] || prompts[FEEDBACK_TONES.ENCOURAGING];
}

/**
 * Get user prompt for AI
 * @private
 */
function getUserPrompt(targetText, score, category, analysisData) {
  const wordDetails = extractWordDetails(analysisData);
  const problemWords = wordDetails
    .filter(w => (w.quality_score || 0) < 70)
    .map(w => w.word)
    .slice(0, 3);

  let prompt = `The learner attempted to say "${targetText}" and received a score of ${score}/100 (${category}).`;
  
  if (problemWords.length > 0) {
    prompt += ` They had difficulty with: ${problemWords.join(', ')}.`;
  }
  
  prompt += ` Provide helpful feedback.`;
  
  return prompt;
}

/**
 * Identify pronunciation strengths
 * @private
 */
function identifyStrengths(wordDetails) {
  return wordDetails
    .filter(w => (w.quality_score || 0) >= 80)
    .map(w => w.word)
    .slice(0, 5);
}

/**
 * Identify areas needing improvement
 * @private
 */
function identifyWeaknesses(wordDetails) {
  return wordDetails
    .filter(w => (w.quality_score || 0) < 70)
    .map(w => ({
      word: w.word,
      score: w.quality_score || 0
    }))
    .slice(0, 5);
}

/**
 * Generate quick feedback without AI (faster, but less personalized)
 * 
 * @param {Object} analysisData - SpeechAce analysis result
 * @returns {Object} Basic feedback
 */
export function generateQuickFeedback(analysisData) {
  const score = extractQualityScore(analysisData);
  const category = getScoreCategory(score);
  const encouragement = getEncouragementMessage(score);
  const wordDetails = extractWordDetails(analysisData);
  
  const problemWords = wordDetails
    .filter(w => (w.quality_score || 0) < 70)
    .map(w => w.word);

  let feedback = encouragement + '\n\n';
  
  if (problemWords.length > 0) {
    feedback += `Focus on practicing: ${problemWords.slice(0, 3).join(', ')}`;
  } else {
    feedback += 'Great job on all words!';
  }

  return {
    feedback,
    encouragement,
    score,
    category,
    wordCount: wordDetails.length
  };
}
