/**
 * Gemini API Service for English Proficiency Test
 * Handles all interactions with Google's Gemini AI model
 */

class GeminiService {
    constructor() {
        this.apiKey = this.getApiKey();
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = 'gemini-2.5-flash';
    }

    /**
     * Get API key from environment or prompt user
     */
    getApiKey() {
        // Try to get from URL parameters first (for Replit secrets)
        const urlParams = new URLSearchParams(window.location.search);
        const apiKey = urlParams.get('apiKey') || 
                      window.GEMINI_API_KEY || 
                      localStorage.getItem('gemini_api_key');
        
        if (!apiKey) {
            const userApiKey = prompt('Please enter your Gemini API key:');
            if (userApiKey) {
                localStorage.setItem('gemini_api_key', userApiKey);
                return userApiKey;
            } else {
                throw new Error('Gemini API key is required to use this application');
            }
        }
        
        return apiKey;
    }

    /**
     * Make a request to Gemini API
     */
    async makeRequest(prompt, responseFormat = 'text') {
        const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        // Add JSON response format if requested
        if (responseFormat === 'json') {
            requestBody.generationConfig = {
                responseMimeType: "application/json"
            };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || 'Unknown error';
                
                // Check for quota exceeded or rate limit errors
                if (response.status === 429 || 
                    errorMessage.includes('quota') || 
                    errorMessage.includes('QUOTA_EXCEEDED') ||
                    errorMessage.includes('rate limit') ||
                    errorMessage.includes('RATE_LIMIT_EXCEEDED')) {
                    const quotaError = new Error('QUOTA_EXCEEDED');
                    quotaError.isQuotaError = true;
                    throw quotaError;
                }
                
                throw new Error(`API Error: ${response.status} - ${errorMessage}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!text) {
                throw new Error('No response generated from Gemini API');
            }

            return responseFormat === 'json' ? JSON.parse(text) : text;
        } catch (error) {
            console.error('Gemini API request failed:', error);
            
            // Re-throw quota errors as-is
            if (error.isQuotaError) {
                throw error;
            }
            
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }

    /**
     * Generate grammar questions with progressive difficulty
     */
    async generateGrammarQuestions(level, count = 25) {
        const levelDescriptions = {
            'A1': 'basic present tense, simple vocabulary, basic sentence structure',
            'A2': 'past tense, future tense, comparatives, modal verbs (can, should)',
            'B1': 'present perfect, conditionals, passive voice, prepositions',
            'B2': 'complex tenses, subjunctive mood, advanced vocabulary, phrasal verbs',
            'C1': 'advanced grammar structures, nuanced vocabulary, complex sentence patterns'
        };

        const prompt = `Generate ${count} English grammar multiple-choice questions for ${level} level students.

Level characteristics: ${levelDescriptions[level]}

Requirements:
1. Progress from easier to harder within the ${level} level
2. Each question should have exactly 4 options (A, B, C, D)
3. Cover diverse grammar topics appropriate for ${level}
4. Ensure questions are unique and realistic
5. Include a variety of question types (fill-in-the-blank, error correction, sentence completion)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Complete the sentence: She ___ to work every day.",
    "options": ["go", "goes", "going", "gone"],
    "correct": 1,
    "topic": "Present Simple",
    "level": "A1",
    "explanation": "With third person singular subjects (she, he, it), we add 's' to the verb in present simple."
  }
]

Important: 
- The "correct" field should be the index (0-3) of the correct answer
- Questions should be practical and commonly used in real communication
- Avoid obscure grammar rules or overly academic examples`;

        return await this.makeRequest(prompt, 'json');
    }

    /**
     * Generate reading comprehension questions
     */
    async generateReadingQuestions(level, count = 5) {
        const levelDescriptions = {
            'A1': 'very simple texts, basic vocabulary, short sentences, familiar topics',
            'A2': 'simple texts, everyday situations, clear structure, common vocabulary',
            'B1': 'moderately complex texts, varied topics, some unfamiliar vocabulary, clear main ideas',
            'B2': 'complex texts, abstract concepts, nuanced language, implied meanings',
            'C1': 'sophisticated texts, complex ideas, advanced vocabulary, subtle implications'
        };

        const prompt = `Generate ${count} English reading comprehension exercises for ${level} level students.

Level characteristics: ${levelDescriptions[level]}

Requirements:
1. Each exercise should have a passage (50-200 words for A1-A2, 150-300 words for B1-C1)
2. Include ${count} questions per passage, each with 4 multiple-choice options
3. Passages should be interesting and relevant to real life
4. Questions should test: main idea, details, inference, vocabulary in context
5. Progress in difficulty within the ${level} level

Return ONLY a valid JSON array with this exact structure:
[
  {
    "passage": "Text of the reading passage here...",
    "questions": [
      {
        "question": "What is the main idea of the passage?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct": 0,
        "topic": "Main Idea",
        "level": "${level}",
        "explanation": "The passage primarily discusses..."
      }
    ]
  }
]

Important:
- Passages should be engaging and culturally neutral
- Questions should have clear, unambiguous correct answers
- The "correct" field should be the index (0-3) of the correct answer`;

        return await this.makeRequest(prompt, 'json');
    }

    /**
     * Generate adaptive questions based on performance
     */
    async generateAdaptiveQuestions(currentLevel, performance, questionType = 'grammar', count = 5) {
        const nextLevel = this.calculateNextLevel(currentLevel, performance);
        
        if (questionType === 'grammar') {
            return await this.generateGrammarQuestions(nextLevel, count);
        } else {
            return await this.generateReadingQuestions(nextLevel, count);
        }
    }

    /**
     * Calculate next difficulty level based on performance
     */
    calculateNextLevel(currentLevel, correctAnswers, totalAnswers) {
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
        const currentIndex = levels.indexOf(currentLevel);
        const accuracy = correctAnswers / totalAnswers;

        if (accuracy >= 0.8 && currentIndex < levels.length - 1) {
            return levels[currentIndex + 1];
        } else if (accuracy < 0.5 && currentIndex > 0) {
            return levels[currentIndex - 1];
        }
        
        return currentLevel;
    }

    /**
     * Evaluate user performance and generate learning report
     */
    async generateLearningReport(answers, questions) {
        const analysis = this.analyzeAnswers(answers, questions);
        
        const prompt = `Based on this English test analysis, generate a comprehensive learning report:

Test Results:
- Total Score: ${analysis.correctAnswers}/${analysis.totalQuestions}
- Grammar Score: ${analysis.grammarCorrect}/${analysis.grammarTotal}
- Reading Score: ${analysis.readingCorrect}/${analysis.readingTotal}
- Estimated Level: ${analysis.estimatedLevel}

Mistakes by Topic:
${Object.entries(analysis.mistakesByTopic).map(([topic, data]) => 
    `- ${topic}: ${data.wrong}/${data.total} incorrect`
).join('\n')}

Generate a JSON response with:
1. Proficiency level assessment with detailed description
2. Strengths and areas for improvement
3. Specific recommendations for each weak topic
4. Study suggestions and resources

Return ONLY valid JSON with this structure:
{
  "level": "${analysis.estimatedLevel}",
  "levelDescription": "Detailed description of this proficiency level...",
  "strengths": ["List of strengths based on performance"],
  "weakAreas": [
    {
      "topic": "Topic name",
      "performance": "weak/moderate/strong",
      "explanation": "Why mistakes occurred in this area",
      "recommendations": ["Specific study suggestions"]
    }
  ],
  "overallRecommendations": ["General study advice"],
  "nextSteps": ["What to focus on next"]
}`;

        return await this.makeRequest(prompt, 'json');
    }

    /**
     * Analyze user answers to identify patterns and estimate level
     */
    analyzeAnswers(answers, questions) {
        let correctAnswers = 0;
        let grammarCorrect = 0;
        let readingCorrect = 0;
        let grammarTotal = 0;
        let readingTotal = 0;
        const mistakesByTopic = {};
        const mistakesByLevel = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };

        questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correct;
            const topic = question.topic || 'General';
            const level = question.level || 'A1';

            if (!mistakesByTopic[topic]) {
                mistakesByTopic[topic] = { correct: 0, wrong: 0, total: 0 };
            }

            mistakesByTopic[topic].total++;
            
            if (isCorrect) {
                correctAnswers++;
                mistakesByTopic[topic].correct++;
                
                if (question.type === 'reading' || question.passage) {
                    readingCorrect++;
                }
                if (question.type === 'grammar' || !question.passage) {
                    grammarCorrect++;
                }
            } else {
                mistakesByTopic[topic].wrong++;
                mistakesByLevel[level]++;
            }

            if (question.type === 'reading' || question.passage) {
                readingTotal++;
            }
            if (question.type === 'grammar' || !question.passage) {
                grammarTotal++;
            }
        });

        // Estimate proficiency level based on performance
        const accuracy = correctAnswers / questions.length;
        let estimatedLevel = 'A1';
        
        if (accuracy >= 0.9) estimatedLevel = 'C1';
        else if (accuracy >= 0.8) estimatedLevel = 'B2';
        else if (accuracy >= 0.7) estimatedLevel = 'B1';
        else if (accuracy >= 0.6) estimatedLevel = 'A2';

        return {
            correctAnswers,
            totalQuestions: questions.length,
            grammarCorrect,
            grammarTotal,
            readingCorrect,
            readingTotal,
            mistakesByTopic,
            mistakesByLevel,
            estimatedLevel,
            accuracy
        };
    }

    /**
     * Translate learning report to Turkish
     */
    async translateToTurkish(reportText) {
        const prompt = `Translate the following English proficiency test learning report to Turkish. 
Maintain the same structure and provide accurate, helpful translations for Turkish language learners.

English Report:
${reportText}

Please return a JSON response with the same structure as the original report, but translated to Turkish:
{
  "strengths": ["Translated strength items in Turkish"],
  "weakAreas": [
    {
      "topic": "Translated topic name",
      "explanation": "Translated explanation in Turkish",
      "recommendations": ["Translated recommendations in Turkish"],
      "performance": "weak/moderate/strong (keep in English)"
    }
  ],
  "overallRecommendations": ["Translated study recommendations in Turkish"],
  "nextSteps": ["Translated next steps in Turkish"]
}

Important guidelines:
- Use natural, educational Turkish language
- Keep technical English terms where appropriate (like grammar terms: Present Perfect, etc.)
- Make recommendations culturally appropriate for Turkish learners
- Ensure the tone is encouraging and supportive`;

        return await this.makeRequest(prompt, 'json');
    }
}

// Export for use in other modules
window.GeminiService = GeminiService;
