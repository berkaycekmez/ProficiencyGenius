const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set!");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// DİKKAT: Modeli JSON komutlarına daha sadık olan gemini-pro olarak değiştiriyoruz.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

function extractJsonFromText(text) {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```|({[\s\S]*?}|\[[\s\S]*?\])/);
    if (jsonMatch && (jsonMatch[1] || jsonMatch[2])) {
        return jsonMatch[1] || jsonMatch[2];
    }
    return null;
}

class GeminiService {
    constructor() {
        console.log("Backend Gemini Service has been initialized successfully.");
    }

    async makeRequest(prompt, responseFormat = 'text') {
        try {
            const generationConfig = responseFormat === 'json' ? { responseMimeType: "application/json" } : {};
            const result = await model.generateContent(prompt, generationConfig);
            const response = result.response;
            let text = response.text();

            if (!text) {
                throw new Error('No response generated from Gemini API');
            }

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
            // Hataları zincirleme olarak yukarı fırlatıyoruz ki app.js yakalayabilsin.
            throw error;
        }
    }

    // --- SENİN ORİJİNAL, DETAYLI PROMPT'LARIN İLE GÜNCELLENMİŞ FONKSİYONLAR ---

    async generateGrammarQuestions(level, count = 25) {
        const prompt = `Generate ${count} English grammar multiple-choice questions for ${level} level students. Level characteristics: basic present tense, simple vocabulary, basic sentence structure. Requirements: 1. Progress from easier to harder within the ${level} level. 2. Each question should have exactly 4 options (A, B, C, D). 3. Cover diverse grammar topics appropriate for ${level}. 4. Ensure questions are unique and realistic. 5. Include a variety of question types (fill-in-the-blank, error correction, sentence completion). Your entire response must be ONLY a single, valid JSON array of objects. Do not use markdown. Start with '[' and end with ']'. Each object must have these exact keys: "question", "options" (an array of 4 strings), "correct" (the 0-indexed integer of the correct option), "topic", "level", "explanation".`;
        return await this.makeRequest(prompt, 'json');
    }

    async generateReadingQuestions(level, count = 5) {
        const prompt = `Generate ${count} English reading comprehension exercises for ${level} level students. Level characteristics: moderately complex texts, varied topics, some unfamiliar vocabulary, clear main ideas. Requirements: 1. Each exercise should have a passage (150-300 words for B1-C1). 2. Include ${count} questions per passage, each with 4 multiple-choice options. 3. Passages should be interesting and relevant to real life. 4. Questions should test: main idea, details, inference, vocabulary in context. Your entire response must be ONLY a single, valid JSON array. Do not use markdown. Start with '[' and end with ']'. The structure must be: [ { "passage": "...", "questions": [ { "question": "...", "options": [...], "correct": 0, ... } ] } ]`;
        return await this.makeRequest(prompt, 'json');
    }

    async generateLearningReport(answers, questions) {
        const analysis = this.analyzeAnswers(answers, questions);
        const prompt = `Based on this English test analysis, generate a comprehensive learning report: Test Results: - Total Score: ${analysis.correctAnswers}/${analysis.totalQuestions}, - Grammar Score: ${analysis.grammarCorrect}/${analysis.grammarTotal}, - Reading Score: ${analysis.readingCorrect}/${analysis.readingTotal}, - Estimated Level: ${analysis.estimatedLevel}, Mistakes by Topic: ${Object.entries(analysis.mistakesByTopic).map(([topic, data]) => `- ${topic}: ${data.wrong}/${data.total} incorrect`).join('\n')}. Generate a JSON response with: 1. Proficiency level assessment with detailed description. 2. Strengths and areas for improvement. 3. Specific recommendations for each weak topic. 4. Study suggestions and resources. Your entire response must be ONLY a single, valid JSON object. Do not use markdown. Start with '{' and end with '}'. The structure must be: { "level": "${analysis.estimatedLevel}", "levelInfo": { "title": "A title for the ${analysis.estimatedLevel} level", "description": "Detailed description..." }, "strengths": ["..."], "weakAreas": [ { "topic": "...", "performance": "...", "explanation": "...", "recommendations": ["..."] } ], "overallRecommendations": ["..."], "nextSteps": ["..."] }`;
        return await this.makeRequest(prompt, 'json');
    }

    async translateToTurkish(reportText) {
        const prompt = `Translate the following English proficiency test learning report to Turkish. Maintain the same structure. English Report: ${reportText}. Please return ONLY a valid JSON object with the same structure, but translated to Turkish. Do NOT use markdown ticks.`;
        return await this.makeRequest(prompt, 'json');
    }

    analyzeAnswers(answers, questions) {
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

// Bu satır, bu dosyadaki GeminiService sınıfını app.js'in kullanabilmesi için dışarıya açar.
module.exports = GeminiService;