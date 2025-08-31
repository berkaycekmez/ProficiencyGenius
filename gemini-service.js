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
        console.log("Backend Gemini Service has been initialized successfully with gemini-1.5-flash.");
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
                            console.error("!!! FATAL ERROR: Could not parse even the extracted text. Gemini response was:", text);
                            throw new Error('Extracted text is not valid JSON.');
                        }
                    } else {
                        console.error("!!! FATAL ERROR: Could not find any JSON in the response. Gemini response was:", text);
                        throw new Error('No JSON found in response text.');
                    }
                }
            }
            return text;
        } catch (error) {
            console.error('Gemini API request failed:', error.message);
            throw error;
        }
    }

    async generateGrammarQuestions(level, count = 25) {
        const prompt = `Generate ${count} English grammar multiple-choice questions for ${level} level students. Requirements: 1. Progress from easier to harder within the ${level} level. 2. Each question should have exactly 4 options (A, B, C, D). 3. Cover diverse grammar topics appropriate for ${level}. 4. Ensure questions are unique and realistic. 5. Include a variety of question types (fill-in-the-blank, error correction, sentence completion). CRITICAL: Return ONLY a valid JSON array with this exact structure: [ { "question": "...", "options": ["...", "...", "...", "..."], "correct": 1, "topic": "...", "level": "A1", "explanation": "..." } ]. Do not include markdown or any text outside the JSON array.`;
        return await this.makeRequest(prompt, 'json');
    }

    async generateReadingQuestions(level, count = 5) {
        const prompt = `Generate ${count} English reading comprehension exercises for ${level} level students. Requirements: 1. Each exercise should have a passage (150-300 words for B1-C1). 2. Include multiple questions per passage, each with 4 multiple-choice options. 3. Questions should test: main idea, details, inference, vocabulary in context. CRITICAL: Return ONLY a valid JSON array with this exact structure: [ { "passage": "...", "questions": [ { "question": "...", "options": [...], "correct": 0, "topic": "...", "level": "${level}", "explanation": "..." } ] } ]. Do not include markdown or any text outside the JSON array.`;
        return await this.makeRequest(prompt, 'json');
    }

    async generateLearningReport(answers, questions) {
        const analysis = this.analyzeAnswers(answers, questions);
        const prompt = `Based on this English test analysis, generate a comprehensive learning report: Test Results: - Total Score: ${analysis.correctAnswers}/${analysis.totalQuestions}, - Estimated Level: ${analysis.estimatedLevel}, Mistakes by Topic: ${Object.entries(analysis.mistakesByTopic).map(([topic, data]) => `- ${topic}: ${data.wrong}/${data.total} incorrect`).join('\n')}. CRITICAL: Generate a JSON response with: 1. Proficiency level assessment with detailed description. 2. Strengths and areas for improvement. 3. Specific recommendations for each weak topic. 4. Study suggestions and resources. Return ONLY valid JSON with this exact structure: { "level": "${analysis.estimatedLevel}", "levelInfo": { "title": "A title for the ${analysis.estimatedLevel} level", "description": "Detailed description..." }, "strengths": ["..."], "weakAreas": [ { "topic": "...", "performance": "weak/moderate/strong", "explanation": "...", "recommendations": ["..."] } ], "overallRecommendations": ["..."], "nextSteps": ["..."] }. Do NOT use markdown.`;
        return await this.makeRequest(prompt, 'json');
    }

    async translateToTurkish(reportText) {
        const prompt = `Translate the following English proficiency test learning report to Turkish. Maintain the same structure. English Report: ${reportText}. CRITICAL: Please return ONLY a valid JSON object with the same structure, but translated to Turkish: { "strengths": ["..."], "weakAreas": [ { "topic": "...", "explanation": "...", "recommendations": ["..."] } ], "overallRecommendations": ["..."], "nextSteps": ["..."] }. Do NOT use markdown ticks.`;
        return await this.makeRequest(prompt, 'json');
    }

    analyzeAnswers(answers, questions) {
        let correctAnswers = 0, grammarCorrect = 0, readingCorrect = 0, grammarTotal = 0, readingTotal = 0;
        const mistakesByTopic = {};
        questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correct;
            const topic = question.topic || 'General';
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
        return { correctAnswers, totalQuestions: questions.length, grammarCorrect, grammarTotal, readingCorrect, readingTotal, mistakesByTopic, estimatedLevel, accuracy };
    }
}

module.exports = GeminiService;