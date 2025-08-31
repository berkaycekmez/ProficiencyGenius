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
        console.log("Backend Gemini Service has been initialized successfully.");
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
                            console.error("!!! Could not parse even the extracted text. Gemini response was: !!!");
                            console.error(text);
                            throw new Error('Extracted text is not valid JSON.');
                        }
                    } else {
                        console.error("!!! Could not find any JSON in the response. Gemini response was: !!!");
                        console.error(text);
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

    async generateGrammarQuestions(level, count = 25) {
        const prompt = `Generate ${count} English grammar multiple-choice questions for ${level} level students. Return ONLY a valid JSON array. Do NOT include markdown ticks (\`\`\`) or any introductory text. The response MUST start with '[' and end with ']'. Exact structure: [ { "question": "...", "options": [...], "correct": 1, "topic": "...", "level": "...", "explanation": "..." } ]`;
        return await this.makeRequest(prompt, 'json');
    }

    async generateReadingQuestions(level, count = 5) {
        const prompt = `Generate ${count} English reading comprehension exercises for ${level} level students. Return ONLY a valid JSON array. Do NOT include markdown ticks (\`\`\`) or explanatory text. The response MUST start with '[' and end with ']'. Exact structure: [ { "passage": "...", "questions": [ { "question": "...", "options": [...], "correct": 0, ... } ] } ]`;
        return await this.makeRequest(prompt, 'json');
    }

async generateLearningReport(answers, questions) {
        const analysis = this.analyzeAnswers(answers, questions);
        
        // --- DAHA BASİT VE DAHA KATI HALE GETİRİLMİŞ RAPOR İSTEĞİ (PROMPT) ---
        const prompt = `
        Analyze these English test results:
        - Score: ${analysis.correctAnswers}/${analysis.totalQuestions}
        - Level: ${analysis.estimatedLevel}
        - Mistakes by Topic: ${Object.entries(analysis.mistakesByTopic).map(([topic, data]) => `- ${topic}: ${data.wrong}/${data.total}`).join('; ')}

        CRITICAL INSTRUCTION:
        Your entire response MUST be ONLY a single, valid JSON object.
        Do NOT add any text before or after the JSON object.
        Do NOT use markdown like \`\`\`json.
        Your response must start with { and end with }.

        Use this EXACT JSON structure. Fill the string values. Do not add new keys.
        {
          "level": "${analysis.estimatedLevel}",
          "levelDescription": "A detailed description of the ${analysis.estimatedLevel} proficiency level.",
          "strengths": ["One or two key strengths based on the analysis."],
          "weakAreas": [
            {
              "topic": "The most important topic to improve",
              "explanation": "A simple explanation of why mistakes might have occurred in this topic.",
              "recommendations": ["A single, actionable recommendation for this topic."]
            }
          ]
        }`;
        return await this.makeRequest(prompt, 'json');
    }

    async translateToTurkish(reportText) {
        const prompt = `Translate the following English learning report to Turkish. English Report: ${reportText}. Return ONLY a valid JSON object with the same structure, translated to Turkish. Do NOT use markdown ticks.`;
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
        const accuracy = questions.length > 0 ? correctAnswers / questions.length : 0;
        let estimatedLevel = 'A1';
        if (accuracy >= 0.9) estimatedLevel = 'C1';
        else if (accuracy >= 0.8) estimatedLevel = 'B2';
        else if (accuracy >= 0.7) estimatedLevel = 'B1';
        else if (accuracy >= 0.6) estimatedLevel = 'A2';
        return { correctAnswers, totalQuestions: questions.length, grammarCorrect, grammarTotal, readingCorrect, readingTotal, mistakesByTopic, mistakesByLevel, estimatedLevel, accuracy };
    }
}

module.exports = GeminiService;