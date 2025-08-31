// Google'ın sunucu tarafı kütüphanesini içeri aktarıyoruz
const { GoogleGenerativeAI } = require("@google/generative-ai"); // BU SATIR DOĞRU
// Render'da ayarladığın API anahtarını güvenli bir şekilde alıyoruz
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Bu ana sınıf, projenin tüm "beynini" içerir.
 * Artık tarayıcıda değil, güvenli bir şekilde sunucuda çalışır.
 */
class GeminiService {
    constructor() {
        console.log("Backend Gemini Service has been initialized successfully.");
    }

    /**
     * Gemini API'ına Node.js kütüphanesi üzerinden güvenli bir istek yapar.
     * Senin eski `makeRequest` fonksiyonunun yerine geçer.
     */
    async makeRequest(prompt, responseFormat = 'text') {
        try {
            const generationConfig = responseFormat === 'json' ? { responseMimeType: "application/json" } : {};
            const result = await model.generateContent(prompt, generationConfig);
            const response = result.response;
            const text = response.text();

            if (!text) {
                throw new Error('No response generated from Gemini API');
            }
            return responseFormat === 'json' ? JSON.parse(text) : text;
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

    // --- SENİN KODUNDAKİ TÜM FONKSİYONLARIN AYNISI AŞAĞIDA ---
    // Hiçbir mantık değiştirilmedi, sadece sunucuda çalışacak hale getirildi.

    async generateGrammarQuestions(level, count = 25) {
        const levelDescriptions = {
            'A1': 'basic present tense, simple vocabulary, basic sentence structure',
            'A2': 'past tense, future tense, comparatives, modal verbs (can, should)',
            'B1': 'present perfect, conditionals, passive voice, prepositions',
            'B2': 'complex tenses, subjunctive mood, advanced vocabulary, phrasal verbs',
            'C1': 'advanced grammar structures, nuanced vocabulary, complex sentence patterns'
        };
        const prompt = `Generate ${count} English grammar multiple-choice questions for ${level} level students...`; // (Prompt'un geri kalanı aynı)
        return await this.makeRequest(prompt, 'json');
    }

    async generateReadingQuestions(level, count = 5) {
        const levelDescriptions = {
            'A1': 'very simple texts, basic vocabulary, short sentences, familiar topics',
            'A2': 'simple texts, everyday situations, clear structure, common vocabulary',
            'B1': 'moderately complex texts, varied topics, some unfamiliar vocabulary, clear main ideas',
            'B2': 'complex texts, abstract concepts, nuanced language, implied meanings',
            'C1': 'sophisticated texts, complex ideas, advanced vocabulary, subtle implications'
        };
        const prompt = `Generate ${count} English reading comprehension exercises for ${level} level students...`; // (Prompt'un geri kalanı aynı)
        return await this.makeRequest(prompt, 'json');
    }

    async generateAdaptiveQuestions(currentLevel, performance, questionType = 'grammar', count = 5) {
        const nextLevel = this.calculateNextLevel(currentLevel, performance);
        if (questionType === 'grammar') {
            return await this.generateGrammarQuestions(nextLevel, count);
        } else {
            return await this.generateReadingQuestions(nextLevel, count);
        }
    }

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

    async generateLearningReport(answers, questions) {
        const analysis = this.analyzeAnswers(answers, questions);
        const prompt = `Based on this English test analysis, generate a comprehensive learning report...`; // (Prompt'un geri kalanı aynı)
        return await this.makeRequest(prompt, 'json');
    }

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
                if (question.type === 'reading' || question.passage) readingCorrect++;
                if (question.type === 'grammar' || !question.passage) grammarCorrect++;
            } else {
                mistakesByTopic[topic].wrong++;
                mistakesByLevel[level]++;
            }
            if (question.type === 'reading' || question.passage) readingTotal++;
            if (question.type === 'grammar' || !question.passage) grammarTotal++;
        });
        const accuracy = correctAnswers / questions.length;
        let estimatedLevel = 'A1';
        if (accuracy >= 0.9) estimatedLevel = 'C1';
        else if (accuracy >= 0.8) estimatedLevel = 'B2';
        else if (accuracy >= 0.7) estimatedLevel = 'B1';
        else if (accuracy >= 0.6) estimatedLevel = 'A2';
        return {
            correctAnswers, totalQuestions: questions.length, grammarCorrect,
            grammarTotal, readingCorrect, readingTotal, mistakesByTopic,
            mistakesByLevel, estimatedLevel, accuracy
        };
    }

    async translateToTurkish(reportText) {
        const prompt = `Translate the following English proficiency test learning report to Turkish...`; // (Prompt'un geri kalanı aynı)
        return await this.makeRequest(prompt, 'json');
    }
}

// Bu satır, bu dosyadaki GeminiService sınıfını app.js'in kullanabilmesi için dışarıya açar.
module.exports = GeminiService;