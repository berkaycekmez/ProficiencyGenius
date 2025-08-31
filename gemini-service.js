const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set!");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function extractJsonFromText(text) {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```|({[\s\S]*?}|\[[\s\S]*?\])/);
    if (jsonMatch && (jsonMatch[1] || jsonMatch[2])) {
        return jsonMatch[1] || jsonMatch[2];
    }
    return null;
}

class GeminiService {
    constructor() {
        console.log("Backend Gemini Service (Replit Logic) has been initialized successfully.");
    }

    async makeRequest(prompt, responseFormat = 'text') {
        try {
            const generationConfig = responseFormat === 'json' ? { responseMimeType: "application/json" } : {};
            const result = await model.generateContent(prompt, generationConfig);
            const response = result.response;
            let text = response.text();

            if (!text) throw new Error('No response generated from Gemini API');

            if (responseFormat === 'json') {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.warn("Direct JSON.parse failed, attempting to extract JSON from text...");
                    const extractedJsonText = extractJsonFromText(text);
                    if (extractedJsonText) {
                        try {
                            return JSON.parse(extractedJsonText);
                        } catch (finalError) {
                            console.error("!!! Could not parse even the extracted text. Gemini response was: !!!", text);
                            throw new Error('Extracted text is not valid JSON.');
                        }
                    } else {
                        console.error("!!! Could not find any JSON in the response. Gemini response was: !!!", text);
                        throw new Error('No JSON found in response text.');
                    }
                }
            }
            return text;
        } catch (error) {
            console.error('Gemini API request failed:', error.message);
            if (error.message && (error.message.includes('quota') || error.message.includes('RATE_LIMIT_EXCEEDED'))) {
                const quotaError = new Error('QUOTA_EXCEEDED');
                quotaError.isQuotaError = true;
                throw quotaError;
            }
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }

    // --- REPLIT'İN OLUŞTURDUĞU ORİJİNAL VE DETAYLI PROMPT'LAR ---

    async generateGrammarQuestions(level, count = 25) {
        const prompt = `Generate ${count} English grammar multiple-choice questions for ${level} level students... (Orijinal uzun prompt metniniz buraya gelecek)`;
        return await this.makeRequest(prompt, 'json');
    }

    async generateReadingQuestions(level, count = 5) {
        const prompt = `Generate ${count} English reading comprehension exercises for ${level} level students... (Orijinal uzun prompt metniniz buraya gelecek)`;
        return await this.makeRequest(prompt, 'json');
    }
    
    // EN ÖNEMLİ KISIM: REPLIT'İN DETAYLI RAPOR PROMPT'U
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

        Return ONLY valid JSON with this exact structure. Do NOT use markdown.
        {
          "level": "${analysis.estimatedLevel}",
          "levelInfo": { 
              "title": "A title for the ${analysis.estimatedLevel} level",
              "description": "Detailed description of this proficiency level..."
          },
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

    async translateToTurkish(reportText) {
        const prompt = `Translate the following English proficiency test learning report to Turkish... (Orijinal uzun prompt metniniz buraya gelecek)`;
        return await this.makeRequest(prompt, 'json');
    }

    analyzeAnswers(answers, questions) {
        // ... (Bu fonksiyonun içeriği tamamen aynı kalıyor)
        let correctAnswers = 0, grammarCorrect = 0, readingCorrect = 0, grammarTotal = 0, readingTotal = 0;
        const mistakesByTopic = {}, mistakesByLevel = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
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
                if (question.type === 'reading' || question.passage) readingCorrect++;
                if (question.type === 'grammar' || !question.passage) grammarCorrect++;
            } else {
                mistakesByTopic[topic].wrong++;
                mistakesByLevel[level]++;
            }
            if (question.type === 'reading' || question.passage) readingTotal++;
            if (question.type === 'grammar' || !question.passage) grammarTotal++;
        });
        const accuracy = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
        let estimatedLevel = 'A1';
        if (accuracy >= 90) estimatedLevel = 'C1';
        else if (accuracy >= 80) estimatedLevel = 'B2';
        else if (accuracy >= 70) estimatedLevel = 'B1';
        else if (accuracy >= 60) estimatedLevel = 'A2';
        return { correctAnswers, totalQuestions: questions.length, grammarCorrect, grammarTotal, readingCorrect, readingTotal, mistakesByTopic, mistakesByLevel, estimatedLevel, accuracy };
    }
}

module.exports = GeminiService;