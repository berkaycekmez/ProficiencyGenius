const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Bu fonksiyon, Gemini'dan gelen metnin içinden JSON'ı ayıklamaya çalışır.
 * Bu, Gemini'ın fazladan metin veya markdown eklemesi durumuna karşı bir sigortadır.
 */
function extractJsonFromText(text) {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```|({[\s\S]*?}|\[[\s\S]*?\])/);
    if (jsonMatch && (jsonMatch[1] || jsonMatch[2])) {
        return jsonMatch[1] || jsonMatch[2];
    }
    return text; // Eğer eşleşme bulunamazsa, orijinal metni döndür
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
                    // Önce doğrudan parse etmeyi dene
                    return JSON.parse(text);
                } catch (e) {
                    console.warn("Direct JSON.parse failed, attempting to extract JSON from text...");
                    // Eğer başarısız olursa, metinden JSON ayıklamayı dene
                    const extractedJsonText = extractJsonFromText(text);
                    return JSON.parse(extractedJsonText); // Ayıklanmış metni parse et
                }
            }
            return text;
        } catch (error) {
            console.error('Gemini API request failed:', error);
            if (error.message && (error.message.includes('quota') || error.message.includes('RATE_LIMIT_EXCEEDED'))) {
                const quotaError = new Error('QUOTA_EXCEEDED');
                quotaError.isQuotaError = true;
                throw quotaError;
            }
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }

    // --- PROMPT'LARI GÜÇLENDİRİLMİŞ FONKSİYONLAR ---

    async generateGrammarQuestions(level, count = 25) {
        // ... (levelDescriptions aynı kalıyor)
        const prompt = `Generate ${count} English grammar multiple-choice questions for ${level} level students.
        
        Return ONLY a valid JSON array. Do NOT include markdown ticks (\`\`\`) or any introductory text.
        The response MUST start with '[' and end with ']'.

        Exact structure:
        [
          {
            "question": "...",
            "options": ["...", "...", "...", "..."],
            "correct": 1,
            "topic": "...",
            "level": "...",
            "explanation": "..."
          }
        ]`;
        return await this.makeRequest(prompt, 'json');
    }

    async generateReadingQuestions(level, count = 5) {
        // ... (levelDescriptions aynı kalıyor)
        const prompt = `Generate ${count} English reading comprehension exercises for ${level} level students.
        
        Return ONLY a valid JSON array. Do NOT include markdown ticks (\`\`\`) or any explanatory text.
        The response MUST start with '[' and end with ']'.

        Exact structure:
        [
          {
            "passage": "...",
            "questions": [ { "question": "...", "options": [...], "correct": 0, ... } ]
          }
        ]`;
        return await this.makeRequest(prompt, 'json');
    }

    async generateLearningReport(answers, questions) {
        const analysis = this.analyzeAnswers(answers, questions);
        const prompt = `Based on this English test analysis, generate a comprehensive learning report.

        Test Results:
        ... (analiz verileri aynı) ...

        Return ONLY a valid JSON object. Do NOT use markdown ticks (\`\`\`).
        The response MUST start with '{' and end with '}'.

        Exact structure:
        {
          "level": "...",
          "levelDescription": "...",
          "strengths": [...],
          "weakAreas": [ { "topic": "...", ... } ],
          "overallRecommendations": [...],
          "nextSteps": [...]
        }`;
        return await this.makeRequest(prompt, 'json');
    }

    async translateToTurkish(reportText) {
        const prompt = `Translate the following English learning report to Turkish.

        English Report:
        ${reportText}

        Return ONLY a valid JSON object. Do NOT include markdown ticks (\`\`\`).
        The response MUST start with '{' and end with '}'.

        Exact structure:
        {
          "strengths": [...],
          "weakAreas": [...],
          "overallRecommendations": [...],
          "nextSteps": [...]
        }`;
        return await this.makeRequest(prompt, 'json');
    }
    
    // --- ANALİZ FONKSİYONLARI (DEĞİŞİKLİK YOK) ---
    analyzeAnswers(answers, questions) {
        // ... (Bu fonksiyonun içeriği tamamen aynı kalıyor)
        let correctAnswers = 0, grammarCorrect = 0, readingCorrect = 0, grammarTotal = 0, readingTotal = 0;
        const mistakesByTopic = {}, mistakesByLevel = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
        questions.forEach((q, i) => { /* ... aynı mantık ... */ });
        const accuracy = correctAnswers / questions.length || 0;
        let estimatedLevel = 'A1';
        if (accuracy >= 0.9) estimatedLevel = 'C1';
        else if (accuracy >= 0.8) estimatedLevel = 'B2';
        else if (accuracy >= 0.7) estimatedLevel = 'B1';
        else if (accuracy >= 0.6) estimatedLevel = 'A2';
        return { correctAnswers, totalQuestions: questions.length, grammarCorrect, grammarTotal, readingCorrect, readingTotal, mistakesByTopic, mistakesByLevel, estimatedLevel, accuracy };
    }
}

module.exports = GeminiService;