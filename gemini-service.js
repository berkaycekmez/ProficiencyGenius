const { GoogleGenerativeAI } = require("@google/generative-ai");

// API anahtarının Render'daki Ortam Değişkenlerinden (Environment Variables) gelip gelmediğini kontrol ediyoruz.
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set!");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Ücretsiz katmanda en stabil ve sorunsuz çalışan modele geri dönüyoruz.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Gemini'nin fazladan metin eklemesi durumunda JSON'ı ayıklamak için yardımcı fonksiyon.
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

    // --- SENİN ORİJİNAL, DETAYLI PROMPT'LARIN VE GÜÇLENDİRİLMİŞ TALİMATLARIN ---

    async generateGrammarQuestions(level, count = 25) {
        const prompt = `Generate ${count} English grammar multiple-choice questions for ${level} level students.
        
        Requirements:
        1. Progress from easier to harder within the ${level} level.
        2. Each question should have exactly 4 options.
        3. Cover diverse grammar topics appropriate for ${level}.

        CRITICAL INSTRUCTION: Your entire response must be ONLY a single, valid JSON array of objects. Do not use markdown like \`\`\`. Do not add any text before or after the JSON array. Your response must start with '[' and end with ']'.
        
        Use this exact JSON structure for each object in the array:
        {
          "question": "Complete the sentence: She ___ to work every day.",
          "options": ["go", "goes", "going", "gone"],
          "correct": 1,
          "topic": "Present Simple",
          "level": "A1",
          "explanation": "With third person singular subjects (she, he, it), we add 's' to the verb in present simple."
        }`;
        return await this.makeRequest(prompt, 'json');
    }

    async generateReadingQuestions(level, count = 5) {
        const prompt = `Generate ${count} English reading comprehension exercises for ${level} level students.
        
        Requirements:
        1. Each exercise should have a passage and a set of questions.
        2. Each question must have 4 multiple-choice options.
        
        CRITICAL INSTRUCTION: Your entire response must be ONLY a single, valid JSON array. Do not use markdown like \`\`\`. Do not add any text before or after the JSON array. Your response must start with '[' and end with ']'.
        
        Use this exact JSON structure:
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
        ]`;
        return await this.makeRequest(prompt, 'json');
    }

    async generateLearningReport(answers, questions) {
        const analysis = this.analyzeAnswers(answers, questions);
        const prompt = `Analyze the provided English test results and generate a comprehensive learning report.
        
        Test Results Data:
        - Score: ${analysis.correctAnswers}/${analysis.totalQuestions}
        - Estimated Level: ${analysis.estimatedLevel}
        - Mistakes by Topic: ${Object.entries(analysis.mistakesByTopic).map(([topic, data]) => `- ${topic}: ${data.wrong}/${data.total} incorrect`).join('\n')}

        CRITICAL INSTRUCTION: Your entire response must be ONLY a single, valid JSON object. Do not use markdown like \`\`\`. Do not add any text before or after the JSON object. Your response must start with '{' and end with '}'.
        
        Use this exact JSON structure:
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
        const prompt = `Translate the following English learning report to Turkish.
        
        English Report:
        ${reportText}

        CRITICAL INSTRUCTION: Return ONLY a valid JSON object. Do not use markdown. The response MUST start with '{' and end with '}'.
        
        Use this exact JSON structure with translated values:
        {
          "strengths": ["..."],
          "weakAreas": [ { "topic": "...", ... } ],
          "overallRecommendations": ["..."],
          "nextSteps": ["..."]
        }`;
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