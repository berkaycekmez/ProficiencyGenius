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
    return null; // JSON bulunamazsa null döndür
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
                            // SON HATA: Ayıklanmış metin bile JSON değilse, hatayı ve metni logla
                            console.error("!!! Could not parse even the extracted text. Gemini response was: !!!");
                            console.error(text);
                            throw new Error('Extracted text is not valid JSON.');
                        }
                    } else {
                        // HATA: Metnin içinde hiç JSON bulunamadıysa, hatayı ve metni logla
                        console.error("!!! Could not find any JSON in the response. Gemini response was: !!!");
                        console.error(text);
                        throw new Error('No JSON found in response text.');
                    }
                }
            }
            return text;
        } catch (error) {
            // ... (diğer hata yönetimi aynı)
            console.error('Gemini API request failed:', error.message);
            if (error.message && (error.message.includes('quota') || error.message.includes('RATE_LIMIT_EXCEEDED'))) {
                const quotaError = new Error('QUOTA_EXCEEDED');
                quotaError.isQuotaError = true;
                throw quotaError;
            }
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }

    async generateLearningReport(answers, questions) {
        const analysis = this.analyzeAnswers(answers, questions);
        
        // --- DAHA KATI HALE GETİRİLMİŞ RAPOR İSTEĞİ (PROMPT) ---
        const prompt = `Analyze the following English test results.
        
        Test Data:
        - Score: ${analysis.correctAnswers}/${analysis.totalQuestions}
        - Level: ${analysis.estimatedLevel}
        - Mistakes: ${Object.entries(analysis.mistakesByTopic).map(([topic, data]) => `- ${topic}: ${data.wrong}/${data.total}`).join('\n')}

        CRITICAL INSTRUCTION: Your entire response must be ONLY a single, valid JSON object.
        Do NOT add any text before or after the JSON object.
        Do NOT use markdown like \`\`\`json.
        Your response must start with { and end with }.

        Use this EXACT JSON structure:
        {
          "level": "${analysis.estimatedLevel}",
          "levelDescription": "A detailed description of this proficiency level.",
          "strengths": ["A list of strengths."],
          "weakAreas": [
            {
              "topic": "Name of a weak topic",
              "performance": "weak",
              "explanation": "Explanation of the weakness.",
              "recommendations": ["Recommendations for this topic."]
            }
          ],
          "overallRecommendations": ["General study advice."],
          "nextSteps": ["Actionable next steps."]
        }`;
        return await this.makeRequest(prompt, 'json');
    }

    // --- Diğer fonksiyonlar (generateGrammarQuestions, vb.) aynı kalabilir ---
    // ... (Önceki mesajdaki diğer fonksiyonların tamamı buraya gelecek) ...
    async generateGrammarQuestions(level, count = 25) { /* ... aynı kod ... */ }
    async generateReadingQuestions(level, count = 5) { /* ... aynı kod ... */ }
    analyzeAnswers(answers, questions) { /* ... aynı kod ... */ }
    async translateToTurkish(reportText) { /* ... aynı kod ... */ }
}

module.exports = GeminiService;