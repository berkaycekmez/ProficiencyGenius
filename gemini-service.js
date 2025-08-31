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
        console.log("Backend Gemini Service (Intelligent Report Version) has been initialized.");
    }

    async makeRequest(prompt, responseFormat = 'text') {
        // ... (Bu fonksiyonun içi bir önceki mesajdakiyle tamamen aynı)
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

    // --- EN ÖNEMLİ DEĞİŞİKLİK: REPLIT'İN AKILLI RAPOR PROMPT'U ---
    async generateLearningReport(answers, questions) {
        const analysis = this.analyzeAnswers(answers, questions);
        
        // Bu prompt, AI'ı bir öğretmen gibi davranmaya ve detaylı, eğitici geri bildirimler vermeye zorlar.
        const prompt = `
        Act as an expert English language tutor. Analyze the following English test results for a student.

        Test Results Data:
        - Score: ${analysis.correctAnswers}/${analysis.totalQuestions}
        - Estimated Level: ${analysis.estimatedLevel}
        - Mistakes by Topic: ${Object.entries(analysis.mistakesByTopic).map(([topic, data]) => `- ${topic}: ${data.wrong}/${data.total} incorrect`).join('\n')}

        CRITICAL INSTRUCTION:
        Your entire response must be ONLY a single, valid JSON object. Do not add any text before or after the JSON object. Do not use markdown like \`\`\`. Your response must start with '{' and end with '}'.

        For each "weakAreas" topic, you MUST provide a helpful, educational "explanation" that includes a mini-lesson on the grammar rule, and a list of "recommendations".

        Use this EXACT JSON structure:
        {
          "level": "${analysis.estimatedLevel}",
          "levelInfo": { 
              "title": "A title for the ${analysis.estimatedLevel} level (e.g., 'Intermediate', 'Beginner')",
              "description": "A detailed, encouraging description of this proficiency level and what it means."
          },
          "strengths": ["A list of 1-3 key strengths based on the student's correct answers."],
          "weakAreas": [
            {
              "topic": "The name of a weak topic (e.g., 'Present Perfect Tense')",
              "performance": "weak",
              "explanation": "A mini-lesson explaining the rule for this topic. For example: 'The present perfect tense is used to talk about past actions that have a connection to the present. It's formed with have/has + past participle. You made mistakes where you used the simple past instead.'",
              "recommendations": ["A list of 1-2 actionable recommendations, e.g., 'Practice forming sentences with have/has + verb.', 'Review the past participles of irregular verbs.']
            }
          ],
          "overallRecommendations": ["A list of general study advice for a student at this level."],
          "nextSteps": ["A list of actionable next steps for the student to take."]
        }`;
        
        return await this.makeRequest(prompt, 'json');
    }

    // ... (Diğer tüm fonksiyonlar: generateGrammarQuestions, analyzeAnswers, vb. aynı kalabilir)
    // ... Onları tekrar ekleyerek kodu tamamlıyorum.
    
    async generateGrammarQuestions(level, count = 5) {
        const prompt = `Generate ${count} English grammar multiple-choice questions for the ${level} CEFR level. Your entire response must be ONLY a single, valid JSON array of objects. Do not use markdown. Start with '[' and end with ']'. Each object must have these exact keys: "question", "options" (an array of 4 strings), "correct" (the 0-indexed integer of the correct option), "topic", "level", "explanation".`;
        return await this.makeRequest(prompt, 'json');
    }

    async generateReadingQuestions(level, count = 1) {
        const prompt = `Generate ${count} English reading comprehension exercise for the ${level} CEFR level. Your entire response must be ONLY a single, valid JSON array. Do not use markdown. Start with '[' and end with ']'. The structure must be: [ { "passage": "...", "questions": [ { "question": "...", "options": [...], "correct": 0, ... } ] } ]`;
        return await this.makeRequest(prompt, 'json');
    }

    async translateToTurkish(reportText) {
        const prompt = `Translate the following English learning report to Turkish. English Report: ${reportText}. CRITICAL: Please return ONLY a valid JSON object with the same structure, translated to Turkish: { "strengths": ["..."], "weakAreas": [ { "topic": "...", "explanation": "...", "recommendations": ["..."] } ], "overallRecommendations": ["..."], "nextSteps": ["..."] }. Do NOT use markdown ticks.`;
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